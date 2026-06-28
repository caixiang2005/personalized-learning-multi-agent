"""
知识库 RAG 聊天服务
- 接收用户问题，从 PGVector 召回相关知识
- 结合上下文调用 DeepSeek 生成回答
- 保持对话历史（Redis，与未登录隔离）
"""

import asyncio
import os

from dotenv import load_dotenv

load_dotenv()

from utils.hf_env import configure_hf_mirror, load_sentence_transformer

configure_hf_mirror()

from openai import AsyncOpenAI
import httpx
from sentence_transformers import SentenceTransformer

from core.prompts import KNOWLEDGE_CHAT_PROMPT
from services.logger import capture_exception, log_error
from services.redis_client import _get_conn as get_redis

# ── LLM 客户端（与 unlogin_chat 一致） ──
_raw_url = (os.getenv("DEEPSEEK_API_URL") or "").rstrip("/")
if _raw_url.endswith("/chat/completions"):
    _raw_url = _raw_url[: -len("/chat/completions")]

_client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url=_raw_url or None,
    timeout=httpx.Timeout(timeout=120.0, connect=30.0),
    max_retries=2,
)
MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# ── Embedding 模型（惰性加载） ──
_embed_model: SentenceTransformer | None = None
EMBED_MODEL_NAME = "BAAI/bge-small-zh-v1.5"
EMBED_DIM = 512

# ── 检索参数 ──
TOP_K = 5
MAX_HISTORY_ROUNDS = 20

# Redis key 前缀（与 unlogin 隔离）
_KEY_PREFIX = "chat:" + MODEL + ":"


def _key(session_id: str) -> str:
    return f"{_KEY_PREFIX}{session_id}"


# ── 加载 embedding 模型 ──

def _get_embedder() -> SentenceTransformer:
    global _embed_model
    if _embed_model is None:
        local_path = os.getenv("EMBED_MODEL_PATH", "").strip() or None
        _embed_model = load_sentence_transformer(EMBED_MODEL_NAME, local_path=local_path)
    return _embed_model


# ── 向量化 ──

async def embed_text(text: str) -> list[float]:
    model = _get_embedder()
    vec = model.encode(text, normalize_embeddings=True, show_progress_bar=False)
    return vec.tolist()


# ── 知识库检索 ──

async def search_knowledge(query_vec: list[float]) -> list[dict]:
    """从 PGVector 召回 top-k 相关 chunks"""
    loop = asyncio.get_event_loop()

    def _sync_search():
        import psycopg2
        from pgvector.psycopg2 import register_vector
        conn = psycopg2.connect(
            host=os.environ.get("PG_HOST", "127.0.0.1"),
            port=int(os.environ.get("PG_PORT", "5432")),
            user=os.environ.get("PG_USER", "postgres"),
            password=os.environ.get("PG_PASSWORD", ""),
            dbname=os.environ.get("PG_DATABASE", "postgres"),
        )
        register_vector(conn)
        cur = conn.cursor()
        cur.execute("""
            SELECT content,
                   metadata->>'title'       AS title,
                   metadata->>'source'      AS source,
                   metadata->>'category'    AS category,
                   metadata->>'section'     AS section,
                   metadata->>'level'       AS level
            FROM knowledge_chunks
            WHERE collection = 'runoob'
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """, (query_vec, TOP_K))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return rows

    return await loop.run_in_executor(None, _sync_search)


# ── 对话历史 ──

async def load_history(session_id: str) -> list:
    r = await get_redis()
    data = await r.get(_key(session_id))
    import json
    return json.loads(data) if data else []


async def save_history(session_id: str, messages: list, ttl: int = 7200):
    import json
    r = await get_redis()
    await r.setex(_key(session_id), ttl, json.dumps(messages))


# ── 构建参考上下文 ──

def build_context(chunks: list[dict]) -> str:
    """将检索到的 chunks 格式化为 AI 参考上下文"""
    if not chunks:
        return ""
    parts = []
    for i, c in enumerate(chunks, 1):
        source = c.get("source", "")
        title = c.get("title", "")
        section = c.get("section", "")
        category = c.get("category", "")
        content = c.get("content", "")
        header = f"[{i}] 《{title}》- {section}（{category}）"
        if source:
            header += f"\n    来源：{source}"
        parts.append(f"{header}\n{content}")
    return "\n\n---\n\n".join(parts)


# ── 流式管道：接收问题 → 嵌入 → 检索 → 上下文 → LLM → 存储（实时 SSE 推送）──

