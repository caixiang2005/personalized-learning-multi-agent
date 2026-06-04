"""
测试 B站搜索 API 数据质量（加强版：带 cookie + 错误处理）
"""
import json
import re
import urllib.request
import urllib.parse
import time
import random


# B站通用 Cookie（从浏览器复制，有效期较长）
BILI_COOKIE = (
    "buvid3=local-test-buvid3; "
    "buvid4=local-test-buvid4; "
    "buvid_fp=local-test-fp; "
    "b_lsid=local-test-lsid; "
    "_uuid=local-test-uuid; "
    "buvid3=infoc-test; "
    "buvid3=local-test; "
)


def clean_title(title: str) -> str:
    return re.sub(r'</?em[^>]*>', '', title)


def search_bilibili(keyword: str, page: int = 1, retry: int = 2) -> list[dict]:
    url = (
        f"https://api.bilibili.com/x/web-interface/search/type"
        f"?search_type=video&keyword={urllib.parse.quote(keyword)}&page={page}"
    )
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.bilibili.com/",
        "Cookie": BILI_COOKIE,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    }
    req = urllib.request.Request(url, headers=headers)

    for attempt in range(retry):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            break
        except Exception as e:
            print(f"    ⚠ 第 {attempt+1} 次请求失败: {e}")
            if attempt < retry - 1:
                time.sleep(1)
                continue
            return []

    if data.get("code") != 0:
        print(f"    ⚠ API 返回错误码 {data.get('code')}: {data.get('message', '')}")
        return []

    results = data.get("data", {}).get("result", [])
    if not results:
        num_results = data.get("data", {}).get("numResults", 0)
        print(f"    无视频结果 (numResults={num_results})")
        return []

    videos = []
    for r in results:
        bvid = r.get("bvid", "")
        if not bvid:
            continue
        videos.append({
            "bvid": bvid,
            "title": clean_title(r.get("title", "")),
            "author": r.get("author", ""),
            "play": r.get("play", 0),
            "duration": r.get("duration", ""),
            "description": r.get("description", "").strip(),
            "tag": r.get("tag", ""),
            "url": f"https://www.bilibili.com/video/{bvid}",
        })
    return videos


def fmt_play(n: int) -> str:
    if n >= 100000000:
        return f"{n/100000000:.1f}亿"
    if n >= 10000:
        return f"{n/10000:.1f}万"
    return str(n)


def fmt_duration(sec: str) -> str:
    try:
        s = int(float(sec))
        h, m = divmod(s // 60, 60)
        return f"{h}:{m:02d}:{s % 60:02d}" if h else f"{m}:{s % 60:02d}"
    except (ValueError, TypeError):
        return sec


def fmt_tag(tag: str) -> str:
    tags = tag.split(",") if tag else []
    return ", ".join(tags[:5]) + ("..." if len(tags) > 5 else "")


def main():
    # 覆盖 12 个菜鸟分类的关键词
    keywords = [
        # Python / 数据科学
        ("Python / 数据科学", ["Python入门教程", "Python数据分析教程", "FastAPI教程"]),
        # 前端
        ("前端", ["Vue3教程", "React教程", "JavaScript教程"]),
        # 后端
        ("后端", ["Java教程", "SpringBoot教程"]),
        # 数据库
        ("数据库", ["MySQL教程", "Redis教程", "MongoDB教程"]),
        # 移动开发
        ("移动开发", ["Flutter教程", "Android开发教程"]),
        # 机器学习 / AI
        ("机器学习 / AI", ["机器学习入门", "深度学习教程", "PyTorch教程"]),
        # Linux
        ("Linux", ["Linux教程", "Docker教程"]),
        # 编程基础
        ("编程基础", ["C语言教程", "数据结构与算法"]),
    ]

    total = 0
    for category, kws in keywords:
        print(f"\n{'='*60}")
        print(f"📂 分类: {category}")
        print(f"{'='*60}")
        for kw in kws:
            print(f"\n  🔍 搜索: {kw}")
            videos = search_bilibili(kw, page=1)
            if not videos:
                print("     ❌ 无结果或请求失败")
                continue
            # 过滤：时长 < 10 分钟的跳过（短视频/片段不推荐）
            filtered = []
            for v in videos:
                try:
                    if int(float(v["duration"])) < 600:  # < 10分钟
                        continue
                except (ValueError, TypeError):
                    pass
                filtered.append(v)
            if not filtered:
                filtered = videos[:3]  # 如果全被过滤了，保留前3

            count_str = f"（其中≥10分钟 {len(filtered)}/{len(videos)} 条）"
            for i, v in enumerate(filtered[:3], 1):
                play = fmt_play(v["play"])
                dur = fmt_duration(v["duration"])
                desc = v["description"][:100].replace("\n", " ")
                print(f"    [{i}] {v['title']}")
                print(f"        📺 {v['author']}  |  👁 {play}  |  ⏱ {dur}")
                print(f"        🔗 {v['url']}")
                print(f"        📝 {desc}{'...' if len(v['description']) > 100 else ''}")
            total += len(filtered)
            # 礼貌间隔
            time.sleep(random.uniform(0.3, 0.8))

    print(f"\n\n{'='*60}")
    print(f"✅ 测试完成，共获取 {total} 条视频（过滤后）")


if __name__ == "__main__":
    main()
