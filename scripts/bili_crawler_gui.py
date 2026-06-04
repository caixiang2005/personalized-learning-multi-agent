#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
B站编程教程爬取 — Tkinter 可视化界面
运行后显示实时进度，爬取完成后保持显示结果
"""

import os
import sys
import json
import time
import subprocess
import threading
from datetime import datetime

try:
    import tkinter as tk
    from tkinter import ttk
except ImportError:
    print('❌ 需要 Tkinter，请安装: python -m tkinter')
    sys.exit(1)

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRAWLER_SCRIPT = os.path.join(PROJECT_ROOT, 'scripts', 'bili_crawler.py')
PROGRESS_FILE = os.path.join(PROJECT_ROOT, 'scripts', '_bili_progress.json')


class BiliCrawlerGUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title('🎬 B站编程教程爬取')
        self.root.geometry('740x620+100+100')
        self.root.resizable(False, False)

        self.proc = None
        self.running = False
        self.start_time = None

        self._build_ui()
        self._poll_progress()

    def _build_ui(self):
        f = ttk.Frame(self.root, padding=20)
        f.pack(fill=tk.BOTH, expand=True)

        # 标题
        title_f = ttk.Frame(f)
        title_f.pack(fill=tk.X)
        ttk.Label(title_f, text='🎬 B站编程教程爬取', font=('Microsoft YaHei', 18, 'bold')).pack(side=tk.LEFT)
        self.stat_videos = ttk.Label(title_f, text='', font=('Microsoft YaHei', 11), foreground='#1677ff')
        self.stat_videos.pack(side=tk.RIGHT)

        # ── 进度条 ──
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(f, variable=self.progress_var, length=700, mode='determinate')
        self.progress_bar.pack(fill=tk.X, pady=(12, 4))

        self.pct_label = ttk.Label(f, text='0%', font=('Microsoft YaHei', 11))
        self.pct_label.pack(anchor=tk.E)

        # ── 当前阶段 ──
        self.phase_label = ttk.Label(f, text='当前：等待开始...', font=('Microsoft YaHei', 11), foreground='#666')
        self.phase_label.pack(anchor=tk.W, pady=(0, 4))

        # ── 统计行 ──
        stats_f = ttk.Frame(f)
        stats_f.pack(fill=tk.X, pady=4)

        self.stat_search = ttk.Label(stats_f, text='🔍 搜索: 0 / 72', font=('Microsoft YaHei', 11, 'bold'))
        self.stat_search.pack(side=tk.LEFT, padx=(0, 20))

        self.stat_done = ttk.Label(stats_f, text='📦 已获取: 0', font=('Microsoft YaHei', 11))
        self.stat_done.pack(side=tk.LEFT, padx=(0, 20))

        self.stat_db = ttk.Label(stats_f, text='💾 入库: 0', font=('Microsoft YaHei', 11), foreground='#52c41a')
        self.stat_db.pack(side=tk.LEFT, padx=(0, 20))

        self.stat_time = ttk.Label(stats_f, text='⏱ 00:00', font=('Microsoft YaHei', 11))
        self.stat_time.pack(side=tk.RIGHT)

        # ── 分类进度 ──
        ttk.Label(f, text='📂 各分类进度', font=('Microsoft YaHei', 12, 'bold')).pack(anchor=tk.W, pady=(8, 0))

        canvas = tk.Canvas(f, height=210, highlightthickness=0)
        scrollbar = ttk.Scrollbar(f, orient=tk.VERTICAL, command=canvas.yview)
        self.cat_frame = ttk.Frame(canvas)
        self.cat_frame.bind('<Configure>', lambda e: canvas.configure(scrollregion=canvas.bbox('all')))
        canvas.create_window((0, 0), window=self.cat_frame, anchor=tk.NW)
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, pady=(4, 0))
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y, pady=(4, 0))

        # ── 按钮 ──
        btn_f = ttk.Frame(f)
        btn_f.pack(fill=tk.X, pady=(10, 0))

        self.start_btn = ttk.Button(btn_f, text='📥 开始爬取', command=self._start_crawl)
        self.start_btn.pack(side=tk.LEFT)

        self.status_label = ttk.Label(btn_f, text='', font=('Microsoft YaHei', 10))
        self.status_label.pack(side=tk.LEFT, padx=(12, 0))

        # ── 日志 ──
        ttk.Label(f, text='📋 日志', font=('Microsoft YaHei', 12, 'bold')).pack(anchor=tk.W, pady=(10, 0))

        log_f = ttk.Frame(f)
        log_f.pack(fill=tk.BOTH, expand=True, pady=(4, 0))
        self.log_text = tk.Text(log_f, height=8, font=('Consolas', 10), fg='#333', wrap=tk.WORD)
        log_sb = ttk.Scrollbar(log_f, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_sb.set)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        log_sb.pack(side=tk.RIGHT, fill=tk.Y)

    def log(self, msg):
        ts = datetime.now().strftime('%H:%M:%S')
        self.log_text.insert(tk.END, f'[{ts}] {msg}\n')
        self.log_text.see(tk.END)
        self.root.update_idletasks()

    def _start_crawl(self):
        if self.running:
            return
        self.running = True
        self.start_btn.configure(text='⏳ 爬取中...', state=tk.DISABLED)
        self.start_time = time.time()
        self.log('🚀 开始爬取 B站视频数据...')

        def worker():
            try:
                # 使用 venv 下的 Python（如果存在）
                venv_python = os.path.join(
                    PROJECT_ROOT, 'backend', 'agent-service', 'venv', 'Scripts', 'python.exe'
                )
                python_exe = venv_python if os.path.exists(venv_python) else sys.executable

                self.proc = subprocess.Popen(
                    [python_exe, '-u', CRAWLER_SCRIPT],
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    encoding='utf-8', errors='replace',
                    bufsize=1
                )
                for line in self.proc.stdout:
                    if not self.running:
                        break
                    line = line.rstrip()
                    if line:
                        self.root.after(0, lambda l=line: self.log(l))
                self.proc.wait()
            except Exception as e:
                self.root.after(0, lambda: self.log(f'❌ 爬虫异常: {e}'))
            finally:
                self.proc = None
                self.root.after(0, self._on_finish)

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()

    def _on_finish(self):
        self.running = False
        self.start_btn.configure(text='✅ 爬取完成', state=tk.NORMAL)
        self.log('🎉 全部完成！')

    def _poll_progress(self):
        data = None
        if os.path.exists(PROGRESS_FILE):
            try:
                with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception:
                pass

        if data:
            self._update_display(data)

        self.root.after(1500, self._poll_progress)

    def _update_display(self, data):
        phase = data.get('phase', '')
        current = data.get('current', '')

        # 阶段
        self.phase_label.configure(text=f'当前：{phase}　{current}')

        # 进度
        progress = data.get('progress')
        if progress and len(progress) == 2:
            cur, total = progress
            if total > 0:
                pct = min(cur / total * 100, 100)
                self.progress_var.set(pct)
                self.pct_label.configure(text=f'{int(pct)}%')

                if '全部完成' in phase:
                    self.stat_search.configure(text=f'✅ 完成')
                elif '向量化' in phase:
                    self.stat_search.configure(text=f'🧠 向量: {cur}/{total}')
                else:
                    self.stat_search.configure(text=f'🔍 搜索: {cur}/{total}')

        # 视频统计
        found = data.get('videos_found', 0)
        if found:
            self.stat_done.configure(text=f'📦 已获取: {found}')

        # 入库统计
        inserted = data.get('inserted', 0)
        updated = data.get('updated', 0)
        if inserted or updated:
            self.stat_db.configure(text=f'💾 新增{inserted} 更新{updated}')

        # 时间
        if self.start_time:
            elapsed = int(time.time() - self.start_time)
            m, s = divmod(elapsed, 60)
            self.stat_time.configure(text=f'⏱ {m:02d}:{s:02d}')

        # 完成时间
        elapsed_str = data.get('elapsed', '')
        if elapsed_str:
            self.stat_time.configure(text=f'⏱ {elapsed_str}')

        # 分类列表
        categories = data.get('categories', [])
        for w in self.cat_frame.winfo_children():
            w.destroy()

        if not categories and '全部完成' in phase:
            ttk.Label(self.cat_frame, text='✅ 所有分类爬取完成', font=('Microsoft YaHei', 10),
                      foreground='#52c41a').pack(anchor=tk.W, pady=4)
            return

        for cat in categories:
            row = ttk.Frame(self.cat_frame)
            row.pack(fill=tk.X, pady=1)

            name = cat.get('name', '')
            found_cat = cat.get('found', 0)
            subs = cat.get('subs', [])
            sub_info = ', '.join(f'{s["name"]}({s["count"]})' for s in subs[:4])
            if len(subs) > 4:
                sub_info += f' ...共{len(subs)}个子模块'

            active = name in current if '[37m' not in current else False
            dot = '🟢' if active else ('🔵' if found_cat > 0 else '⚪')
            ttk.Label(row, text=dot, font=('Microsoft YaHei', 10)).pack(side=tk.LEFT, padx=(0, 4))
            ttk.Label(row, text=name, font=('Microsoft YaHei', 10)).pack(side=tk.LEFT)
            ttk.Label(row, text=f'{found_cat} 条', font=('Microsoft YaHei', 10),
                      foreground='#1677ff').pack(side=tk.RIGHT)

    def run(self):
        self.root.mainloop()


if __name__ == '__main__':
    if not os.path.exists(CRAWLER_SCRIPT):
        print(f'❌ 找不到爬虫脚本: {CRAWLER_SCRIPT}')
        sys.exit(1)
    app = BiliCrawlerGUI()
    app.run()
