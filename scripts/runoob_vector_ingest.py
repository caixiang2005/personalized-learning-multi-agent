#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
菜鸟教程 → PGVector 向量库入库脚本（高质量版）

设计原则:
  - 可扩展: collection 字段区分知识源，后续加其他文档只需改 collection 名
  - 幂等安全: 重复执行不会产生重复数据
  - 高质量分块: 不切断代码块、保留标题层级、中文边界感知
  - 增量更新: 新增/修改的文件自动识别，无需全量重跑

用法:
  pip install sentence-transformers psycopg2-binary pgvector tqdm
  python scripts/runoob_vector_ingest.py
"""

import os
import re
import sys
import yaml
import hashlib
import psycopg2
import psycopg2.extras
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# ────────────────────────── 配置 ──────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / 'backend' / 'agent-service' / '.env'
KNOWLEDGE_DIR = PROJECT_ROOT / 'knowledge' / 'runoob'
VECTOR_DIM = 512  # bge-small-zh-v1.5 的维度

# 从 .env 加载配置
def load_env():
    if not ENV_FILE.exists():
        print(f'⚠️ 未找到 {ENV_FILE}，使用默认值')
        return
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

load_env()

DB_CONFIG = {
    'host': os.environ.get('PG_HOST', 'localhost'),
    'port': int(os.environ.get('PG_PORT', 5432)),
    'user': os.environ.get('PG_USER', 'postgres'),
    'password': os.environ.get('PG_PASSWORD', ''),
    'dbname': os.environ.get('PG_DATABASE', 'project_db'),
}

# embedding 模型（可配置，后续切换只需改这里）
EMBEDDING_MODEL = os.environ.get('EMBEDDING_MODEL', 'BAAI/bge-small-zh-v1.5')

# ──────────────── 高质量分块参数 ────────────────

CHUNK_MAX_CHARS = 600     # 每个 chunk 最大字符数（中文约 600 字一段）
CHUNK_MIN_CHARS = 100     # 小于此值则合并到上一块
CHUNK_OVERLAP_CHARS = 80  # chunk 间重叠字符数

# ──────────────────── 数据库 Schema ────────────────────
#
# 通用设计: 一个表支持多知识源
# - collection = 'runoob'  → 菜鸟教程
# - collection = 'docs'    → 后续官方文档
# - collection = 'books'   → 后续技术书籍
#
# 查询示例:
#   SELECT * FROM knowledge_chunks
#   WHERE collection = 'runoob'
#   ORDER BY embedding <=> '[向量]'
#   LIMIT 5;

# ──────────────────── 工具函数 ────────────────────

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f'  [{ts}] {msg}')


def parse_md_file(filepath):
    """
    解析 .md 文件，返回 (metadata_dict, body_text)
    兼容没有 frontmatter 的文件
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        raw = f.read()

    fm_match = re.match(r'^---\n(.*?)\n---\n(.*)', raw, re.DOTALL)
    if not fm_match:
        return {}, raw.strip()

    try:
        metadata = yaml.safe_load(fm_match.group(1)) or {}
    except Exception:
        metadata = {}

    body = fm_match.group(2).strip()
    return metadata, body


def split_smart(text):
    """
    高质量分块：以 ## 标题为主分割线，同时保证：
    1. 不切开 ```code``` 代码块
    2. 不切开行内代码 `xxx`
    3. 每块不少于 CHUNK_MIN_CHARS
    4. 超过 CHUNK_MAX_CHARS 时在段落边界截断
    """
    # 保护代码块
    code_blocks = []
    code_counter = 0

    def protect_code(m):
        nonlocal code_counter
        placeholder = f'\n__CODE_BLOCK_{code_counter}__\n'
        code_blocks.append(m.group(0))
        code_counter += 1
        return placeholder

    # 先保护代码块，防止分割时被切断
    protected = re.sub(r'```.*?\n.*?```', protect_code, text, flags=re.DOTALL)

    # 再保护行内代码
    inline_codes = []

    def protect_inline(m):
        inline_codes.append(m.group(0))
        return f'__INLINE_CODE_{len(inline_codes) - 1}__'

    protected = re.sub(r'`[^`]+`', protect_inline, protected)

    # 按 ## 标题分割
    raw_sections = re.split(r'(?=^## )', protected, flags=re.MULTILINE)
    sections = []
    current_section = '概述'

    for sec in raw_sections:
        sec = sec.strip()
        if not sec:
            continue

        title_match = re.match(r'^## (.+)', sec)
        if title_match:
            current_section = title_match.group(1).strip()

        sections.append({
            'heading': current_section,
            'text': sec,
        })

    # 合并短区块、切分长区块
    chunks = []
    buffer = ''

    for sec in sections:
        heading = sec['heading']
        text = sec['text']

        if not buffer:
            buffer = text
        elif len(buffer) + len(text) < CHUNK_MAX_CHARS * 1.5:
            buffer += '\n\n' + text
        else:
            chunks.append({'content': buffer, 'section': heading})
            buffer = text

    if buffer.strip():
        chunks.append({'content': buffer, 'section': sections[-1]['heading'] if sections else '概述'})

    # 恢复代码块和行内代码
    result = []
    for ch in chunks:
        content = ch['content']
        # 恢复行内代码
        for i, code in enumerate(inline_codes):
            content = content.replace(f'__INLINE_CODE_{i}__', code)
        # 恢复代码块
        for i, code in enumerate(code_blocks):
            content = content.replace(f'__CODE_BLOCK_{i}__', code)
        result.append({
            'content': content.strip(),
            'section': ch['section'],
        })

    return result


