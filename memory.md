# memory.md

本文件是 Roxy 在「孤鱼GY 个人主页」项目中的记忆库。每次在该仓库工作时先通读本文件，再动手改代码。

## 项目概述

孤鱼GY 的个人主页 — 纯静态 HTML/CSS/JS，无框架、无构建工具。

> **优化提醒**：魔术数字集中管理在 `main.js` 开头的 `CONFIG` 对象中，修改参数前先检查。

## 文件结构

```text
index.html              — 入口（SEO、OG、JSON-LD、Twemoji）
css/style.css           — 全部样式（CSS 变量 + 响应式）
js/main.js              — 全局 rAF 调度、光粒子、飞鱼、音乐播放器、日夜切换、访客统计
js/zodiac.js            — 星座运势、星轨生日选择器、星空 Canvas、烟花动效
js/settings.js          — 设置面板（gy_settings 存储、齿轮按钮、毛玻璃面板、主题/特效/音乐/看板娘）
js/smoothScroll.js      — 滚轮动量滚动接管（整页 + 设置面板复用播放列表手感；暴露 window.__gySmoothScroll）
js/localMusic.js        — 本地音乐存储层（双轨：FSA 句柄持久化 / 内存会话轨；暴露 window.__gyLocalMusic）
generate_playlist.py    — 扫描 assets/music/ 生成 playlist.js（含 U+00A0 文件名警告）
release/                — 构建输出目录（部署打包用，git 不跟踪，勿删）；已发布 sky-gap-v1.0.0/1.1.0/1.2.0.zip
live2d/                 — 看板娘（autoload.js 入口 + waifu-tips.js + chunk/ + SDK + 双模型）
assets/                 — 头像、apple-touch-icon、og-image、favicon、Twemoji 库、字体、音乐
web.config              — IIS 缓存策略 + 安全头（CSP/HSTS 已启用）+ 压缩 + requestFiltering 屏蔽敏感路径；live2d/web.config 注册 .moc/.mtn MIME

## 字体（Ma Shan Zheng 马山正体）

- **unicode-range 分片方案**（2026 优化）：`assets/fonts/ma-shan-zheng.css` 引用 91 个分片（`assets/fonts/split/ma-shan-zheng-{N}-400-normal.woff2`，来自 @fontsource@5.2.9 的 400.css），浏览器按页面用到的汉字下载对应分片，不再加载 2.6MB 整包。
- **分片 119 是关键"常用字片"**：覆盖基本拉丁字母/数字/常用汉字（一/中/新/日等），默认必下载；其余分片按需。
- **latin 必备**：`ma-shan-zheng-latin-400-normal.woff2`（13KB）补齐基本拉丁区缺口（N、^、`、|、~ 等分片 119 未覆盖的码位），CSS 里 unicode-range 明确限定，勿删。
- **更新字体分片流程**：从 jsDelivr `@fontsource/ma-shan-zheng@5.2.9/400.css` 复制 unicode-range 块 → 下载对应 `files/ma-shan-zheng-{N}-400-normal.woff2` → 丢弃 woff 只留 woff2 → 更新本地 CSS。
- **index.html 无需 preload 字体文件**（分片后浏览器自动按需），只保留 CSS preload + avatar preload；API 域名 v2.xxapi.cn 有 `dns-prefetch`。**CSS 的 preload 必须排在 `stylesheet` 之前，且两处 URL 完全一致（含 `?v=`）** —— 排在后面等于没提前发现，URL 不一致会白下载两次。
- **性能预算**：首屏约 22 分片 ~1.6MB（原整包 2.6MB），全站交互后约 44 分片 ~2.2MB。

## 核心架构

### 设置面板（`js/settings.js`）

统一设置入口——把社交栏原「日夜切换」按钮替换为齿轮设置按钮（`#settings-toggle`），点击弹出毛玻璃面板（`#settings-overlay`）。所有偏好持久化到单一键 `gy_settings`（JSON）：
`{ theme, effects:{particles,fish,clouds,starfield}, music:{mode}, live2d }`

- 跨模块接口（main.js/zodiac.js/autoload.js 各自暴露，settings.js 统一调度）：
  - `window.__gySettings.get()/save(patch)`：存储读写，`deepMerge` 深浅合并保证单键改动不丢其他键。
  - `window.__gyTheme.set(theme)`（'auto'/'day'/'night'）：驾 `_nightManual` + `applyNight` + 持久化；重置初始值也从设置读取。**社交栏不再有独立日夜按钮**。
  - `window.__gyFx`（`register(name,fn)` / `set(name,on)`）：视觉特效开关注册表。main.js 注册 particles/fish/clouds，zodiac.js 注册 starfield。
  - `window.__gyMusic`（`getMode/setMode/getVolume/setVolume`）：播放模式与音量，主播放器 modeBtn 切换也持久化到 `gy_settings.music.mode`；音量仍走现有 `gy_volume`/`gy_muted` 存储（不迁移）。设置面板音量条**复用 main.js 的 `createSlider` 工厂**（暴露为 `window.__gyCreateSlider`），与音乐播放器音量条同款拖拽/键盘逻辑 + `.volume-bar-wrap/.volume-fill/.volume-pct` 样式。
  - `window.__gyWaifu`（`set(on)/getLoaded()`）：控制 live2d-widget 根容器 `#waifu` 显隐；`initLive2D` 读取 `gy_settings.live2d`，为 false 时跳过加载（省 ~2.6MB）。

