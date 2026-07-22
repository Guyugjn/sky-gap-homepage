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
    """自然排序：字符串中的数字按整数值排序（song2 < song10）"""
    parts = re.split(r'(\d+)', name.lower())
    return [int(p) if p.isdigit() else p for p in parts]


def main():
    if not os.path.isdir(MUSIC_DIR):
        print(f'[错误] 目录不存在：{MUSIC_DIR}')
        return

    # 收集所有 .mp3 文件（仅文件，排除子目录）
    files = []
    for f in os.listdir(MUSIC_DIR):
        if f.lower().endswith('.mp3') and os.path.isfile(os.path.join(MUSIC_DIR, f)):
            files.append(f)

    files.sort(key=natural_key)

    # 写入为全局 JS 变量，确保不使用智能引号（JSON 规范只认直双引号）
    try:
        content = 'window.__PLAYLIST__ = ' + json.dumps(files, ensure_ascii=False) + ';\n'
        with open(OUTPUT, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'已生成 playlist.js，共 {len(files)} 首曲目')
        if not files:
            print('[提示] 播放列表为空，请将 mp3 文件放入 assets/music/')
    except IOError as e:
        print(f'[错误] 写入 playlist.js 失败：{e}')
    except Exception as e:
        print(f'[错误] 生成播放列表时出现异常：{e}')


if __name__ == '__main__':
    main()