async def stream_knowledge_reply(
    user_input: str,
    session_id: str,
):
    """带知识库增强的流式对话，每个阶段 yield 进度事件。

    yield 格式: {"type": "stage", "stage": "<id>", "status": "processing|done|error", "detail": "…"}
                {"type": "token", "content": "…"}
                {"type": "done", "reply": "完整回复"}
    """
    if not _client.api_key:
        yield {"type": "stage", "stage": "error", "status": "error", "detail": "API Key 未配置"}
        yield {"type": "done", "reply": "服务配置错误，请联系管理员。"}
        return

    # ── Stage 1: 知识检索（嵌入 + 向量搜索）──
    yield {"type": "stage", "stage": "search", "status": "processing", "detail": "向量化问题语义…"}
    chunks = []
    try:
        query_vec = await embed_text(user_input)
        yield {"type": "stage", "stage": "search", "status": "processing", "detail": "检索知识库…"}
        chunks = await search_knowledge(query_vec)
    except Exception as e:
        await capture_exception(e, session_id, "知识库检索失败")
        chunks = []
    yield {"type": "stage", "stage": "search", "status": "done",
           "detail": f"检索到 {len(chunks)} 条相关知识"}

    # ── Stage 2: 上下文构建（加载历史 + 拼接知识）──
    yield {"type": "stage", "stage": "context", "status": "processing", "detail": "加载对话历史…"}
    try:
        history = await load_history(session_id)
    except Exception as e:
        await capture_exception(e, session_id, "Redis load_history 失败")
        history = []
    context = build_context(chunks)
    system_prompt = KNOWLEDGE_CHAT_PROMPT
    if context:
        system_prompt += f"\n\n## 本次检索到的知识上下文\n{context}"
    if not chunks:
        system_prompt += "\n\n【注意】本次未检索到相关知识库内容，请用你自己的知识回答，并告知用户。"
    yield {"type": "stage", "stage": "context", "status": "done",
           "detail": f"加载 {len(history)} 条历史 · {len(chunks)} 条参考"}

    # ── Stage 3: AI 生成（DeepSeek 流式调用）──
    yield {"type": "stage", "stage": "generate", "status": "processing", "detail": "DeepSeek 生成回答…"}
    history.append({"role": "user", "content": user_input})
    messages = [{"role": "system", "content": system_prompt}, *history]

    full_reply = ""
    try:
        stream = await _client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=2048,
            stream=True,
        )
        async for chunk in stream:
            delta = (chunk.choices[0].delta.content or "") if (chunk.choices and chunk.choices[0].delta) else ""
            if delta:
                full_reply += delta
                yield {"type": "token", "content": delta}
    except Exception as e:
        await capture_exception(e, session_id, "DeepSeek API 调用失败")
        full_reply = "抱歉，系统繁忙，请稍后再试。"
        yield {"type": "token", "content": full_reply}

    yield {"type": "stage", "stage": "generate", "status": "done",
           "detail": f"生成 {len(full_reply)} 字符"}

    # ── Stage 4: 记忆存储 ──
    yield {"type": "stage", "stage": "memory", "status": "processing", "detail": "存储对话记忆…"}
    history.append({"role": "assistant", "content": full_reply})
    history = history[-(MAX_HISTORY_ROUNDS * 2 + 1):]
    try:
        await save_history(session_id, history)
        yield {"type": "stage", "stage": "memory", "status": "done", "detail": "对话已保存"}
    except Exception as e:
        await capture_exception(e, session_id, "Redis save_history 失败")
        yield {"type": "stage", "stage": "memory", "status": "error", "detail": "记忆保存失败"}

    yield {"type": "done", "reply": full_reply}


# ── 主流程：接收问题 → 检索 → 生成回答（非流式，兼容旧调用）──

async def get_knowledge_reply(
    user_input: str,
    session_id: str,
) -> str:
    """带知识库增强的学习辅导对话"""

    if not _client.api_key:
        await log_error("CONFIG_ERROR", "DEEPSEEK_API_KEY 未配置", session_id)
        return "服务配置错误，请联系管理员。"

    # 1. 检索相关知识
    try:
        query_vec = await embed_text(user_input)
        chunks = await search_knowledge(query_vec)
    except Exception as e:
        await capture_exception(e, session_id, "知识库检索失败")
        chunks = []

    # 2. 加载历史
    try:
        history = await load_history(session_id)
    except Exception as e:
        await capture_exception(e, session_id, "Redis load_history 失败")
        history = []

    # 3. 构建上下文
    context = build_context(chunks)
    system_prompt = KNOWLEDGE_CHAT_PROMPT
    if context:
        system_prompt += f"\n\n## 本次检索到的知识上下文\n{context}"
    if not chunks:
        system_prompt += "\n\n【注意】本次未检索到相关知识库内容，请用你自己的知识回答，并告知用户。"

    # 4. 调用 LLM
    history.append({"role": "user", "content": user_input})
    messages = [
        {"role": "system", "content": system_prompt},
        *history,
    ]

    try:
        resp = await _client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=2048,
        )
        reply = resp.choices[0].message.content or ""
    except Exception as e:
        await capture_exception(e, session_id, "DeepSeek API 调用失败")
        return "抱歉，系统繁忙，请稍后再试。"

    # 5. 保存历史
    history.append({"role": "assistant", "content": reply})
    history = history[-(MAX_HISTORY_ROUNDS * 2 + 1):]  # 截断
    try:
        await save_history(session_id, history)
    except Exception as e:
        await capture_exception(e, session_id, "Redis save_history 失败")

    return reply