**面板打开期间不接管页面滚动**（2026 修复"滚轮穿透"）：`html/body` 上加 `overflow: hidden` 锁页面是**错误做法** —— 文档一旦不可滚动，浏览器会把 scrollY 归零（滚到 700 时开面板会直接跳到 60，整页位置丢失）。现在是纯拦截式：
- `overlay` 上 `wheel`（`passive: false`）：目标不在 `#settings-panel` 内 → `preventDefault()`；滚动键（空格/翻页/方向键）同理，但空格对 `button/a/input/[role=button]` 是激活键，放行。
- `overlay` 上还要拦 `touchmove`（`passive: false`），同样是"目标不在 `#settings-panel` 内就 `preventDefault`"。
- **判定范围是整个面板，不是 `.settings-body`**：标题行、面板四周内边距上的滚轮同样归面板管。只认 `.settings-body` 时这些位置会被 `preventDefault` 吞掉 —— 既不滚面板也不滚页面，表现为"滚了完全没反应"。
- `.settings-overlay { overscroll-behavior: contain; touch-action: pan-y }` + `.settings-body { overscroll-behavior-y: contain; touch-action: pan-y }`：面板滚到顶/底不把滚动链给页面。
  ⚠️ **遮罩上绝不能写 `touch-action: none`**：触摸滚动的判定取的是"触摸目标 → 滚动容器"整条祖先链的**交集**，祖先一旦是 `none`，面板内部（`.settings-body`）的触摸滚动会一起被封掉，真机上表现为"面板里滑不动"。用 `pan-y` + 上面的 `touchmove` 拦截才对。
- 开关面板与页面滚动位置完全解耦：布局零改动，开关前后 scrollY 不变（按钮 ✕ / 点遮罩 / Esc 三种关闭方式同一条路径）。
- **焦点回齿轮会带着页面跳**：`#settings-toggle` 在页面顶部，用户在下方关闭面板时默认 `focus()` 会把整页滚回顶部，所以统一走 `focusNoScroll()`（`focus({preventScroll:true})`）。打开时聚焦关闭按钮必须等面板真正可见（`visibility: hidden` 的元素聚焦无效）→ rAF 里加 `.open` 后读一次 `offsetHeight` 强制样式重算再聚焦。

### 滚轮动量滚动（`js/smoothScroll.js`）

整页滚动与设置面板滚动的"丝滑感"来自播放列表那套算法，抽成通用接管器后三处共用：
惯性摩擦 + EWMA 平滑（抑制尖峰 delta）+ 单次增量限幅，滚一格只走一小段再缓动停下。

- **参数同源 + 按容器配步长**：`main.js` 把自己的 `CONFIG.playlist` 挂到 `window.__gyScrollPhysics` 作为基准（`friction 0.92 / wheelGain 0.18 / maxSpeed 10 / maxSpeedChange 1.8 / wheelSmoothAlpha 0.55`），接管器运行期优先读它，读不到才用内置兜底值（两份数值必须一致，改一处要同步另一处）。各容器只用 `opts.physics` 覆盖**步长**字段，摩擦与平滑形状一律沿用基准，手感才不会散：
  | 容器 | 覆盖 | 单格位移 |
  | --- | --- | --- |
  | 播放列表 | 用基准 | ~22px（约一行） |
  | 设置面板 | `maxSpeedChange 6 / maxSpeed 18` | ~75px |
  | 整页 | `maxSpeedChange 12 / maxSpeed 26` | ~150px |
  单格位移 ≈ `maxSpeedChange / (1 - friction)`；调快慢只动 `maxSpeedChange`（整页在 `CONFIG.pageScroll`，面板在 `settings.js` 的 attach 处），别去动摩擦，否则惯性拖尾形状会跟播放列表不一致。
- **只接管桌面鼠标滚轮**：`(pointer: coarse)` 直接不绑监听（触摸原生惯性更跟手）；换算后 `|delta| < 50` 判定为触控板等精细设备，放行给原生（原生本身就平滑）。
- **必须放行的四类事件**：`e.defaultPrevented`（已被播放列表等接管）、`ctrlKey/metaKey`（浏览器缩放，拦了就缩放不了）、横向手势（`|deltaX| > |deltaY|`）、容器不可滚（`scrollHeight <= clientHeight`）。
- **互斥关系**：`main.js` 的整页接管 `isActive` 里排除"设置面板已打开"，并用 `skip` 放行落在 `.music-playlist` / `.settings-body` 内的滚轮（这两处各有自己的接管器）；设置面板的接管器 `isActive` 只管面板是否打开。
- **按需 rAF**：速度归零立即退出帧循环（不常驻占帧），与播放列表的动量滚动同款做法；`stop()` 可立即刹停。
- 键盘滚动、滚动条拖拽、锚点跳转、`scrollIntoView`、程序化 `scrollTo` 全部不接管，走原生。

### 全局 rAF 调度（`main.js` `_globalLoop`）

所有动画子系统通过 `window._registerTick` 注册到统一 rAF 循环，共享 `_pageVisible` 控制启停。注册者：光粒子、飞鱼、星空。**禁止独立 rAF 循环**。

### 光粒子（`main.js` `initParticles`）

全屏发光粒子。性能：光晕初始化时预烘焙为离屏 sprite（`makeSprite`），运行时 `drawImage` + `globalAlpha` 闪烁，替代每帧 `shadowBlur`——视觉逐像素等价（fill α 与光晕 α×0.6 由 globalAlpha 统一缩放）。改绘制方式时须保持等价。

### 飞鱼自主飞行（`main.js` `initParallax`）

SVG 飞鱼三种模式（漫游/追逐光标/受惊逃跑），`transform: translate3d()` 驱动（Compositor-only）。关键：`transform-origin: 42.1% 51.6%`；瞳孔追踪低通滤波（30% 帧插值）。

### 音乐播放器（`main.js` `initMusic`）

