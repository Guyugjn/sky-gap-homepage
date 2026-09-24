# 部署与运维

本目录存放「孤鱼GY · 天空之隙」的服务器部署配置与脚本，与站点内容分开管理。

站点是纯静态页面，**任何 Web 服务器都能跑**，本目录提供 IIS 与 Nginx 两种实测可用的方案。

```text
deploy/
├── README.md                — 本文件
├── pack-site.sh             — 本地打包，生成部署包 release/sky-gap-site.tar
└── nginx/
    ├── sky-gap.conf         — Nginx 站点配置（对应根目录的 web.config）
    └── install.sh           — 一键安装：装 Nginx、部署配置、自检
```

> `deploy/` 目录不参与站点部署，打包脚本会自动排除它；站点服务器上也已屏蔽 `/deploy/` 路径。

---

## 🔑 占位符说明

本仓库是**公开**的，因此所有文档与示例命令里的服务器地址、端口一律写成占位符。**复制命令前请先替换为真实值。**

| 占位符 | 含义 | 对应 NAT 映射 |
|---|---|---|
| `<服务器IP>` | 服务器公网 IP | — |
| `<SSH端口>` | SSH 的外部端口 | 外部 → 内部 `22` |
| `<网站端口>` | 网站的外部端口 | 外部 → 内部 `80` |
| `<NTP端口>` | NTP 的外部端口 | 外部 → 内部 `123` |

替换示例（示例值用 RFC 5737 保留网段与明显假端口，勿照抄）：

```bash
# 文档里的写法
scp -P <SSH端口> release/sky-gap-site.tar root@<服务器IP>:/tmp/

# 替换真实值后（仅在本机执行）
scp -P 12345 release/sky-gap-site.tar root@203.0.113.10:/tmp/
```

**真实值只存在本地** `服务器运维/服务器信息.md`（含 IP、端口、Cloudflare 配置与网络限制）。该目录同时在三个方向被拦住：

| 出口 | 拦截方式 |
|---|---|
| 不进 GitHub | `.gitignore` 排除 `服务器运维/` |
| 不进部署包 | `deploy/pack-site.sh` 的 `--exclude` 与排除项自检 |
| 不进网站 | `web.config` 的 `hiddenSegments` 与 `sky-gap.conf` 的 `location` |

> ⚠️ 这三道只拦「目录连带上传」。**手动粘贴命令时请自行注意**，不要把替换后的真实值写回仓库里的文档。

---

## 生产环境现状

| 项 | 值 |
|---|---|
| 域名 | `www.080322.xyz` / `080322.xyz` |
| 服务器 IP | `<服务器IP>` |
| 系统 | Ubuntu 24.04.1 LTS |
| 站点路径 | `/var/www/sky-gap` |
| 站点配置 | `/etc/nginx/sites-available/sky-gap` |
| Web 服务器 | Nginx 1.24 |
| SSH | `<服务器IP>:<SSH端口>`，用户 `root` |
| 网站访问 | `http://<服务器IP>:<网站端口>` |

> 真实的 IP 与端口**不写入本仓库**（仓库公开）。实际值记录在本地 `服务器运维/服务器信息.md`，那里还有两个填好真实值、可直接运行的脚本（`deploy.sh` 一键部署、`astrbot-install.sh`）。`服务器运维/` 不进 git、不进部署包，并在 Web 服务器上被屏蔽。

### NAT 端口映射

端口映射保存在虚拟化层，**重装系统不会丢失**，但要能从外网访问新服务，必须在云面板新增映射：

| 外部端口 | 内部端口 | 用途 |
|---|---|---|
| `<网站端口>` | 80 | 网站 |
| `<SSH端口>` | 22 | SSH |
| `<NTP端口>` | 123 | NTP |

> 本机是**共享出口 IP** 的 NAT 实例：同一台物理机上其他用户也做端口映射，同一端口号可能已被占用。若某个外部端口映射后不通，换一个端口号重新映射即可。

---

## ⚠️ 网络可达性限制（重要）

这台服务器**仅中国大陆境内可达**，这是机房/线路层策略，无法在面板或系统内修改。部署和选型前必须先了解这一点。

### 实测证据

| 测试方向 | 结果 |
|---|---|
| 境外 → 服务器（含 ICMP ping） | ❌ 全球多节点全部超时 |
| 服务器 → 境外（google / github / cloudflare） | ❌ 全部连接超时 |
| 服务器 → 境内（百度 / 阿里云） | ✅ 正常 |
| 境内 → 服务器 | ✅ 正常 |

