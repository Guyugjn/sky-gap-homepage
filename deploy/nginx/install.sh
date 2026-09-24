#!/usr/bin/env bash
# ============================================================================
#  孤鱼GY · 天空之隙 —— Nginx 站点安装脚本（Ubuntu 24.04 LTS）
#
#  在服务器上运行，需要 root 权限：
#      sudo bash install.sh
#
#  前置条件：站点文件已解压到 /var/www/sky-gap
#  本脚本会自动读取同目录下的 sky-gap.conf，二者必须放在一起。
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_SRC="${SCRIPT_DIR}/sky-gap.conf"
SITE_ROOT="/var/www/sky-gap"
CONF_DST="/etc/nginx/sites-available/sky-gap"
CONF_LINK="/etc/nginx/sites-enabled/sky-gap"

if [ "$(id -u)" -ne 0 ]; then
    echo "!! 需要 root 权限，请用：sudo bash install.sh" >&2
    exit 1
fi

if [ ! -f "${CONF_SRC}" ]; then
    echo "!! 未找到 ${CONF_SRC}，请把 sky-gap.conf 与脚本放在同一目录" >&2
    exit 1
fi

# 默认软件源不可达时切换到国内镜像（幂等，仅改一次，原文件留 .bak 备份）
switch_apt_mirror() {
    local f="/etc/apt/sources.list.d/ubuntu.sources"
    [ -f "${f}" ] || f="/etc/apt/sources.list"
    [ -f "${f}" ] || return 0
    [ -f "${f}.bak" ] || cp "${f}" "${f}.bak"
    sed -i -E \
        -e 's|https?://[a-z0-9.-]*archive\.ubuntu\.com|https://mirrors.aliyun.com|g' \
        -e 's|https?://security\.ubuntu\.com|https://mirrors.aliyun.com|g' \
        "${f}"
    echo "    已切换为 mirrors.aliyun.com（原文件备份为 ${f}.bak）"
}

echo "==> [1/7] 安装 Nginx"
export DEBIAN_FRONTEND=noninteractive
if ! apt-get update -qq; then
    echo "    默认软件源连接失败，改用国内镜像重试"
    switch_apt_mirror
    apt-get update -qq
fi
apt-get install -y -qq nginx

echo "==> [2/7] 校验站点目录"
if [ ! -f "${SITE_ROOT}/index.html" ]; then
    echo "!! 未找到 ${SITE_ROOT}/index.html，请先上传并解压站点文件" >&2
    exit 1
fi
echo "    站点文件已就位"

echo "==> [3/7] 修正文件权限"
# tar 解压出的文件权限不可靠（常见 777），统一收敛为常规 Web 权限
find "${SITE_ROOT}" -type d -exec chmod 755 {} +
find "${SITE_ROOT}" -type f -exec chmod 644 {} +
chown -R root:root "${SITE_ROOT}"
echo "    目录 755 / 文件 644 / 属主 root:root"

echo "==> [4/7] 安装站点配置"
install -m 644 "${CONF_SRC}" "${CONF_DST}"
ln -sfn "${CONF_DST}" "${CONF_LINK}"

# 移除 Ubuntu 自带的默认站点，避免与 default_server 冲突
if [ -e /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
    echo "    已移除默认站点"
fi

echo "==> [5/7] 校验配置语法"
nginx -t

echo "==> [6/7] 启动 Nginx 并设为开机自启"
systemctl enable --now nginx
systemctl reload nginx

echo "==> [7/7] 自检"
sleep 1
CODE="$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.080322.xyz' http://127.0.0.1/ || true)"
echo "    首页响应码：${CODE}"
if [ "${CODE}" = "200" ]; then
    echo "    ✓ 网站已在本机正常响应"
else
    echo "    !! 响应异常，请检查 ${SITE_ROOT} 内容与 /var/log/nginx/error.log" >&2
fi

echo
echo "==> 完成。验证方式："
echo "    1) 本机：curl -I -H 'Host: www.080322.xyz' http://127.0.0.1/"
echo "    2) 外网：curl -I http://<服务器IP>:<网站端口>/"
echo "    3) 域名：https://www.080322.xyz"