四行卡片 UI（曲名 → 控制 → 进度条 → 列表/模式/音量）。核心设计：

- `createSlider(container, onChange, onKey)` 工厂统一处理进度条/音量条拖拽；**第三参数 onKey 为键盘回调**（进度条 ±seekStep/±seekStepFast/Home/End 改 `audio.currentTime`，timeupdate 回写 UI；音量条复用 `adjustVolume`，自然带静音解除/持久化）
- 播放列表：事件委托 + DOM 缓存（首次渲染后仅更新高亮）；开关只由 ☰ 按钮控制
- 智能预加载下一首；音频错误达阈值停止
- 静音：`_isMuted` + `_volumeBeforeMute` 独立管理，静音态与恢复音量持久化（`gy_muted` + `gy_volume`），拖动音量条/键盘调音量均需同步 `_isMuted`
- 键盘快捷键：空格播放/暂停、左右切歌、上下调音量（INPUT/TEXTAREA 及 `role="slider"` 内不触发——滑块自己的方向键由 createSlider 的 onKey 处理，二者不冲突）
- 播放列表滚动陷阱见「重要注意事项」
- **曲名是原生 `<button>`**（`#music-label`，可点击复制），CSS 里有 button 样式重置，勿改回 span

#### 曲目模型与本地音乐（2026 新增）

- **曲目模型**：`tracks[]` 是**当前激活标签的播放队列**（本地音乐 / 网站歌单二选一）。
  条目为 `{ i, tid, name, src }`；`src.type` 为 `'local'`（走 `__gyLocalMusic.getFile` → `createObjectURL`）或 `'builtin'`
  （拼 `CONFIG.music.dir + encodeURIComponent(file)`），两种源由 `resolveTrackUrl()` 收口，播放/切歌/预加载只认 `tracks`。
  因队列随标签切换，`totalTracks`/`currentIndex`/随机/上一首下一首全部天然只在当前列表内生效，无需额外分支。
- **稳定标识 `tid` 而非索引**：本地曲目增删会让索引整体位移，因此列表高亮、`selectTrack`、`_playTrackIndex()` 全走 `tid`
  （本地用 `entry.id`，内置用 `'B' + encodeURIComponent(文件名)` —— 必须 URL 编码，否则含引号的文件名在 HTML 属性里会错位）。
- **列表标签页（本地音乐 / 网站歌单）**：`switchTab()` 调 `buildTracks(tab)` 换队列 + `renderPlaylist()` 重绘；
  `_signature()` 把 `_activeTab` 计入，否则切标签不会重建。正在播放的曲目**不受切标签影响**（`_currentTid` 保留），
  当它不属于新列表时不高亮任何行，并由 `_playTrackIndex()` 兜底避免"下一首"从错误位置起跳。
  `renderPlaylist` 末尾只在 `_currentInQueue()` 为真时定位滚动。
- **列表渲染**：`renderPlaylist()` 用 `_signature()`（标签 + 内置曲目摘要 + 本地 `id` 摘要）判定是否需要重建，
  避免每次打开都重建 60+ 行；事件委托只绑一次（`_delegated`），`innerHTML` 替换不影响委托。
  列表内**不提供任何导入入口**（选择来源的动作全部在设置面板完成），本地为空时只给一行去设置面板的提示文字。
- **本地列表的序号取列表位置（`rowIndex + 1`）**：`localTracks` 里是**存储层条目** `{ id, name, handle, state }`，
  没有序号字段（序号 `i` 只存在于 `buildTracks()` 产出的 `tracks[]` 条目上）。本地列表的渲染顺序与 `tracks` 队列一致，
  所以直接按列表位置编号即可与播放队列对齐；若误用 `entry.i` 会渲染成 `NaN`。
- **导入入口在设置面板**：`#settings-pick-files` / `#settings-pick-dir` 两个按钮，由 main.js 绑定并调用
  `replaceLocalMusic()`（**先 `clearAll()` 再选新来源** —— 语义是"更改路径"，旧列表整批替换，不追加）。
  降级环境按钮改为触发隐藏的 `#local-file-input` / `#local-dir-input`。
  ⚠️ **`onInputChange` 必须先 `Array.prototype.slice` 取出文件再 `input.value = ''`**：
  复位 input 会清空它的 `FileList`，而后续清空/导入是异步的，直接持有 `files` 到那时会一个文件都读不到。
- **「清除选择」按钮（`#settings-clear-local`）**：只清浏览器里记录的**文件引用**（内存条目 + IndexedDB 句柄与文件夹名 + blob URL），
  **不碰磁盘文件** —— 本模块只申请过 `mode:'read'` 权限，从来没有写权限，所以技术上也不可能删改用户的文件；
  按钮文案与面板常驻说明（`.settings-local-note`）都写明这一点。无曲目时按钮由 `syncSettingsLocalUI()` 隐藏。
  `clearLocalMusic()` 的收尾顺序很关键：`pause()` → 清 `audio.src` 与 `_loadedSrc` → `_currentTid=''`、`started=false`、
  `currentIndex=0` → 切回 `builtin` 标签 → `buildTracks()` + `updateTabUI()` + `renderPlaylist()` + `syncSettingsLocalUI()`。
  出厂状态回到"没选过本地音乐"，按播放键会重新开始。