境外拨测连 **ICMP ping** 都不通（不涉及任何端口），说明是 IP 层不可达，而非防火墙或端口映射问题。服务器内部 `iptables` 规则为空、`ufw` 未启用，源站侧没有任何拦截。

### 由此排除的方案

| 方案 | 结论 |
|---|---|
| Cloudflare 代理回源 | ❌ 海外边缘节点连不到源站，返回 522 |
| Cloudflare Tunnel | ❌ 需服务器出站连 `argotunnel.com:7844`，实测不通 |
| 国内 CDN | ✅ 节点在境内，可用 |
| 直连源站 | ✅ 可用（当前方案） |

### 当前的访问链路

```text
访客浏览器
   │  https://www.080322.xyz
   ▼
Cloudflare（仅做跳转，不代理内容）
   │  307 Redirect → http://<服务器IP>:<网站端口>
   ▼
源站 Nginx :80
```

Cloudflare 的 Redirect Rule「个人网站」把访客 307 跳转到源站端口。**这不是最优架构**，是被上面的网络限制逼出来的方案——Cloudflare 海外节点连不到源站，只能让访客浏览器自己直连。

代价：

- 地址栏显示 `http`，浏览器标记「不安全」
- 源站 IP 明文暴露在跳转地址中
- Cloudflare 的缓存与 WAF 完全不生效

> Cloudflare 上另有一条**已停用**的 Origin Rules「回源端口改写」，保留备用。

---

## 部署流程

> 💡 **本地已有一键脚本**：`服务器运维/deploy.sh` 把下面四步合成一条命令（真实值已填好，无需替换占位符）。本节保留手动流程，供换机、排查或分步执行时参考。

### 一、准备部署包

在本地项目根目录运行：

```bash
bash deploy/pack-site.sh
```

产出 `release/sky-gap-site.tar`（约 194 MB / 4274 个条目），并自动校验关键文件是否齐全。

打包会排除 `.git/`、`release/`、`deploy/`、`服务器运维/`、`web.config`、`.gitignore` 与各内部文档；保留 `assets/music/`、`assets/twemoji-72x72/`、`robots.txt`、`sitemap.xml`、`tools/`、`LICENSE` —— 这些不进 git 或需明确随站发布，但**部署时必须有**。

打包结束会跑两组自检：**关键文件**必须齐全（`index.html`、`css/style.css`、`js/main.js`、`assets/music/playlist.js`、`assets/twemoji-72x72/1f41f.png`、`robots.txt`、`sitemap.xml`、`tools/index.html`、`LICENSE`），**排除项**必须真的没混进去。任一不满足即报错退出。

> **打包脚本的两个易踩坑点**（改动前务必先读）：
> 1. `tar -tf` 默认把非 ASCII 条目名转义成八进制（`服务器运维` → `\346\234\215...`），照原样 `grep` 中文**永远匹配不到**，排除项自检会退化成「永远显示已排除」的假检查。必须加 `--quoting-style=literal` 并配合 `grep -qF`。
> 2. `tar -tf | grep -q` 在 `set -o pipefail` 下会误判：`grep -q` 命中即退出 → `tar` 收到 SIGPIPE → 整条管道被判失败，表现是「关键文件全部缺失」的假报警。须先把列表落到临时文件再做比对。

### 二、上传

```bash
scp -P <SSH端口> release/sky-gap-site.tar root@<服务器IP>:/tmp/
scp -P <SSH端口> -r deploy/nginx root@<服务器IP>:/tmp/deploy-nginx/
```

### 三、解压与安装

```bash
ssh -p <SSH端口> root@<服务器IP>

mkdir -p /var/www/sky-gap
tar -xf /tmp/sky-gap-site.tar -C /var/www/sky-gap

cd /tmp/deploy-nginx && bash install.sh
```

`install.sh` 会自动完成：安装 Nginx → 修正文件权限 → 安装站点配置 → 移除默认站点 → `nginx -t` 语法校验 → 启动并设为开机自启 → 本机 curl 自检。

### 四、验证

```bash
# 服务器本机（期望 200）
curl -I -H 'Host: www.080322.xyz' http://127.0.0.1/

# 外网（境内，期望 200）
curl -I http://<服务器IP>:<网站端口>/

# 域名（期望 307 → 200）
curl -I https://www.080322.xyz

# 屏蔽路径（全部期望 403）
for p in /memory.md /memory-tools.md /README.md /deploy/ /release/ \
         /generate_playlist.py /web.config /.git/config /服务器运维/; do
    printf '%-24s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' \
        -H 'Host: www.080322.xyz' "http://127.0.0.1${p}")"
done
```

