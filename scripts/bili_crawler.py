#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
B站编程教程爬虫
- 按 knowledge/runoob 的子模块搜对应 B站视频
- order=click 按播放量排序，取最火的
- BGE 向量化 → 写入 PGVector video_resources 表
- 进度输出到 _progress.json 供 GUI 读取
"""

import os
import sys
import json
import time
import hashlib
import re
import urllib.request
import urllib.parse
import traceback
from datetime import datetime

# ── 确保 UTF-8 ──
sys.stdout.reconfigure(encoding='utf-8')

# ── 路径 ──
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(PROJECT_ROOT, 'backend', 'agent-service', '.env')
PROGRESS_FILE = os.path.join(PROJECT_ROOT, 'scripts', '_bili_progress.json')

# ── 加载 .env ──
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

# ── 配置 ──
TOP_K = 15              # 每个搜索词取前 15 条
MIN_PLAY = 5000         # 最少播放量
MIN_DURATION = 60       # 最短时长（秒）
MAX_PAGES = 2           # 每词翻 2 页

# ── B站搜索头 ──
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.bilibili.com/",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

# ── 子模块 → B站搜索词 映射 ──
# (分类, 子模块, 搜索关键词)
SEARCH_ITEMS = [
    # ── Python 数据科学 ──
    ("Python 数据科学", "python3", "Python教程"),
    ("Python 数据科学", "django", "Django教程"),
    ("Python 数据科学", "fastapi", "FastAPI教程"),
    ("Python 数据科学", "flask", "Flask教程"),
    ("Python 数据科学", "numpy", "NumPy教程"),
    ("Python 数据科学", "pandas", "Pandas数据分析教程"),
    ("Python 数据科学", "matplotlib", "Matplotlib数据可视化"),
    ("Python 数据科学", "scipy", "SciPy教程"),
    ("Python 数据科学", "r", "R语言教程"),

    # ── 前端开发 ──
    ("前端开发", "vue3", "Vue3教程"),
    ("前端开发", "vue2", "Vue2教程"),
    ("前端开发", "react", "React教程"),
    ("前端开发", "angularjs", "Angular教程"),
    ("前端开发", "js", "JavaScript教程"),
    ("前端开发", "typescript", "TypeScript教程"),
    ("前端开发", "css3", "CSS3教程"),
    ("前端开发", "html", "HTML教程"),
    ("前端开发", "jquery", "jQuery教程"),
    ("前端开发", "bootstrap5", "Bootstrap5教程"),
    ("前端开发", "nextjs", "Next.js教程"),
    ("前端开发", "tailwindcss", "Tailwind CSS教程"),
    ("前端开发", "echarts", "ECharts教程"),
    ("前端开发", "nodejs", "Node.js教程"),

    # ── 后端开发 ──
    ("后端开发", "java", "Java教程"),
    ("后端开发", "go", "Go语言教程"),
    ("后端开发", "rust", "Rust教程"),
    ("后端开发", "php", "PHP教程"),
    ("后端开发", "csharp", "C#教程"),
    ("后端开发", "linux", "Linux教程"),
    ("后端开发", "docker", "Docker教程"),

    # ── 数据库 ──
    ("数据库", "mysql", "MySQL教程"),
    ("数据库", "redis", "Redis教程"),
    ("数据库", "mongodb", "MongoDB教程"),
    ("数据库", "postgresql", "PostgreSQL教程"),
    ("数据库", "sql", "SQL教程"),
    ("数据库", "sqlite", "SQLite教程"),

    # ── AI 智能开发 ──
    ("AI 智能开发", "ml", "机器学习入门教程"),
    ("AI 智能开发", "pytorch", "PyTorch教程"),
    ("AI 智能开发", "tensorflow", "TensorFlow教程"),
    ("AI 智能开发", "nlp", "NLP自然语言处理教程"),
    ("AI 智能开发", "opencv", "OpenCV教程"),
    ("AI 智能开发", "langchain", "LangChain教程"),
    ("AI 智能开发", "ollama", "Ollama教程"),
    ("AI 智能开发", "selenium", "Selenium教程"),
    ("AI 智能开发", "playwright", "Playwright教程"),
    ("AI 智能开发", "ai-agent", "AI Agent智能体教程"),

    # ── 编程语言 ──
    ("编程语言", "c", "C语言教程"),
    ("编程语言", "cplusplus", "C++教程"),
    ("编程语言", "lua", "Lua教程"),
    ("编程语言", "perl", "Perl教程"),
    ("编程语言", "ruby", "Ruby教程"),
    ("编程语言", "scala", "Scala教程"),
    ("编程语言", "zig", "Zig语言教程"),

    # ── 计算机基础 ──
    ("计算机基础", "data-structures", "数据结构与算法教程"),
    ("计算机基础", "design-pattern", "设计模式教程"),
    ("计算机基础", "regexp", "正则表达式教程"),
    ("计算机基础", "tcpip", "TCP IP协议教程"),
    ("计算机基础", "http", "HTTP协议教程"),

    # ── DevOps 工程化 ──
    ("DevOps 工程化", "git", "Git教程"),
    ("DevOps 工程化", "vscode", "VSCode教程"),
    ("DevOps 工程化", "pycharm", "PyCharm教程"),
    ("DevOps 工程化", "obsidian", "Obsidian教程"),
    ("DevOps 工程化", "maven", "Maven教程"),

    # ── 移动开发 ──
    ("移动开发", "flutter", "Flutter教程"),
    ("移动开发", "kotlin", "Kotlin教程"),
    ("移动开发", "swift", "Swift教程"),
    ("移动开发", "ionic", "Ionic教程"),

    # ── 网站建设 ──
    ("网站建设", "web", "网站开发教程"),

    # ── .NET ──
    (".NET", "aspnet", "ASP.NET教程"),
    (".NET", "powershell", "PowerShell教程"),
]


# ═══════════════════════════════════════════
#  B站 API
# ═══════════════════════════════════════════

def clean_html(text: str) -> str:
    return re.sub(r'</?em[^>]*>', '', text)


def parse_duration(dur_str: str) -> int:
    """B站 duration 格式可能是 MM:SS 或秒数，统一转成秒"""
    if not dur_str:
        return 0
    if ':' in dur_str:
        parts = dur_str.split(':')
        if len(parts) == 2:
            try:
                return int(parts[0]) * 60 + int(parts[1])
            except ValueError:
                return 0
    try:
        return int(float(dur_str))
    except (ValueError, TypeError):
        return 0


def search_bilibili(keyword: str, page: int = 1, retry: int = 2) -> list[dict]:
    """调 B站搜索 API（order=click 按播放量排序）"""
    url = (
        f"https://api.bilibili.com/x/web-interface/search/type"
        f"?search_type=video&keyword={urllib.parse.quote(keyword)}"
        f"&order=click&page={page}"
    )
    req = urllib.request.Request(url, headers=HEADERS)

    for attempt in range(retry):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            break
        except Exception as e:
            if attempt < retry - 1:
                time.sleep(1)
                continue
            print(f"    ⚠ 请求失败: {e}")
            return []

    if data.get("code") != 0:
        print(f"    ⚠ API 错误: {data.get('message', '')}")
        return []

    results = data.get("data", {}).get("result", [])
    out = []
    for r in results:
        bvid = r.get("bvid", "")
        if not bvid:
            continue
        out.append({
            "bvid": bvid,
            "title": clean_html(r.get("title", "")),
            "author": r.get("author", ""),
            "play": int(r.get("play", 0)),
            "duration": r.get("duration", "0"),
            "description": r.get("description", "").strip(),
            "tag": r.get("tag", ""),
        })
    return out


def fetch_all_videos() -> list[dict]:
    """遍历所有搜索词，汇总去重后的视频列表"""
    all_videos = []
    seen_bvids = set()
    total = len(SEARCH_ITEMS)
    category_stats = {}   # {category: {"subs": {sub: found_count}}}

    for idx, (category, sub, keyword) in enumerate(SEARCH_ITEMS, 1):
        cat_videos = []
        for page in range(1, MAX_PAGES + 1):
            results = search_bilibili(keyword, page)
            for r in results:
                if r["bvid"] in seen_bvids:
                    continue
                if r["play"] < MIN_PLAY:
                    continue
                dur_sec = parse_duration(r["duration"])
                if dur_sec < MIN_DURATION:
                    continue

                seen_bvids.add(r["bvid"])
                video = {
                    "bvid": r["bvid"],
                    "title": r["title"],
                    "author": r["author"],
                    "play_count": r["play"],
                    "duration_seconds": dur_sec,
                    "description": r["description"],
                    "tags": r["tag"],
                    "url": f"https://www.bilibili.com/video/{r['bvid']}",
                    "category": category,
                    "sub_module": sub,
                    "content": f"{r['title']} {r['description']}",
                }
                cat_videos.append(video)

            time.sleep(0.4)  # 礼貌间隔

        all_videos.extend(cat_videos)

        # 进度
        if category not in category_stats:
            category_stats[category] = {"subs": {}, "found": 0}
        category_stats[category]["subs"][sub] = len(cat_videos)
        category_stats[category]["found"] += len(cat_videos)

        _write_progress({
            "phase": "爬取中",
            "current": f"{category} / {sub}",
            "progress": (idx, total),
            "videos_found": len(all_videos),
            "categories": [
                {"name": c, "found": s["found"], "subs": [
                    {"name": s2, "count": c2} for s2, c2 in s["subs"].items()
                ]}
                for c, s in category_stats.items()
            ],
        })

        print(f"  [{idx}/{total}] {category}/{sub} → {keyword} → 找到 {len(cat_videos)} 条")

    return all_videos


# ═══════════════════════════════════════════
#  Embedding
# ═══════════════════════════════════════════

def load_embedder():
    from sentence_transformers import SentenceTransformer
    print("\n🔄 加载 BGE 模型...")
    model = SentenceTransformer("BAAI/bge-small-zh-v1.5")
    return model


def embed_videos(model, videos: list[dict], batch_size: int = 32):
    """批量生成 embedding，写入 video 对象"""
    total = len(videos)
    texts = [v["content"][:512] for v in videos]  # 截断超长文本
    all_vecs = []

    for i in range(0, total, batch_size):
        batch = texts[i:i + batch_size]
        vecs = model.encode(batch, normalize_embeddings=True, show_progress_bar=False)
        all_vecs.extend(vecs.tolist())
        _write_progress_embed(i + len(batch), total)
        print(f"  🔄 向量化: {min(i+batch_size, total)}/{total}")

    for v, vec in zip(videos, all_vecs):
        v["embedding"] = vec

    return videos


# ═══════════════════════════════════════════
#  Database
# ═══════════════════════════════════════════

def get_db_config():
    return {
        "host": os.environ.get("PG_HOST", "127.0.0.1"),
        "port": int(os.environ.get("PG_PORT", "5432")),
        "user": os.environ.get("PG_USER", "postgres"),
        "password": os.environ.get("PG_PASSWORD", ""),
        "dbname": os.environ.get("PG_DATABASE", "postgres"),
    }


def ensure_table():
    """创建 video_resources 表（如果不存在）"""
    import psycopg2
    from pgvector.psycopg2 import register_vector
    cfg = get_db_config()
    conn = psycopg2.connect(**cfg)
    register_vector(conn)
    cur = conn.cursor()
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS video_resources (
            id               VARCHAR(32) PRIMARY KEY,
            bvid             VARCHAR(20) UNIQUE NOT NULL,
            title            VARCHAR(500) NOT NULL,
            url              TEXT NOT NULL,
            author           VARCHAR(200),
            play_count       BIGINT DEFAULT 0,
            duration_seconds INT DEFAULT 0,
            description      TEXT,
            tags             TEXT,
            category         VARCHAR(50),
            sub_module       VARCHAR(50),
            content          TEXT,
            embedding        vector(512),
            metadata         JSONB DEFAULT '{}',
            created_at       TIMESTAMP DEFAULT NOW(),
            updated_at       TIMESTAMP DEFAULT NOW()
        )
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_video_embedding
        ON video_resources USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_video_category ON video_resources (category)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_video_play ON video_resources (play_count DESC)")
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_video_bvid ON video_resources (bvid)")
    conn.commit()
    cur.close()
    conn.close()
    print("  ✅ video_resources 表已就绪")


def insert_videos(videos: list[dict]) -> tuple[int, int]:
    """写入数据库，返回 (插入数, 更新数)"""
    import psycopg2
    from pgvector.psycopg2 import register_vector
    cfg = get_db_config()
    conn = psycopg2.connect(**cfg)
    register_vector(conn)
    cur = conn.cursor()

    inserted = 0
    updated = 0
    now = datetime.now()

    for v in videos:
        vid = hashlib.sha256(v["bvid"].encode()).hexdigest()[:32]
        cur.execute("""
            INSERT INTO video_resources
                (id, bvid, title, url, author, play_count, duration_seconds,
                 description, tags, category, sub_module, content, embedding,
                 metadata, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (bvid) DO UPDATE SET
                play_count = EXCLUDED.play_count,
                updated_at = EXCLUDED.updated_at
        """, (
            vid, v["bvid"], v["title"], v["url"], v["author"],
            v["play_count"], v["duration_seconds"],
            v["description"], v["tags"], v["category"], v["sub_module"],
            v["content"], v["embedding"],
            json.dumps({
                "category": v["category"],
                "sub_module": v["sub_module"],
                "duration_seconds": v["duration_seconds"],
            }),
            now, now,
        ))
        if cur.rowcount == 1:
            inserted += 1
        else:
            updated += 1

    conn.commit()
    cur.close()
    conn.close()
    return inserted, updated


# ═══════════════════════════════════════════
#  进度写入
# ═══════════════════════════════════════════

def _write_progress(data: dict):
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _write_progress_embed(current: int, total: int):
    _write_progress({
        "phase": "向量化中",
        "current": f"{current}/{total}",
        "progress": (current, total),
        "videos_found": total,
        "categories": [],
    })


# ═══════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════

def main():
    print("=" * 60)
    print("   B站编程教程爬虫")
    print("=" * 60)
    print(f"\n📋 共 {len(SEARCH_ITEMS)} 个搜索词，每词取 {TOP_K} 条")
    start_time = time.time()

    # 1. 爬取
    print("\n📥 阶段1：爬取 B站...")
    videos = fetch_all_videos()
    print(f"\n   ✅ 爬取完成，去重后共 {len(videos)} 条视频")

    if not videos:
        print("   ❌ 没有获取到任何视频，退出")
        _write_progress({
            "phase": "未获取到视频",
            "current": "完成",
            "progress": (0, 0),
            "videos_found": 0,
            "categories": [],
        })
        return

    # 2. 向量化
    print("\n🧠 阶段2：生成向量...")
    model = load_embedder()
    videos = embed_videos(model, videos)
    print(f"   ✅ {len(videos)} 条视频向量化完成")

    # 3. 写入数据库
    print("\n💾 阶段3：写入 PGVector...")
    ensure_table()
    inserted, updated = insert_videos(videos)
    print(f"   ✅ 新增 {inserted} 条，更新 {updated} 条")

    elapsed = int(time.time() - start_time)
    m, s = divmod(elapsed, 60)
    print(f"\n{'='*60}")
    print(f"   🎉 全部完成！用时 {m}分{s}秒")
    print(f"   共 {len(videos)} 条视频写入 video_resources 表")
    print(f"   {'='*60}")

    _write_progress({
        "phase": "✅ 全部完成",
        "current": f"新增{inserted} 更新{updated} 共{len(videos)}条",
        "progress": (1, 1),
        "videos_found": len(videos),
        "inserted": inserted,
        "updated": updated,
        "elapsed": f"{m}分{s}秒",
        "categories": [],
    })


if __name__ == "__main__":
    main()
