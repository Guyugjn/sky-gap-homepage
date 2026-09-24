#!/usr/bin/env bash
# ============================================================================
#  孤鱼GY · 天空之隙 —— 站点打包脚本
#
#  在本地项目根目录运行：
#      bash deploy/pack-site.sh
#
#  产出：release/sky-gap-site.tar（可直接上传服务器的部署包）
#
#  打包规则与项目根 .gitignore 一致，额外排除仅供本地维护的文件：
#    排除：.git/、release/、deploy/、web.config、.gitignore
#          memory.md、memory-tools.md、README.md、generate_playlist.py
#          服务器运维/（含真实 IP 与端口，绝不能进部署包）
#    保留：assets/music/（含 playlist.js）、assets/twemoji-72x72/、robots.txt、
#          sitemap.xml、tools/ —— 这些不进 git 但部署时必须有
#          LICENSE —— 已跟踪的公开许可文件，随站发布
# ============================================================================
set -euo pipefail

# 切到项目根目录（脚本所在目录的上一级）
cd "$(dirname "${BASH_SOURCE[0]}")/.."

OUT_DIR="release"
OUT="${OUT_DIR}/sky-gap-site.tar"

[ -f index.html ] || { echo "!! 未找到 index.html，请在项目根目录运行" >&2; exit 1; }

mkdir -p "${OUT_DIR}"

echo "==> 打包站点文件"
tar --exclude='./.git' \
    --exclude='./release' \
    --exclude='./deploy' \
    --exclude='./服务器运维' \
    --exclude='./web.config' \
    --exclude='./.gitignore' \
    --exclude='./memory.md' \
    --exclude='./memory-tools.md' \
    --exclude='./README.md' \
    --exclude='./generate_playlist.py' \
    -cf "${OUT}" .

SIZE="$(du -h "${OUT}" | cut -f1)"
COUNT="$(tar -tf "${OUT}" | wc -l)"
echo "    完成：${OUT}（${SIZE}，${COUNT} 个条目）"

echo "==> 关键文件自检"
# 先把条目列表落到临时文件再比对：直接在管道里用 grep -q 会因提前退出
# 让 tar 收到 SIGPIPE，配合 pipefail 会被误判为「文件缺失」。
# 必须加 --quoting-style=literal：tar 默认把非 ASCII 条目名转义成八进制
# （服务器运维 → \346\234\215...），照原样 grep 永远匹配不到，自检会变成假检查。
LIST="$(mktemp)"
trap 'rm -f "${LIST}"' EXIT
tar -tf "${OUT}" --quoting-style=literal > "${LIST}"

MISSING=0
for f in index.html css/style.css js/main.js assets/music/playlist.js \
         assets/twemoji-72x72/1f41f.png robots.txt sitemap.xml tools/index.html \
         LICENSE; do
    if grep -qxF -- "./${f}" "${LIST}"; then
        echo "    ✓ ${f}"
    else
        echo "    !! 缺失：${f}" >&2
        MISSING=1
    fi
done
[ "${MISSING}" -eq 0 ] || { echo "!! 打包内容不完整，请检查排除规则" >&2; exit 1; }

echo "==> 排除项自检"
LEAKED=0
for f in .git release deploy 服务器运维 web.config .gitignore memory.md memory-tools.md \
         README.md generate_playlist.py; do
    if grep -qF -- "./${f}/" "${LIST}" || grep -qxF -- "./${f}" "${LIST}"; then
        echo "    !! 已混入：${f}" >&2
        LEAKED=1
    else
        echo "    ✓ 已排除 ${f}"
    fi
done
[ "${LEAKED}" -eq 0 ] || { echo "!! 部署包含不该对外发布的内容，请检查排除规则" >&2; exit 1; }

echo
echo "==> 完成。上传并部署："
echo "    scp -P <SSH端口> ${OUT} root@<服务器IP>:/tmp/"
echo "    ssh -p <SSH端口> root@<服务器IP>"
echo "      mkdir -p /var/www/sky-gap && tar -xf /tmp/sky-gap-site.tar -C /var/www/sky-gap"
echo "      # 再把 deploy/nginx/ 整个目录传到服务器，运行 install.sh"
