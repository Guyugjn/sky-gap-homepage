"""
扫描 assets/music/ 文件夹，自动生成 playlist.js
通过 <script> 标签加载，避免 file:// 协议下 fetch 被拦截
"""
import os
import json
import re

MUSIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'music')
OUTPUT = os.path.join(MUSIC_DIR, 'playlist.js')


def natural_key(name):
    """自然排序：将字符串中的数字部分转为整数，实现 2 < 10 而非字典序"""
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', name)]


def main():
    if not os.path.isdir(MUSIC_DIR):
        print(f'[错误] 目录不存在：{MUSIC_DIR}')
        return

    # 收集所有 .mp3 文件名，排除 playlist.js
    files = sorted(
        [f for f in os.listdir(MUSIC_DIR) if f.lower().endswith('.mp3')],
        key=natural_key,
    )

    # 写入为全局 JS 变量，浏览器直接通过 <script> 标签加载
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write('window.__PLAYLIST__ = ')
        json.dump(files, f, ensure_ascii=False)
        f.write(';\n')

    print(f'已生成 playlist.js，共 {len(files)} 首曲目')
    if not files:
        print('[提示] 播放列表为空，请将 mp3 文件放入 assets/music/')


if __name__ == '__main__':
    main()