- **索引库结构升级与"清干净"（2026 修复"清除后刷新又冒出来"）**：`IDB_VERSION` **加表就必须 +1**（当前 2，`handles` + `meta`）。
  浏览器只在版本号变化时才触发 `onupgradeneeded`，版本号不动的话旧库永远缺新表。
  由此引出本次线上问题：`idbClearAll()` 原先用 `db.transaction(['handles','meta'])` 一次性清两张表，
  在**缺 `meta` 的旧库**上这句直接抛 `NotFoundError`，而整个函数把异常吞掉并 resolve —— 表现为"提示清除成功、列表也空了，
  但刷新后曲目原样复活"（`handles` 里的句柄记录根本没被清掉）。现在 `idbClearAll()` **改为遍历 `db.objectStoreNames` 逐表清**
  （不认表名，旧库/陌生表也一并清），并且 `idbGetAll / idbMetaGet / idbMetaSet` 都先判断表是否存在，
  缺表按"无数据"处理，不再抛错。另外：`openDB()` 失败不再缓存失败的 Promise（否则一次超时会拖死整场会话的读写）；
  `db.onversionchange` 里主动 `close()`，避免别的标签页升级结构时被本连接卡在 `blocked`；升级被卡住时退回
  `openDBExisting()`（不带版本号连接）至少把记录清掉。
- **默认落在有内容的列表**：无本地曲目时 `_activeTab = 'builtin'`（避免打开列表先看到空列表）；`restore()` 完成后按曲目数决定。
- **设置面板信息同步**：`window.__gyMusic.syncSettingsUI()` 由 `settings.js` 的 `applyLocalMusicUI()` 在每次打开面板时调用
  （曲目数可能在面板关闭期间变化）。路径展示为「文件夹名 · N 首」；**无曲目时不显示文件夹名**，避免降级环境残留过期路径。
- **导入后自动切到本地标签**：`finishImport` 里 `_activeTab = 'local'`（仅当确实新增了曲目），否则用户在"网站歌单"标签下看不到导入结果。
- **`buildTracks()` 顺手调 `updateTabCounts()`**：队列重建必然伴随列表内容变化，集中刷新标签计数，避免各调用点漏刷。
- **异步加载必须先等 src 落地**：`loadTrack()` 返回 Promise（本地曲目取文件是异步的），
  `selectTrack / playPrev / playNext / 首次播放 / next-btn` 一律 `loadTrack(...).then(play)`，
  **不得同步 `loadTrack(); play();`** —— src 未赋值就 play 会立刻抛 `AbortError`（表现为"播放失败"）。
- **错误归属判定 `_loadedSrc`**：`error` 事件可能晚于用户切歌才到达，
  须比对 `audio.src === _loadedSrc` 才能确认错误属于"现在这首"，否则过期错误会打断新曲目播放。
- **失效即自动消失（无人工清理入口）**：本地曲目解码失败或文件被移走 → 直接从内存与 IndexedDB 移除该条 →
  `buildTracks('local')` + `renderPlaylist()` + `updateTabUI()` + `syncSettingsLocalUI()` 让列表/计数/设置面板同步。
  恢复阶段（`restore()`）同样把读不到的文件剔除并清理记录，因此列表里**不会出现标灰条目**。
- **`window.__gyLocalMusic` 接口**：`canPersist / restore / pickFiles / pickDirectory / addFiles / getFile /
  createBlobUrl / revokeBlobUrl / releaseBlobs / clearAll / getPathName / remove / isAudioFile / entries`。
  双轨规则：安全上下文 + FSA + IndexedDB 三者齐备时用真实句柄持久化（IndexedDB 存 handle）；
  否则句柄降级为 `{ kind:'memory', file }` 只活在本会话，UI 显示"仅本次浏览有效"。
- **恢复阶段区分"失效"与"待授权"**：`restore()` 只做不需要授权的检测 —— `queryPermission` 返回非 `granted` 的条目算**待授权**
  （保留在列表里，真正授权留到用户点播时，避免刷新后连环弹窗），并在 `needAuth` 计数里返回，由 `warnNeedAuth()` 提示去设置面板重选；
  只有"已授权但读不到文件"才判定为**已失效**，从列表与存储中剔除。`pagehide` 统一 `releaseBlobs()` 撤销 blob URL。

### 星座星空模块（`zodiac.js`）

布局：hero（100vh）→ 星座区（Canvas 透明底与页面同色）→ 页脚。启动顺序：`initFortune` → `initStars`（先于星轨，CONSTELLATIONS 供查询）→ `initStarTrail` → 注册 `window._onThemeSwitch` → `initScrollBehavior`。