def _detect_level(section_title, content, tutorial):
    """根据章节标题和内容判断难度: 入门/中级/高级"""
    text = f'{section_title} {content[:200]}'.lower()
    for kw in ['高级', '深入', '精通', '优化', '性能', '底层']:
        if kw in text:
            return '高级'
    for kw in ['中级', '进阶', '提高', '进阶', '实践']:
        if kw in text:
            return '中级'
    if any(kw in tutorial.lower() for kw in ['advanced', '高级', 'deep']):
        return '高级'
    return '入门'


def build_chunks(filepath, collection='runoob'):
    """
    处理一个 .md 文件，返回 chunks 列表
    每个 chunk: {id, collection, content, metadata, char_count}
    """
    metadata, body = parse_md_file(filepath)

    if not body:
        return []

    raw_chunks = split_smart(body)

    # 获取分类/教程路径信息
    parts = Path(os.path.relpath(filepath, KNOWLEDGE_DIR)).parts
    category = parts[0] if len(parts) > 0 else ''
    tutorial = parts[1] if len(parts) > 1 else ''

    result = []
    seen_hashes = set()

    for i, rc in enumerate(raw_chunks):
        # 用内容 hash 作为 ID（用于去重）
        content_hash = hashlib.sha256(rc['content'].encode()).hexdigest()[:32]
        if content_hash in seen_hashes:
            continue
        seen_hashes.add(content_hash)

        chunk_meta = {
            'title': metadata.get('title', ''),
            'source': metadata.get('source', ''),
            'category': category,        # 顶层分类：Python 数据科学 / 前端开发 / 数据库
            'tutorial': tutorial,        # 具体教程：python3 / fastapi / html
            'section': rc['section'],    # 章节名
            'level': _detect_level(rc['section'], rc['content'], tutorial),
            'chunk_index': i,
        }

        result.append({
            'id': content_hash,
            'collection': collection,
            'content': rc['content'],
            'metadata': chunk_meta,
            'char_count': len(rc['content']),
        })

    return result


# ───────────────────── 主流程 ─────────────────────