---

## Web 服务器配置

`web.config`（IIS）与 `deploy/nginx/sky-gap.conf`（Nginx）**功能等价**，按服务器环境二选一。改动其中一份的缓存、安全头或屏蔽清单时，**另一份必须同步**。

### 缓存策略

| 内容 | 时长 |
|---|---|
| HTML | 不缓存 |
| CSS / JS | 1 天 |
| `assets/` | 7 天 |
| `assets/music/` | 30 天 |
| `live2d/` | 7 天 |

> **Nginx 注意**：必须用 `expires` 而非 `add_header` 设置缓存。`location` 块里一旦出现 `add_header`，会覆盖从 `server` 级继承的**全部** `add_header`（包括 CSP），导致安全头丢失。`expires` 无此副作用。

### 安全响应头

`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Content-Security-Policy`、`Strict-Transport-Security`。

CSP 允许的来源都有明确用途，**修改前请先读 `memory.md` 对应条目**：

- `blob:` —— `connect-src`（Live2D 加载 JSON）与 `media-src`（本地音乐）**都必须保留**
- `https://www.google.com` —— 工具箱的站点图标来源
- `https://cdn.jsdelivr.net` —— Twemoji 图标 CDN
- `https://v2.xxapi.cn` —— 星座运势 API

> **绝对不要添加 `upgrade-insecure-requests`** —— 源站服务在 HTTP 上，加了会导致子资源全部加载失败。

### 屏蔽的路径

`.git`（含所有点开头的文件）、`release/`、`deploy/`、`服务器运维/`、`memory.md`、`memory-tools.md`、`README.md`、`generate_playlist.py`、`web.config`。

这是纵深防御：这些内容打包时已排除，服务器上再拦一层，防止日后误传。两份配置的屏蔽清单**必须保持一致**：

| 屏蔽项 | `web.config`（`hiddenSegments`） | `sky-gap.conf`（`location`） |
|---|---|---|
| `.git` | ✅ | ✅（`location ~ /\.`，覆盖所有点开头的文件） |
| `release/` | ✅ | ✅ |
| `deploy/` | ✅ | ✅ |
| `服务器运维/` | ✅ | ✅（中文路径匹配已实测有效） |
| `memory.md` / `memory-tools.md` / `README.md` / `generate_playlist.py` | ✅ | ✅（合并为一条正则） |
| `web.config` | IIS 默认即不可下载 | ✅（含在同一条正则内） |

> IIS 的 `hiddenSegments` 默认不含 `.git`，一旦把项目目录整体拷到站点根，`/.git/config` 可被直接下载，等同于公开源码与全部提交历史 —— 所以两份配置里 `.git` 都是**必加项**。

---

## MIME 类型

`.moc` / `.mtn` 是 Live2D 专有格式，需要注册为 `application/octet-stream`：

- **IIS**：由 `live2d/web.config` 注册
- **Nginx**：已在 `sky-gap.conf` 的 `location ^~ /live2d/` 中声明

---

## 常见问题

### 境外访问 522 / 超时

正常的，见上文「网络可达性限制」。Cloudflare 海外节点连不到这台服务器。

### `apt-get update` 全部连接超时

`archive.ubuntu.com` 与 `security.ubuntu.com` 在这台机器上不可达。`install.sh` 已内置镜像切换逻辑（幂等，原文件备份为 `.bak`），也可手动执行：

```bash
sed -i -E \
  -e 's|https?://[a-z0-9.-]*archive\.ubuntu\.com|https://mirrors.aliyun.com|g' \
  -e 's|https?://security\.ubuntu\.com|https://mirrors.aliyun.com|g' \
  /etc/apt/sources.list.d/ubuntu.sources
apt-get update
```

### 静态资源返回 403

属正常行为，命中了屏蔽规则。若确认是误拦，检查 `sky-gap.conf` 里的 `location` 屏蔽段。

### 改了 CSS / JS 访客看不到更新

`index.html` 中 CSS / JS / 字体 CSS / `playlist.js` 的引用都带 `?v=` 版本号，HTML 不缓存但 css/js 缓存 1 天。**发布时记得递增版本号**，否则老访客 24 小时内会拿到「新页面配旧脚本」。

### 文件权限异常

`tar` 解压出的权限不可靠（常见 777）。`deploy/nginx/install.sh` 已包含权限修正步骤：

```bash
find /var/www/sky-gap -type d -exec chmod 755 {} +
find /var/www/sky-gap -type f -exec chmod 644 {} +
chown -R root:root /var/www/sky-gap
```