1. **运势**：API 查询今/周/月/年运势，`AbortController` 竞态保护，移动端始终展开。结果按「星座 + 时段」缓存进 `sessionStorage`（key `gy_fortune:{星座}:{时段}`，TTL 10 分钟，命中即直接 `renderFortune` 不发请求）。失败提示分**超时 / 网络 / 数据**三类，`renderFortune` 单独 `try/catch`（接口结构变化不会被归成网络失败、让人白重试网络），重试按钮带 500ms 节流。
2. **星轨滑星（生日选择器，`initStarTrail`）**：双弧同心滑轨——**内弧月（12 节点，半径 150）+ 外弧日（星点，半径 235）**，viewBox 640×344，弧心 (320,330)。**默认选中 1 月**（`_selMonth = 1`：金色星核 + 月份高亮初始落位 1 月节点，日期弧显示 1 月，hint「1月 · 沿外弧滑选日期」；resetState 同样回 1 月）。**每轨一条透明命中带 `.trail-arc-hit`**（stroke 72 宽、touch-action:none、pointer-events:stroke，顶层独立存在，不随 dayArc 重建）；`pointerdown` 命中哪条轨就锁定 `_dragArc` 直到松手（维度绝不误判），桌面/手机统一：按下即选 + 滑动连续选取（`_pending` rAF 合并调度）。轨道带外：容器 `touch-action: pan-y`，触摸滚动页面；旧版 Safari（SVG 子元素 touch-action 不生效）兜底 = `touchstart` 里 `isNearArc`（±24 几何判定）才 `preventDefault`。**换月日期弧三态**（`updateMonth(m, mode)`：'start'/'move'，配合 `buildDayArc(animate)`）：**按下即选（'start'）→ 日期数字立即显示无动画**（`buildDayArc(false)`，月节点弹跳）；**滑动跟随（'move'）→ 日期弧保持不动（`_dayArcDirty` 推迟重建）避免快速切换闪烁，月节点不弹**；**松手（`endDrag`）→ 先应用 `_pending` 残留落点，再统一重建** `buildDayArc(true)`——**日期数字从弧线上沿径向依次升起**（`trail-label-rise`：起点 = 弧线位置（JS 设 `--rise-x/y` 径向偏移），飘出到弧外 18 单位标签位 + 淡入缩放，animation-delay 递增）+ 星点同样亮起。**弧线 `.trail-day-line` 无动画直接显示**；`buildDayArc` 防抖：距上次**动画**重建 <350ms 降级为即时（按下时的无动画重建不占防抖窗口，`_lastAnim` 只记录动画重建）。选中日 → 金环涟漪 `.trail-ring`（animationend 自清理）+ 星座图标 `.tarot-oracle.pop` 重放；**选中月节点同样金环涟漪**（`spawnRing(x,y,parent)` 通用函数，父分组 = dayArc/monthArc）；星核 `setCoreTo` 用 CSS transform（`.trail-core-group` transition，`.dragging` 禁用）。**视觉契约**：日弧为**一条完整 2.5px 纯色细线**（`.trail-day-line`，stroke: var(--accent)，**无渐变、不随星座分段**——分段色在浅底上对比度不足会断块）；**外弧弧线外侧 18 单位处为日期数字** `.trail-day-label`（全部常显 opacity .6、**无出现动画**（换月随重建直接显示），选中日 `.active` 金色加粗）；内弧引导线 `.trail-month-guide`（单色蓝）；**无弧上宫符标签**（星座图标只在确认按钮上方 `#tarot-oracle` 出现）；日期星点**全部常显**（不随选中状态淡出，选中日 `.active` 金色高亮）。**无自动复位**——仅「重新选择」按钮/日夜切换调 `resetState()`。**换月即取消选日**：`_selDay`/`orbitState.day`/`activeSignIndex` 清零 + `_updateGlow(-1, 0)`（防止上次选中星座的发光残留）；星核初始落位在 `svg.appendChild(frag)` **之前**执行（首渲染无过渡，避免从 SVG 原点 (0,0) 飞入 1 月的问题）。
3. **星空 Canvas**：200 粒子（移动端 100），`_canvasVisible` 控制启停（白天仅庆祝粒子时临时激活）；流星仅夜间生成。手机端跳过星座节点/连线/光束。性能：DPR 上限 2；`_sectionInView` 视口门控（section 滚出视口暂停绘制，庆祝粒子不受门控）。**星座连线确认后逐笔描画（夜间专属）**：**reveal 触发条件必须是 `_revealHold <= 0`（勿改回 `=== 0`）**——`_revealHold` 按浮点帧步长 k 递减，`=== 0` 永远不命中导致连线从未描画过（2026 修复）。
4. **庆祝烟花**：60 + 35 粒子，带重力/拖尾/闪烁。爆发源：夜间桌面 → 星座中心；**触屏设备（`isTouchCoarse`，含横屏手机 >768px）→ 星核（当前选中位置）→ 星轨中心 → 按钮回退**；白天桌面 → 确认按钮上方 30px。**注意**：`isMobileViewport`（≤768px）在横屏手机/大屏触屏上为 false，烟花判定必须用 `isTouchCoarse`（宽度 OR pointer:coarse），否则触屏会走桌面分支炸在按钮上。
5. **引导光束** `spawnStarBeam`：**从「确认选择」按钮中心射向对应星座**（仅夜间桌面，`_canvasVisible` 门控）。触发：鼠标进入**确认区** `.tarot-actions`（按钮 + 四周留白，不再只绑按钮，避免指针擦边就断）或键盘 focus 时生成 **`hold` 待机光束**——**连上后一直亮着，不自行消散**（`t` 累加推进呼吸相位，`life` 不递减；`bt` 钳在 0.6 停在闪烁段）；离开确认区 / blur（指针不在确认区时）才 `window._clearStarBeam()`。确认点击换成**金光一次性闪灭**（`doConfirm` 先射后隐藏按钮，rect 仍有效；`orbitState.confirmed` 之后 mouseleave 不再清空，让它自然闪完）。**替换式**——生成时 `starBeams.length = 0`，任何时刻最多一条；待机光束**每帧用 `beamOrigin()` 重取按钮中心**，页面滚动后不脱节。选中日期不再自动发射。移动端不生成（无 hover 且 `isMobileViewport` 门控）。
5. **星座数据** `CONSTELLATION_SHAPES`：**取自官方星座连线数据（Stellarium 现代天球星空文化），球心投影后两轴同比缩放（最大边 = 1）**——形状/比例/连线拓扑/星等与真实星空一致，`mags` 为该点真实星等（查最近恒星，偏差 0.000°）。**两轴必须同比缩放**，若各自归一成 0~1 会把宽高比抹平成方形（`fw/fh` 就是真实宽高比，`generate()` 的 `k = min(bw/fw, bh/fh)` 等比缩放靠它）。`buildConstellations()` 由 `mags <= 2` 生成 `bright`（发光半径 ×1.15）；`generate()` 星点大小/亮度按星等线性映射（1 等 ≈ r1.9/α0.8，6 等 ≈ r0.7/α0.3），缺 `mags` 按 4.5 等。
6. **星座退场动画**（「重新选择」触发，**入场倒放**）：`resetState(true)` 记下点亮中的星座并置 `_dismissPhase = 1`、`_dismissGlow = 当前 glowLevel`。**阶段 1（逆序回缩）**：入场是"前一条画过 65% 本条才动笔"，退场从最后一条起——后一条收回 65%（`< 0.35 - rand*0.04`）前一条才开始，速度同为 0.055/帧；画法与入场**完全共用**（同一支笔尖光点，`reveal` 归零即不画、不留残影），此阶段星点保持点亮。**阶段 2（辉光收尾）**：`linesRetracted()` 判定连线全部收完后先停 26 帧（~430ms，与入场"等光束到达"对称地拍一下），再令 `_dismissGlow` 归 0 → 星点辉光按入场同速率（0.06 插值）回落，同时 `_dismissFade` 以 0.02/帧（≈0.83s，与入场星点浮现同长）线性落尽亮度，避免最后一帧突兀消失；归零后 `_dismissPhase = 0`。**`glowLevel === 0` 时只要 `_dismissPhase` 非 0 仍必须绘制**（连线与星点两处绘制都要放行）。日夜切换的 `resetState()` 不带参数 → 不触发退场；`doConfirm` 立即清掉目标星座的退场标记，防旧轨与新描画打架。退场时长与入场同长（射手 29 条 ≈5.8s、巨蟹 4 条 ≈0.9s）+ 0.83s 收尾。
7. **日期弧天数**：`_selDays()` 对 2 月动态判断闰年（闰年 29 天，可选中 2/29），勿改回固定平年表。