def main():
    print('=' * 65)
    print('📦 知识库 → PGVector 入库（高质量版）')
    print('=' * 65)

    # ── 检查目录 ──
    if not KNOWLEDGE_DIR.exists():
        print(f'\n❌ 未找到知识库目录: {KNOWLEDGE_DIR}')
        print('   请先运行爬虫脚本获取数据')
        sys.exit(1)

    # ── 加载 embedding 模型 ──
    print(f'\n🧠 加载 embedding 模型: {EMBEDDING_MODEL}')
    print('   ⏳ 首次运行会下载约 200MB 模型文件...')
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(EMBEDDING_MODEL)
        print(f'   ✅ 模型加载完成（维度: {model.get_sentence_embedding_dimension()}）')
    except ImportError:
        print('\n❌ 请先安装依赖: pip install sentence-transformers')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ 模型加载失败: {e}')
        sys.exit(1)

    # ── 扫描文件 ──
    md_files = sorted(KNOWLEDGE_DIR.rglob('*.md'))
    md_files = [f for f in md_files if f.name != '_index.md']
    print(f'\n📄 发现 {len(md_files)} 个 Markdown 文件')

    # ── 解析并分块 ──
    print(f'\n🔪 解析并分块...')
    all_chunks = []
    file_ok = 0
    file_skip = 0
    for fp in md_files:
        try:
            chunks = build_chunks(fp, collection='runoob')
            if chunks:
                all_chunks.extend(chunks)
                file_ok += 1
            else:
                file_skip += 1
        except Exception as e:
            file_skip += 1

    print(f'   ✅ 成功: {file_ok} 个文件, 跳过: {file_skip} 个')
    print(f'   📊 总计 {len(all_chunks)} 个 chunks (平均 {sum(c["char_count"] for c in all_chunks) // len(all_chunks)} 字/块)')

    # ── 连接数据库 ──
    print(f'\n🔗 连接 PGVector: {DB_CONFIG["host"]}:{DB_CONFIG["port"]}/{DB_CONFIG["dbname"]}')
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        # 先启用了 vector 扩展，再注册类型
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        conn.commit()
        from pgvector.psycopg2 import register_vector
        register_vector(conn)
        # 建表
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS knowledge_chunks (
                id            VARCHAR(32) PRIMARY KEY,
                collection    VARCHAR(32) NOT NULL DEFAULT 'runoob',
                content       TEXT NOT NULL,
                metadata      JSONB NOT NULL DEFAULT '{{}}',
                embedding     vector({VECTOR_DIM}),
                char_count    INTEGER NOT NULL DEFAULT 0,
                created_at    TIMESTAMP DEFAULT NOW(),
                updated_at    TIMESTAMP DEFAULT NOW()
            );
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
            ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_metadata ON knowledge_chunks USING gin (metadata);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_collection ON knowledge_chunks (collection);")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_dedup ON knowledge_chunks (collection, id);")
        # 字段注释
        cur.execute("COMMENT ON TABLE knowledge_chunks IS '知识库向量切片表（支持多知识源）';")
        cur.execute("COMMENT ON COLUMN knowledge_chunks.id IS '内容 SHA256 哈希（去重主键）';")
        cur.execute("COMMENT ON COLUMN knowledge_chunks.collection IS '知识源标识：runoob / docs / books ...';")
        cur.execute("COMMENT ON COLUMN knowledge_chunks.content IS 'chunk 原文（按标题切分后的片段）';")
        cur.execute("COMMENT ON COLUMN knowledge_chunks.metadata IS '元数据 {title,source,category,tutorial,section,level,chunk_index}';")
        cur.execute("COMMENT ON COLUMN knowledge_chunks.embedding IS 'BGE 中文向量 (512维, cosine 相似度)';")
        cur.execute("COMMENT ON COLUMN knowledge_chunks.char_count IS 'chunk 字符数';")
        cur.execute("COMMENT ON COLUMN knowledge_chunks.created_at IS '首次入库时间';")
        cur.execute("COMMENT ON COLUMN knowledge_chunks.updated_at IS '最近更新时间';")
        conn.commit()
        print('   ✅ 数据库连接成功，Schema 已就绪')
    except Exception as e:
        print(f'\n❌ 数据库连接失败: {e}')
        print('   请检查: 服务器是否可达、.env 中的 PG_* 配置是否正确')
        sys.exit(1)

    # ── 增量写入 ──
    print(f'\n💾 写入向量库...')

    # 获取已存在的 ID
    cur.execute("SELECT id FROM knowledge_chunks WHERE collection = 'runoob'")
    existing_ids = set(row[0] for row in cur.fetchall())
    print(f'   数据库已有: {len(existing_ids)} 条 (collection=runoob)')

    # 过滤出新 chunk
    new_chunks = [c for c in all_chunks if c['id'] not in existing_ids]
    skipped = len(all_chunks) - len(new_chunks)
    print(f'   待写入: {len(new_chunks)} 条 (已存在跳过: {skipped} 条)')

    if not new_chunks:
        print('\n✅ 全部已是最新，无需写入！')
        cur.close()
        conn.close()
        return

    # 批量生成向量并写入
    from tqdm import tqdm
    BATCH = 50
    total_ok = 0
    total_err = 0

    for i in tqdm(range(0, len(new_chunks), BATCH), desc='   Writing to PGVector', unit='batch'):
        batch = new_chunks[i:i + BATCH]

        texts = [c['content'] for c in batch]
        embeddings = model.encode(texts, normalize_embeddings=True)

        for chunk, emb in zip(batch, embeddings):
            try:
                cur.execute("""
                    INSERT INTO knowledge_chunks (id, collection, content, metadata, embedding, char_count)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id, collection) DO UPDATE
                        SET metadata = EXCLUDED.metadata,
                            updated_at = NOW()
                """, (
                    chunk['id'], chunk['collection'], chunk['content'],
                    psycopg2.extras.Json(chunk['metadata']),
                    emb.tolist(), chunk['char_count'],
                ))
                total_ok += 1
            except Exception:
                total_err += 1

        conn.commit()

        if (i // BATCH) % 20 == 0 and i > 0:
            log(f'{min((i+BATCH)/len(new_chunks)*100,100):.0f}% ({total_ok} written)')

    cur.close()
    conn.close()

    # ── 完成 ──
    print(f'\n{"="*65}')
    print('🎉 入库完成！')
    print(f'{"="*65}')
    print(f'   知识源: runoob（菜鸟教程）')
    print(f'   总 chunks: {len(all_chunks)}')
    print(f'   新增写入: {total_ok}')
    print(f'   已存在跳过: {skipped}')
    print(f'   错误: {total_err}')
    print(f'   表名: knowledge_chunks')
    print(f'   向量维度: {VECTOR_DIM}（cosine 相似度）')
    print()
    print(f'   后续加其他知识源:')
    print(f'     collection=\"official_docs\" → 官方文档')
    print(f'     collection=\"books\"        → 技术书籍')
    print(f'     只需改 collection 参数即可共存')


if __name__ == '__main__':
    main()
