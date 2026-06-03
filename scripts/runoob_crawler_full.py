#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
菜鸟教程 - 全站爬虫
爬取 12 个分类下所有计算机教程，输出 Markdown 到 knowledge/runoob/
"""

import os
import re
import sys
import json
import time
import requests
from bs4 import BeautifulSoup, NavigableString
from urllib.parse import urljoin

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'knowledge', 'runoob')
PROGRESS_FILE = os.path.join(OUTPUT_DIR, '_progress.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
DELAY = 0.8  # 请求间隔（秒）
BASE_URL = 'https://www.runoob.com'

# 全局去重：记录所有已下载的 URL，避免重复下载
_downloaded_urls = set()

# ============================================================
# 进度追踪（写入 JSON，供 progress.html 读取）
# ============================================================

def update_progress(categories, tutorial_idx, total_tutorials,
                    total_success=0, total_failed=0,
                    phase='等待开始'):
    """更新进度 JSON"""
    data = {
        'phase': phase,
        'tutorial_idx': tutorial_idx,
        'total_tutorials': total_tutorials,
        'total_success': total_success,
        'total_failed': total_failed,
        'categories': []
    }
    for c in categories:
        cat_dir = os.path.join(OUTPUT_DIR, c['slug'])
        fcount = 0
        if os.path.isdir(cat_dir):
            for root, dirs, files in os.walk(cat_dir):
                fcount += len([f for f in files if f.endswith('.md')])
        data['categories'].append({'name': c['name'], 'files': fcount})
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ============================================================
# 工具函数
# ============================================================

def log(msg):
    print(f'  {msg}')

def fetch(url):
    """抓取页面，返回 HTML"""
    time.sleep(DELAY)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.encoding = 'utf-8'
        if resp.status_code == 200:
            return resp.text
        else:
            log(f'⚠️ HTTP {resp.status_code}: {url}')
            return None
    except Exception as e:
        log(f'❌ 请求失败: {url} — {e}')
        return None

def url_path_to_filename(url):
    """从 URL 路径生成文件名，如 /python/python-intro.html → python-intro.md
       只取最后一段，避免 python3/python3-intro → python3-python3-intro 的冗余
    """
    path = url.split('runoob.com')[-1].rstrip('/')
    if not path or path == '/':
        return 'index.md'
    path = path.lstrip('/')
    path = re.sub(r'\.(html?|php)$', '', path)
    # 只取最后一段（去掉目录前缀）
    segments = path.split('/')
    return segments[-1] + '.md'

def slugify(name):
    """分类目录名：保留中文，只清理非法字符"""
    name = name.strip()
    name = re.sub(r'[<>:"/\\|?*]', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

# ============================================================
# 步骤 1：解析首页，获取全部分类和教程列表
# ============================================================

def parse_homepage(html):
    """
    返回: list of {name, slug, tutorials: [{title, url}]}
    """
    soup = BeautifulSoup(html, 'html.parser')
    categories = []

    # 首页的分类结构: h2(分类名) → 紧跟的 div → 里面 h4(教程名) → a[href]
    for h2 in soup.find_all('h2'):
        cat_name = h2.get_text(strip=True)
        if not cat_name:
            continue

        # 只保留计算机相关的分类（跳过非技术类）
        cat = {
            'name': cat_name,
            'slug': slugify(cat_name),
            'tutorials': []
        }

        # 遍历 h2 后面的所有兄弟节点，直到遇到下一个 h2
        el = h2.find_next_sibling()
        while el and el.name != 'h2':
            if el.name == 'a' and el.get('class') and 'item-top' in el.get('class'):
                href = el.get('href', '').strip()
                # 从 img alt 或 a 的 title 中取简短标题
                img = el.find('img')
                short_name = img.get('alt', '') if img else ''
                title_text = el.get('title', '') or el.get_text(strip=True)
                display_title = short_name or title_text[:30]

                if href:
                    if href.startswith('/'):
                        href = BASE_URL + href
                    cat['tutorials'].append({'title': display_title, 'url': href})

            el = el.find_next_sibling()

        if cat['tutorials']:
            categories.append(cat)

    return categories

# ============================================================
# 步骤 2：从教程首页提取侧边栏（所有章节链接）
# ============================================================

def extract_chapters(html, tutorial_url):
    """
    从教程页侧边栏提取所有章节链接
    返回: list of {title, url}
    """
    soup = BeautifulSoup(html, 'html.parser')
    chapters = []
    left_col = soup.find('div', class_='left-column')
    if not left_col:
        return chapters

    seen_urls = set()
    for a in left_col.find_all('a'):
        title = a.get_text(strip=True)
        href = a.get('href', '').strip()
        if not title or not href:
            continue
        if href.startswith('#') or 'javascript:' in href:
            continue
        if '首页' in title:
            continue
        # 关键修复: 用教程页 URL 解析相对路径
        href = urljoin(tutorial_url, href)
        if href in seen_urls:
            continue
        seen_urls.add(href)
        chapters.append({'title': title, 'url': href})

    return chapters

# ============================================================
# 步骤 3：将页面转换为 Markdown
# ============================================================

def article_to_markdown(article):
    """
    递归遍历 article-intro → 输出 Markdown
    """
    lines = []
    seen_h2 = set()

    def _has_example_parent(tag):
        p = tag.parent
        while p:
            if p.name == 'div' and p.get('class') and 'example' in p.get('class'):
                return True
            p = p.parent
        return False

    def _process(node):
        if isinstance(node, NavigableString):
            text = str(node).strip()
            if text and node.parent.name not in ('script', 'style', 'a', 'h1', 'h2', 'h3', 'li'):
                if len(text) > 10:
                    lines.append(text)
                    lines.append('')
            return

        tag = node.name
        if tag in ('br', 'hr', 'script', 'style'):
            return
        if tag == 'h1':
            return

        # h2 / h3 标题
        if tag in ('h2', 'h3'):
            if _has_example_parent(node):
                return
            text = node.get_text(strip=True)
            if not text or text in seen_h2:
                return
            seen_h2.add(text)
            prefix = '##' if tag == 'h2' else '###'
            lines.append('')
            lines.append(f'{prefix} {text}')
            lines.append('')
            return

        # 列表
        if tag in ('ul', 'ol'):
            for li in node.find_all('li', recursive=False):
                text = li.get_text(strip=True)
                if text:
                    lines.append(f'- {text}')
            lines.append('')
            return

        # 代码块
        if tag == 'div' and node.get('class') and 'example_code' in node.get('class'):
            parts = []
            for item in node.descendants:
                if isinstance(item, NavigableString):
                    t = str(item).strip()
                    if t:
                        parts.append(t)
                elif item.name == 'br':
                    parts.append('\n')
            code_text = ''.join(parts).strip()
            code_text = re.sub(r'\n{3,}', '\n\n', code_text)
            if code_text:
                # 判断语言
                lines.append('```python')
                lines.append(code_text)
                lines.append('```')
                lines.append('')
            return

        # 普通 div → 递归
        if tag == 'div':
            for child in node.children:
                _process(child)
            return

        # 段落
        if tag == 'p':
            text = node.get_text(strip=True)
            if text:
                lines.append(text)
                lines.append('')
            return

        # 图片
        if tag == 'img':
            alt = node.get('alt', '')
            if alt:
                lines.append(f'[图片：{alt}]')
                lines.append('')
            return

        # 引用
        if tag == 'blockquote':
            text = node.get_text(strip=True)
            if text:
                lines.append(f'> {text}')
                lines.append('')
            return

        # 表格
        if tag == 'table':
            for tr in node.find_all('tr'):
                cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                if cells:
                    lines.append('| ' + ' | '.join(cells) + ' |')
            lines.append('')
            return

        # 其他标签递归
        for child in node.children:
            _process(child)

    _process(article)
    return '\n'.join(lines).strip()


def page_to_markdown(html, source_url, category_name):
    """将教程页 → Markdown（含 YAML frontmatter，方便向量库直接解析）
    返回: (markdown字符串, metadata字典)
    """
    soup = BeautifulSoup(html, 'html.parser')
    article = soup.find('div', class_='article-intro')
    if not article:
        return None, None

    title_tag = article.find('h1')
    title = title_tag.get_text(strip=True) if title_tag else '未命名'

    # 从 URL 提取标签（路径中的关键词）
    path_part = source_url.split('runoob.com')[-1].strip('/')
    tags = [t for t in path_part.split('/') if t and not t.endswith('.html')]

    # YAML frontmatter — LangChain/LlamaIndex/Chroma 都原生支持这种格式
    frontmatter = (
        f'---\n'
        f'title: "{title}"\n'
        f'source: {source_url}\n'
        f'category: "{category_name}"\n'
        f'tags: [{", ".join(tags)}]\n'
        f'---\n'
    )

    body = article_to_markdown(article)
    md = frontmatter + '\n' + body
    metadata = {'title': title, 'source': source_url,
                'category': category_name, 'tags': tags}
    return md, metadata

# ============================================================
# 步骤 4：批量下载
# ============================================================

def _tutorial_slug(url):
    """从 URL 提取教程 slug，如 /python3/python3-tutorial.html → python3"""
    path = url.split('runoob.com')[-1].strip('/')
    return path.split('/')[0] if '/' in path else path


def download_tutorial_chapters(tutorial_title, tutorial_url, category_name, category_dir):
    """
    下载一个教程的所有章节
    返回: (成功数, 失败数)
    """
    slug = _tutorial_slug(tutorial_url)
    tut_dir = os.path.join(category_dir, slug)
    os.makedirs(tut_dir, exist_ok=True)

    log(f'📖 教程: {tutorial_title}')
    log(f'   首页: {tutorial_url}')
    log(f'   目录: {slug}/')

    html = fetch(tutorial_url)
    if not html:
        return 0, 1

    # 提取章节列表
    chapters = extract_chapters(html, tutorial_url)
    if not chapters:
        log('   ⚠️ 未找到侧边栏章节，跳过')
        return 0, 1

    log(f'   章节数: {len(chapters)}')

    success = 0
    failed = 0
    skipped = 0

    for i, ch in enumerate(chapters):
        # 全局去重
        if ch['url'] in _downloaded_urls:
            skipped += 1
            continue
        _downloaded_urls.add(ch['url'])

        filename = url_path_to_filename(ch['url'])
        filepath = os.path.join(tut_dir, filename)

        # 如果文件已存在，跳过（支持断点续爬）
        if os.path.exists(filepath):
            success += 1
            continue

        log(f'   [{i+1}/{len(chapters)}] {ch["title"]}')

        ch_html = fetch(ch['url'])
        if not ch_html:
            failed += 1
            continue

        md, metadata = page_to_markdown(ch_html, ch['url'], category_name)
        if not md:
            log(f'       ⚠️ 转换失败，跳过')
            failed += 1
            continue

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md)
        success += 1

    if skipped:
        log(f'   (已去重跳过 {skipped} 个在其他教程已下载的章节)')

    return success, failed


def main():
    print('=' * 70)
    print('🌐 菜鸟教程 · 全站爬虫')
    print(f'   输出目录: {OUTPUT_DIR}')
    print('=' * 70)

    # ---- 步骤 1：解析首页 ----
    print('\n📋 步骤 1/3：解析首页，获取全部分类和教程列表...')
    html = fetch(BASE_URL)
    if not html:
        print('❌ 首页抓取失败，终止')
        sys.exit(1)

    categories = parse_homepage(html)
    print(f'\n✅ 共发现 {len(categories)} 个分类：')
    for cat in categories:
        print(f'   📂 {cat["name"]} ({len(cat["tutorials"])} 个教程)')

    # ---- 步骤 2+3：逐分类下载 ----
    print('\n📥 步骤 2/3：批量下载所有教程...')
    print('   📊 使用 scripts/runoob_crawler_gui.py 查看实时进度')

    total_tutorials = sum(len(c['tutorials']) for c in categories)
    total_chapters = 0
    total_success = 0
    total_failed = 0
    tutorial_idx = 0

    update_progress(categories, 0, total_tutorials, phase='开始爬取')

    for cat in categories:
        cat_dir = os.path.join(OUTPUT_DIR, cat['slug'])
        os.makedirs(cat_dir, exist_ok=True)

        print(f'\n{"="*50}')
        print(f'📂 分类: {cat["name"]}')
        print(f'{"="*50}')

        for tut in cat['tutorials']:
            tutorial_idx += 1
            print(f'\n[{tutorial_idx}/{total_tutorials}] ', end='')
            update_progress(categories, tutorial_idx, total_tutorials,
                           total_success, total_failed,
                           phase=f'{cat["name"]} → {tut["title"]}')
            ok, fail = download_tutorial_chapters(
                tut['title'], tut['url'],
                cat['name'], cat_dir
            )
            total_chapters += ok + fail
            total_success += ok
            total_failed += fail

        # 生成当前分类的索引文件（方便后续向量库入库）
        index_data = []
        for root, dirs, files in os.walk(cat_dir):
            for fname in files:
                if fname.endswith('.md') and fname != '_index.md':
                    fpath = os.path.join(root, fname)
                    rel = os.path.relpath(fpath, cat_dir)
                    index_data.append({'filename': rel, 'size': os.path.getsize(fpath)})
        with open(os.path.join(cat_dir, '_index.json'), 'w', encoding='utf-8') as f:
            json.dump({'category': cat['name'], 'files': index_data}, f, ensure_ascii=False, indent=2)

    # ---- 生成汇总 ----
    update_progress(categories, total_tutorials, total_tutorials,
                   total_success, total_failed, phase='✅ 全部完成！')

    print(f'\n\n{"="*70}')
    print('📊 爬取完成！')
    print(f'{"="*70}')
    print(f'   分类数: {len(categories)}')
    print(f'   教程数: {total_tutorials}')
    print(f'   章节成功: {total_success}')
    print(f'   章节失败: {total_failed}')
    print(f'   全局唯一 URL: {len(_downloaded_urls)}')
    print(f'   输出目录: {OUTPUT_DIR}')

    # 列出各分类文件数
    print(f'\n📁 文件分布:')
    for cat in categories:
        cat_dir = os.path.join(OUTPUT_DIR, cat['slug'])
        if os.path.exists(cat_dir):
            total = 0
            for root, dirs, files in os.walk(cat_dir):
                total += len([f for f in files if f.endswith('.md')])
            print(f'   {cat["slug"]:20s} {total:4d} 个文件')


if __name__ == '__main__':
    main()