## 移动端适配

断点：768px（Live2D 隐藏、云层视差跳过、飞鱼禁能、星轨视觉降级、星空降级）、640px（播放器缩小）、480px（星轨细线加粗 + 标签放大）、400px（播放器再缩 + 音量条换行）。安全区：`viewport-fit=cover`、`min-height: 100dvh`、`env(safe-area-inset-bottom)` —— **`100dvh` 必须写在 `100vh` 之后**（同优先级后写者生效，写反了连支持 dvh 的浏览器也拿不到），`body` / `.hero` / `.zodiac-container` 三处都按这个顺序。

## 重要注意事项

- **CONSTELLATIONS 与 ZODIAC 同序**：黄道顺序（白羊 0 → 双鱼 11），`findConstellationIndex` 按中文名映射。星座数据里 `pts / mags` 必须逐点对齐、`lines` 里的下标指向同一份 `pts`（多条折线共用的星已合并为同一节点，改数据时别破坏对齐）。
- **结果面板**：只有 `#orbit-result`（白天/夜间共用），位于 `.tarot-actions` 固定高度容器内，确认/复位切换不抖。
- **确认按钮**：`display:none` 切换后需 `animation='none'` → `void offsetHeight` → `animation=''` 强制回流重启动画；只绑 `click`，防移动端双重触发。
- **确认/重新选择按钮视觉统一**：`.tarot-confirm` 与 `.orbit-redo` 完全同款（金色渐变底 + `#B87A20` 文字 + 暖金边框 + 22px 圆角 + blur 毛玻璃；夜间同为深蓝渐变 + `#E8C268` 亮金文字），`@media (hover:none)` 里的 redo 覆写保持同一配色。改其中一个的样式时另一个必须同步，包括移动端 hover 清理覆写。
- **主题切换清理**：`_clearCanvasEffects` 清庆祝粒子/光束/流星/连线状态及退场标记（`_dismissPhase` / `_dismissGlow` / `_dismissFade`）。
- **星空颜色**：CSS 变量驱动，`lerpTheme` 插值渐变。
- **CSS 兼容**：避免 `:has()`；`backdrop-filter` 有 `@supports` 降级。
- **Twemoji**：`.emoji` 类 `pointer-events: none`；动态 emoji 须手动 `twemoji.parse()`。首次 `parse` 的 `attributes` 回调会加 `loading="lazy"` / `decoding="async"` —— HTTP 下 emoji 走本地 PNG，首屏几十个小图标不再和关键资源抢带宽。
- **滚动浮现兜底**：`.reveal-up` 默认可见，仅当 `initScrollBehavior` 正常注册 IO 时才给 `<html>` 加 `js` 类隐藏（`html.js .reveal-up`）。保持"内容默认可见、JS 参与后才隐藏"的依赖方向，防止脚本异常时标题永久不可见。
- **播放列表移动端滚动**：`scrollToListIndex` 在触屏直接赋值 `scrollTop` 并 return，禁止 rAF 弹簧循环（否则持续写 scrollTop 会与原生触摸滚动打架，列表拖不动）。打开列表时移动端不做定位跳转；`openPlaylist` 必须先加 `.open` 再渲染——折叠态（max-height:0）写 scrollTop 在 iOS 会破坏原生滚动导致列表卡死。`createSlider` 须绑 `touchcancel` 复位 `dragging`，防系统取消触摸后 preventDefault 卡死整页滚动。
- **播放列表移动端点选（2026 修复"点歌时列表抖动、点不准"）**：**选曲只走 `click` 委托，不再绑 `touchend`** —— 触摸端浏览器本来就会为"点选"补发 `click`，滑动/惯性期间不会补发；两处都选会造成同一首歌被加载两次（重复 `scrollToListIndex` + 重新取文件），表现为列表抖动。
  三个动作必须同时成立才算"点选"（`isListGesture()`，触摸端生效）：① 手指位移 ≤ `TAP_SLOP`(6px)；② 从 `touchstart` 到 click 期间 `scrollTop` 变化 ≤ 2px；③ 手指落下前 `TAP_STOP_MS`(120ms) 内列表没有滚动过 —— 惯性未停时点一下屏幕本意是"刹停"，绝不能算点选（阈值按 `touchstart` 时间戳算，不能按 click 到达时间算，触摸端 click 可能滞后 300ms）。
  `touchcancel` 一律按滑动处理（手势被系统接管）。**触摸端点选后不做居中定位**（`selectTrack` 只在非触摸端调用 `scrollToListIndex`）：手指刚离开屏幕就写 `scrollTop` 会和原生惯性滚动互相拉扯。
  列表 `scroll` 事件只记时间戳，全程 `passive`，不接管原生滚动。
