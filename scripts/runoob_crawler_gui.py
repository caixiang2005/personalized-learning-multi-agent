#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
菜鸟教程 · 全站爬取 — Tkinter 可视化界面
运行后显示实时进度，爬取完成后保持显示结果
"""

import os
import sys
import json
import time
import subprocess
import threading
from datetime import datetime

# ── Tkinter ──
try:
    import tkinter as tk
    from tkinter import ttk
except ImportError:
    print('❌ 需要 Tkinter，请安装: python -m tkinter')
    sys.exit(1)

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRAWLER_SCRIPT = os.path.join(PROJECT_ROOT, 'scripts', 'runoob_crawler_full.py')
PROGRESS_FILE = os.path.join(PROJECT_ROOT, 'knowledge', 'runoob', '_progress.json')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'knowledge', 'runoob')


class CrawlerGUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title('📚 菜鸟教程 · 全站爬取')
        self.root.geometry('720x600+100+100')
        self.root.resizable(False, False)

        self.proc = None           # 子进程
        self.running = False
        self.start_time = None

        self._build_ui()
        self._init_progress()
        self._poll_progress()

    # ── 构建界面 ──
    def _build_ui(self):
        f = ttk.Frame(self.root, padding=20)
        f.pack(fill=tk.BOTH, expand=True)

        # 标题
        ttk.Label(f, text='📚 菜鸟教程 · 全站爬取', font=('Microsoft YaHei', 18, 'bold')).pack(anchor=tk.W)

        # ── 进度条 ──
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(f, variable=self.progress_var, length=680, mode='determinate')
        self.progress_bar.pack(fill=tk.X, pady=(16, 4))

        self.pct_label = ttk.Label(f, text='0%', font=('Microsoft YaHei', 11))
        self.pct_label.pack(anchor=tk.E)

        # ── 统计行 ──
        stats_f = ttk.Frame(f)
        stats_f.pack(fill=tk.X, pady=8)

        self.stat_done = ttk.Label(stats_f, text='已完成: 0 / 0', font=('Microsoft YaHei', 12, 'bold'))
        self.stat_done.pack(side=tk.LEFT, padx=(0, 20))

        self.stat_ok = ttk.Label(stats_f, text='成功: 0', font=('Microsoft YaHei', 12), foreground='#52c41a')
        self.stat_ok.pack(side=tk.LEFT, padx=(0, 20))

        self.stat_fail = ttk.Label(stats_f, text='失败: 0', font=('Microsoft YaHei', 12), foreground='#ff4d4f')
        self.stat_fail.pack(side=tk.LEFT, padx=(0, 20))

        self.stat_time = ttk.Label(stats_f, text='⏱ 00:00', font=('Microsoft YaHei', 12))
        self.stat_time.pack(side=tk.RIGHT)

        # ── 当前阶段 ──
        self.phase_label = ttk.Label(f, text='当前：等待开始...', font=('Microsoft YaHei', 11), foreground='#666')
        self.phase_label.pack(anchor=tk.W, pady=(0, 12))

        # ── 分类进度 ──
        ttk.Label(f, text='📂 各分类进度', font=('Microsoft YaHei', 12, 'bold')).pack(anchor=tk.W)

        canvas = tk.Canvas(f, height=260, highlightthickness=0)
        scrollbar = ttk.Scrollbar(f, orient=tk.VERTICAL, command=canvas.yview)
        self.cat_frame = ttk.Frame(canvas)
        self.cat_frame.bind('<Configure>', lambda e: canvas.configure(scrollregion=canvas.bbox('all')))
        canvas.create_window((0, 0), window=self.cat_frame, anchor=tk.NW)
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, pady=(4, 0))
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y, pady=(4, 0))

        # ── 按钮行 ──
        btn_f = ttk.Frame(f)
        btn_f.pack(fill=tk.X, pady=(12, 0))

        self.start_btn = ttk.Button(btn_f, text='📥 开始爬取', command=self._start_crawl)
        self.start_btn.pack(side=tk.LEFT)

        self.open_dir_btn = ttk.Button(btn_f, text='📂 打开输出目录', command=self._open_output)
        self.open_dir_btn.pack(side=tk.LEFT, padx=(8, 0))

        # ── 日志 ──
        ttk.Label(f, text='📋 日志', font=('Microsoft YaHei', 12, 'bold')).pack(anchor=tk.W, pady=(12, 0))

        log_f = ttk.Frame(f)
        log_f.pack(fill=tk.BOTH, expand=True, pady=(4, 0))
        self.log_text = tk.Text(log_f, height=8, font=('Consolas', 10), fg='#333', wrap=tk.WORD)
        log_sb = ttk.Scrollbar(log_f, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_sb.set)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        log_sb.pack(side=tk.RIGHT, fill=tk.Y)

    # ── 初始化进度（提前展示分类框架） ──
    def _init_progress(self):
        """预先写入一个初始进度 JSON，让 GUI 一开始就显示 12 个分类"""
        if os.path.exists(PROGRESS_FILE):
            return
        init = {
            'phase': '等待开始，点击「开始爬取」按钮',
            'tutorial_idx': 0,
            'total_tutorials': 0,
            'total_success': 0,
            'total_failed': 0,
            'categories': []
        }
        os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
        with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
            json.dump(init, f, ensure_ascii=False, indent=2)

    # ── 日志写入 ──
    def log(self, msg):
        ts = datetime.now().strftime('%H:%M:%S')
        self.log_text.insert(tk.END, f'[{ts}] {msg}\n')
        self.log_text.see(tk.END)
        self.root.update_idletasks()

    # ── 启动爬虫 ──
    def _start_crawl(self):
        if self.running:
            return
        self.running = True
        self.start_btn.configure(text='⏳ 爬取中...', state=tk.DISABLED)
        self.start_time = time.time()
        self.log('🚀 开始爬取...')

        # 确保输出目录存在
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # 在子线程中启动爬虫
        def worker():
            try:
                self.proc = subprocess.Popen(
                    [sys.executable, '-u', CRAWLER_SCRIPT],
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    encoding='utf-8', errors='replace',
                    bufsize=1
                )
                # 读取子进程输出并写入日志
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
        self.start_btn.configure(text='✅ 已完成', state=tk.NORMAL)
        self.log('🎉 全部爬取完成！')

    # ── 轮询进度 ──
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
        idx = data.get('tutorial_idx', 0)
        total = data.get('total_tutorials', 1) or 1
        ok = data.get('total_success', 0)
        fail = data.get('total_failed', 0)
        phase = data.get('phase', '')

        # 进度百分比
        pct = min(idx / total * 100, 100)
        self.progress_var.set(pct)
        self.pct_label.configure(text=f'{int(pct)}%')

        # 统计
        self.stat_done.configure(text=f'已完成: {idx} / {total}')
        self.stat_ok.configure(text=f'成功: {ok}')
        self.stat_fail.configure(text=f'失败: {fail}')

        # 已用时
        if self.start_time:
            elapsed = int(time.time() - self.start_time)
            m, s = divmod(elapsed, 60)
            self.stat_time.configure(text=f'⏱ {m:02d}:{s:02d}')

        # 当前阶段
        self.phase_label.configure(text=f'当前：{phase}')

        # 分类列表
        for w in self.cat_frame.winfo_children():
            w.destroy()
        for cat in data.get('categories', []):
            row = ttk.Frame(self.cat_frame)
            row.pack(fill=tk.X, pady=2)

            # 状态圆点
            cname = cat['name']
            active = cname in phase
            dot_label = '🟢' if active else ('🔵' if cat['files'] > 0 else '⚪')
            ttk.Label(row, text=dot_label, font=('Microsoft YaHei', 10)).pack(side=tk.LEFT, padx=(0, 4))
            ttk.Label(row, text=cname, font=('Microsoft YaHei', 10)).pack(side=tk.LEFT)
            ttk.Label(row, text=f'{cat["files"]} 个文件', font=('Microsoft YaHei', 10),
                      foreground='#1677ff').pack(side=tk.RIGHT)

    # ── 打开输出目录 ──
    def _open_output(self):
        os.startfile(OUTPUT_DIR) if hasattr(os, 'startfile') else None

    def run(self):
        self.root.mainloop()


if __name__ == '__main__':
    # 确保依赖存在
    if not os.path.exists(CRAWLER_SCRIPT):
        print(f'❌ 找不到爬虫脚本: {CRAWLER_SCRIPT}')
        sys.exit(1)
    app = CrawlerGUI()
    app.run()