- **触摸端不保留 hover 样式**：`@media (hover: none)` 里把 `.playlist-item/.playlist-tab/.playlist-cta` 的 `:hover` 底色与文字色重置回常态 —— 触摸没有真实悬停，点过的行会一直保留"悬停"高亮，看起来像选中了另一首，真正的当前曲目反而被盖住。
- **CSP `media-src` 必须含 `blob:`**：本地音乐用 `URL.createObjectURL` 生成的音频地址属于 `blob:`，缺少该来源时音频被 CSP 静默拦截（仅触发 `error` 事件，无可用报错信息），表现为"本地音乐选了却播不出"。
- **本地音乐的两个 `<input>` 必须分开**：`#local-file-input`（multiple）与 `#local-dir-input`（webkitdirectory）是两个独立节点。同一节点上切换 `webkitdirectory` 属性在 Chromium 不稳定，会出现"打开文件选择器却按目录模式解析"的错乱。
- **播放列表面板高度与标签栏联动**：`.music-playlist.open` 的 `max-height` 按标签栏（约 38px）+ 提示条（约 22px）预留 `64px`
  （`.playlist-tabs` 与 `.playlist-local` 固定在滚动区之上、不滚动）。增删标签栏内容时须同步这个数值与两个媒体查询内的覆写值（≤640px、≤400px），
  否则列表会被压扁或撑破卡片 —— 预留不足的表现是"降级环境（提示条出现）下列表底部与下方分隔线被裁掉"。
- **`.music-playlist` 的左右负外边距必须等于 `.music-player` 的左右内边距**（桌面 `-0.8rem`，≤640px `-0.85rem`，≤400px `-0.75rem`），
  三个断点各自对应，写小了列表两侧会留出缝、与卡片边缘对不齐。
- **访客统计（`initVisitor`）按本地时区换日**：日期键 = `YYYYMMDD` 整数（`getLocalDayKey`），**禁用 UTC 换日**——UTC+8 用户 00:00–07:59 的访问会被归到前一天。
- **光粒子 DPR 上限 2**：`initParticles` 与星空 Canvas 一致，`Math.min(dpr, 2)`。
- **手动日夜模式可恢复**：`_nightManual` 为 true 时，设置面板主题段选「自动」→ `__gyTheme.set('auto')` 置 `_nightManual=false` 并 `update()`（toast「已恢复自动日夜切换」）。`updateHead()` 已删除——社交栏不再有独立日夜按钮，主题切换全部走设置面板。
- **运势 Tab 用 aria-pressed**：`initFortune` / `setFortuneSign` 两处切换时同步（for 循环遍历，勿用 NodeList.forEach——兼容旧浏览器）。
- **mp3 文件名不得含 U+00A0**：`generate_playlist.py` 会警告非断行空格文件；新增曲目先检查。
- **web.config 已启用 CSP**：允许内联脚本/样式 + jsdelivr + v2.xxapi.cn；**不得添加 upgrade-insecure-requests**（源站服务在 HTTP 上，会强制升级子资源导致页面损坏）。HSTS 头仅未来 HTTPS 回源时生效。
- **设置脚本顺序**：`js/settings.js` 必须置于 `main.js` 之前（defer 按序执行），各模块 init 才能读到 `__gySettings` 默认值；面板打开（用户点击）晚于所有 init，可安全调用各 setter。
- **不要用 `overflow: hidden` 锁页面滚动**：给 `html`/`body` 加 `overflow: hidden` 是弹层常用做法，但本站在文档不可滚动的瞬间会把 scrollY 清零（滚到 700 时开面板会跳到 60），用户关掉面板就发现页面位置丢了。需要"面板打开时页面不动"就用事件拦截（见「设置面板」章节），别动布局。
- **脚本驱动页面时别用 `page.click` 判断页面是否跳位**：`page.click` 会先 `scrollIntoViewIfNeeded`，齿轮按钮在页面顶部、页面已下滚时这一步本身就会把页面滚上去，看起来像"打开面板导致跳位"。判断滚动位置要用 `page.evaluate(() => el.click())`。
- **settings.js 时序坑**：defer 脚本执行时 `document.readyState` 已是 `'interactive'`（非 `'loading'`），`settings.js` 的 `initSettings()` 会**立即执行**、早于 `main.js` 的 `init()`。凡在 initSettings 里**立即用到 `window.__gyCreateSlider/__gyMusic/__gyFx/__gyWaifu/__gyTheme` 的绑定必须「在用户交互/首次打开面板时」懒绑定**（如音量条 `bindVolumeSlider()`），否则工厂未定义、绑定被跳过；事件回调（click/change）因执行晚不受影响。
- **星空特效开关**：`_fxStarfield` 与 `_canvasVisible`（夜间才显示）做「与」运算；关闭星空会连流星/引导光束/庆祝粒子一并清空，但保留星座选择器与运势功能。**`spawnCelebrate` 首行必须与 `spawnStarBeam`/`spawnMeteor` 一样判 `_fxStarfield`**，次级爆发的 `_celebrateTimer` 也要在关闭时 `clearTimeout` —— 否则 350ms 后仍会把粒子推进已清空的数组，关掉特效还会看见烟花。
- **看不到活看板娘开/关**：`__gyWaifu.set(true)` 时若 `getLoaded()` 为 false（初始被跳过）需提示刷新生效；live2d-widget 重复 init 有竞态风险，不强行二次初始化。
- **看板娘气泡本地定制（更新 live2d-widget 时须保留）**：
  - `live2d/waifu.css` → `#waifu-tips`：加 `z-index:10` + `bottom:calc(100% - 6px); left:0; right:0; margin:0 auto`，让气泡悬浮在人物头顶正上方、不被 Live2D 人物遮挡。
  - `live2d/waifu-tips.js` → mouseover 委托里注入 `window._waifuLastTip` 500ms 防抖（`if(window._waifuLastTip&&(performance.now()-window._waifuLastTip)<500)return`），避免快速扫过不同 selector 时气泡内容乱跳。此文件是压缩三方库，改动最小化且已备份（`%TEMP%\waifu-tips.backup.js`）。
  - `live2d/autoload.js` → `initLive2D()` 内注册 **window 捕获阶段 mouseover 节流**（`_waifuMouseThrottle`，500ms，`e.stopImmediatePropagation()` 吞掉命中 selector 的快速连续 hover）：**这是 `file://` 下的兜底**——该协议下 waifu-tips.js 因 ES module CORS 回退 CDN，本地注入的防抖不生效，必须靠 autoload.js 的捕获拦截（两种协议都加载）。改节流窗口时两处须同步。
- **`[hidden]` 有全局兜底**：`css/style.css` 开头的 `[hidden] { display: none !important; }` 保证 `hidden` 属性始终生效（作者样式表里的 `display` 会盖掉浏览器默认的 `[hidden]{display:none}`）。控制显隐直接用 `hidden` 属性即可，不必额外加类或内联样式。
- **列表项必须带 `data-index`**：`_localListHtml` / `_builtinListHtml` 渲染时写入，取值与 `tracks` 队列下标同源，`scrollToListIndex()` 靠它做切歌与开列表后的自动居中。漏写会让定位**静默失效** —— `querySelector` 返回 null 后直接 return，不报任何错。
- **静态资源版本号 `?v=`**：`index.html` 中 css / js / 字体 CSS / `playlist.js` 的引用都带 `?v=1.3.0`。**HTML 不缓存而 css/js 缓存 1 天**，发布时改动了这些文件就必须同步递增，否则老访客 24 小时内拿到的是"新页面配旧脚本"。
- **星轨的尺寸参数受 viewBox 缩放约束**：`.trail-day-label` / `.month-label` 的 `font-size` 与 `.trail-arc-hit` 的 `stroke-width` 都写在 SVG 用户坐标里，会随 viewBox（640 宽）等比缩小（375px 屏缩放约 0.54），小屏断点因此把字号设为 18 单位（实际约 9.7px；日期数字间距约 25 单位、月份标签约 46 单位，放得下）。**命中带 72 是上限**：两弧半径差只有 85 单位（`R_DAY 235 − R_MONTH 150`），带宽超过 84 就会互相覆盖，表现为"按下哪条轨都选中同一条"，破坏维度锁定。
- **看板娘层级必须低于播放器**：`#waifu` 为 `z-index: 1 !important`，`.music-player` 为 `2`。看板娘固定占右下 300×300 且不穿透点击，层级更高时会把落在该区域的点击全部吃掉（表现为"播放器 / 播放列表点不动"）。
- **飞鱼保持 `pointer-events: none`**：鱼贴在光标 62px 内、自身对角半径约 73px，参与命中时会偶发盖住光标下的按钮（点一次没反应）。点击涟漪与受惊逃跑走的是 `document` 上的全局 `click` / `mousemove`，与鱼的命中无关，关掉不影响任何交互。
- **`init()` 是隔离调用的**：`main.js` 末尾把各 init 收进 `steps` 数组逐个 `try/catch`，单个模块初始化抛错不再连带禁用后面的模块。**新增 init 函数必须加进 `steps` 数组**，否则不会被调用。
- **播放列表的滚轮接管绑在 `.music-playlist` 上**（不是 `.playlist-inner`），整页接管的 `skip` 也按 `.music-playlist, .settings-body` 放行 —— 标签栏、提示条、分隔线上的滚轮同样要滚列表，否则会冒泡给整页、把页面滚走。
- **随机模式的历史栈只在索引有效时入栈**：切到另一个列表后 `currentIndex` 为 `-1`，压栈会让「上一首」弹出无效索引（没声音还弹空提示）。`playPrev` 会跳过失效索引；列表循环模式下 `-1` 回退到列表末尾，而不是 `(-1-1+N)%N` 算出的倒数第二首。
- **`web.config` 屏蔽了敏感路径**：`requestFiltering/hiddenSegments` 拦 `.git`、`release`、`memory.md`、`README.md`、`generate_playlist.py`（返回 403.8），即使把项目目录整体拷到站点根也不会泄露源码历史与构建产物。新增同类文件时按 `remove` + `add` 的幂等写法加进 `hiddenSegments`。
- **`avatar-ring` 的呼吸光晕分两层**：基础光晕常驻在 `.avatar-ring` 上，呼吸增强层是 `.avatar-ring::after` 的 `opacity` 动画（`ring-glow`），`ring-breathe` 只负责 `transform: scale`。**不要再把 `box-shadow` 写回 keyframes** —— 那会让整个头像环每帧重绘阴影。
