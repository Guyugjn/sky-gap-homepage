/* ============================================
   GY · 天空之隙
   光粒子 · 飞鱼自主飞行 · 音乐播放器
   ============================================ */

(function () {
  'use strict';

  // ==================== 配置 ====================

  const CONFIG = {
    music: {
      dir: 'assets/music/',    // 音乐目录
      startVolume: 0.20,       // 初始音量
      fadeInMs: 2000,          // 淡入时长（毫秒）
      errorMaxCount: 3,        // 连续错误最大次数
      seekStep: 5,             // 键盘快进/快退步进（秒），左右方向键
      seekStepFast: 10,        // 键盘大步进（秒），上下方向键
    },
    particles: {
      count: 55,               // 粒子数量
      minSize: 1.8,            // 最小半径
      maxSize: 4.5,            // 最大半径
      minSpeed: 0.15,          // 最小上升速度
      maxSpeed: 0.55,          // 最大上升速度
      minOpacity: 0.15,        // 最小透明度
      maxOpacity: 0.6,         // 最大透明度
      colors: [
        '255, 255, 255',       // 白
        '255, 250, 240',       // 暖白（花白）
        '240, 248, 255',       // 爱丽丝蓝
        '255, 245, 238',       // 贝壳色
      ],
    },
    fish: {
      speed: 2.5,              // 恒定速度（px/帧）
      idleTimeout: 4000,       // 鼠标静止后飞走延迟（ms）
      minCursorDist: 70,       // 与光标最小距离（px）
      inertIa: 0.08,           // 惯性系数
      scareRange: 100,         // 受惊范围（px）
      scareSpeed: 22,          // 受惊弹飞速度（px/帧）
      scareDurationMin: 3000,  // 受惊恢复最短时间（ms）
      scareDurationRand: 2000, // 受惊恢复随机增量（ms）
    },
    playlist: {
      friction: 0.92,          // 惯性摩擦系数
      wheelGain: 0.18,         // 滚轮 delta → 速度转换
      maxSpeed: 10,            // 单帧最大位移（px）
      maxSpeedChange: 1.8,     // 单次滚轮速度增量上限
      springTension: 0.20,     // 弹性定位劲度
      wheelSmoothAlpha: 0.55,  // 滚轮平滑系数（EWMA α）
    },
    loadBar: {
      timeout: 8000,           // 超时强制完成（ms）
    },
  };

  // ==================== 设备检测 ====================
  var isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  // 移动断点统一判定 — 实时查询 matchMedia，避免各处快照不一致
  var _mobileMQ = window.matchMedia('(max-width: 768px)');
  function isMobileViewport() { return _mobileMQ.matches; }

  // ==================== 共享工具 ====================

  /** ease-out cubic 缓动函数，用于音量淡入淡出等非 CSS 动画 */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ==================== 页面可见性 — 切标签页时暂停 rAF 循环 ====================

  var _pageVisible = true;
  document.addEventListener('visibilitychange', function () {
    _pageVisible = !document.hidden;
  });

  // ==================== 全局 rAF 调度 — 统一帧循环 ====================
  // 所有子系统（光粒子、飞鱼、星空）注册到同一个 rAF，统一节拍 + 省 GPU

  var _tickers = [];

  /** 注册 tick 回调 — 每帧调用 cb(timestamp) */
  window._registerTick = function (cb) {
    _tickers.push(cb);
  };

  function _globalLoop(ts) {
    if (_pageVisible) {
      for (var _ti = 0; _ti < _tickers.length; _ti++) {
        // 单个子系统异常不得冻结整站动画循环
        try {
          _tickers[_ti](ts);
        } catch (_err) {
          console.error('[ticker #' + _ti + ']', _err);
        }
      }
    }
    requestAnimationFrame(_globalLoop);
  }
  _globalLoop(0);

  // ==================== 全局设置接口 — 供设置面板（js/settings.js）调度 ====================
  // 各子系统通过 register 注册自己的特效开关 handler；settings.js 统一调 set(name, on) 触发。
  // 主题 setter 由 initNightMode 挂到 window.__gyTheme.set；音乐 setter 挂在 window.__gyMusic。
  window.__gyFx = {
    _registry: {},
    register: function (name, fn) { this._registry[name] = fn; },
    set: function (name, on) {
      var h = this._registry[name];
      if (h) h(!!on);
    }
  };
  window.__gyTheme = {};
  window.__gyMusic = {};

  /** 安全读取 gy_settings 中某分区布尔值（localStorage 禁用/缺省时返回 dflt） */
  function _settingsBool(section, key, dflt) {
    try {
      if (window.__gySettings) {
        var s = window.__gySettings.get();
        if (s && s[section] && typeof s[section][key] === 'boolean') return s[section][key];
      }
    } catch (e) {}
    return dflt;
  }

  // ==================== DOM 引用 ====================

  const canvas = document.getElementById('particles-canvas');
  const cursorFish = document.getElementById('cursor-fish');
  const musicPlayer = document.getElementById('music-player');
  const musicBtn = document.getElementById('music-btn');
  const musicLabel = document.getElementById('music-label');
  const modeBtn = document.getElementById('mode-btn');
  const modeTip = document.getElementById('mode-tip');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const volumeBtn = document.getElementById('volume-btn');
  const volumeBar = document.getElementById('volume-bar');
  const volumeFill = document.getElementById('volume-fill');
  const volumeIcon = document.getElementById('volume-icon');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const volumePct = document.getElementById('volume-pct');

  // ==================== 状态 ====================

  let mouseX = Math.random() * window.innerWidth;
  let mouseY = Math.random() * window.innerHeight;
  let targetMouseX = mouseX;
  let targetMouseY = mouseY;
  let fishAngle = (Math.random() - 0.5) * 20; // 初始接近水平，±10°

  // 鱼自主飞行状态
  let lastMouseActivity = 0;
  let wanderPhase = Math.random() * Math.PI * 2;
  let attractBlend = 0; // 0=漫游, 1=追逐光标
  let fishVelX = 0;     // 飞鱼当前速度（带惯性）
  let fishVelY = 0;
  let audio = null;
  let isPlaying = false;
  let currentIndex = 0;       // 当前播放索引
  let playMode = 2;           // 0=列表循环 1=单曲循环 2=随机（默认随机）

  // ==================== 共享 toast 队列 ====================

  var _toastQueue = [];
  var _toastShowing = false;
  var _toastTimer = null;

  function showToast(msg, duration) {
    _toastQueue.push({ msg: msg, duration: duration || 1800 });
    if (!_toastShowing) _processToastQueue();
  }

  function _processToastQueue() {
    if (_toastQueue.length === 0) { _toastShowing = false; return; }
    _toastShowing = true;
    var item = _toastQueue.shift();
    var toast = document.getElementById('toast');
    if (!toast) { _toastShowing = false; return; }
    toast.textContent = item.msg;
    /* Twemoji 重新解析 — 动态 emoji 跨平台统一渲染 */
    if (window.twemoji) window.twemoji.parse(toast);
    clearTimeout(_toastTimer);
    toast.classList.remove('show');
    /* 用 rAF 代替 void offsetWidth 强制回流，避免同步布局计算 */
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });
    _toastTimer = setTimeout(function () {
      toast.classList.remove('show');
      /* 等 CSS 过渡完成（0.35s opacity + 0.45s transform）后再播下一条 */
      setTimeout(_processToastQueue, 500);
    }, item.duration);
  }

  function copyText(text, onSuccess) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(function () {
        fallbackCopyText(text, onSuccess);
      });
    } else {
      fallbackCopyText(text, onSuccess);
    }
  }

  function fallbackCopyText(text, onSuccess) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); onSuccess(); } catch (e) {}
    document.body.removeChild(textarea);
  }

  // ==================== 通用滑块工厂（重构进度条和音量条的拖拽逻辑） ====================

  function createSlider(container, onChange, onKey) {
    var dragging = false;

    function getPct(e) {
      var rect = container.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      return Math.max(0, Math.min(1, x / rect.width));
    }

    function onDown(e) {
      e.preventDefault();
      dragging = true;
      onChange(getPct(e), true);
    }

    function onMove(e) {
      if (dragging) {
        e.preventDefault();
        onChange(getPct(e), true);
      }
    }

    function onUp() {
      if (dragging) { dragging = false; onChange(-1, false); }
    }

    // 键盘操作：role="slider" 承诺可键盘调节（±步进 / Home 首 / End 尾）
    function onKeyDown(e) {
      if (!onKey) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].indexOf(e.key) === -1) return;
      e.preventDefault();
      onKey(e.key);
    }

    container.addEventListener('mousedown', onDown);
    container.addEventListener('touchstart', onDown, { passive: false });
    container.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    // 触摸被系统取消（如滚动接管/来电）时也必须复位 dragging，
    // 否则持续 preventDefault 所有 touchmove 会卡死整页（含播放列表）的滚动
    document.addEventListener('touchcancel', onUp);

    return {
      destroy: function () {
        container.removeEventListener('mousedown', onDown);
        container.removeEventListener('touchstart', onDown);
        container.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchend', onUp);
        document.removeEventListener('touchcancel', onUp);
      }
    };
  }

  // 暴露滑块工厂给设置面板（js/settings.js）复用 — 与音乐播放器音量条同款拖拽/键盘逻辑
  window.__gyCreateSlider = createSlider;

  // ==================== 1. 光粒子系统 ====================

  function initParticles() {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    // 特效开关：关闭时清屏并停止绘制（省 GPU）
    var _fxParticles = _settingsBool('effects', 'particles', true);

    function resize() {
      // DPR 缩放：canvas 物理像素 = CSS 像素 × devicePixelRatio，高分屏不再模糊
      // 上限 2（与星空 canvas 一致）：3x 屏用 2x，粒子为小光点，视觉无差，省 2.25 倍填充率
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      // 绘制坐标仍使用 CSS 像素，统一坐标空间
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    // 防抖：窗口拖拽会连续触发 resize（每秒数十次），200ms 内合并为一次重建
    var _particleResizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(_particleResizeTimer);
      _particleResizeTimer = setTimeout(function () {
        resize();
        // 重新生成粒子以适应新尺寸
        particles = createParticles();
      }, 200);
    });

    // 预烘焙粒子光晕 sprite — 每粒子创建一次，运行时 drawImage 替代每帧 shadowBlur 高斯模糊
    // 视觉等价：原效果为 fill alpha + 光晕 shadow alpha×0.6，烘焙 sprite 后经 globalAlpha 统一缩放，合成逐像素一致
    function makeSprite(r, color) {
      // 光晕影响半径 ≈ r + shadowBlur(r×5)，取 10r 覆盖完整光晕（外圈几乎不可见，裁剪无视觉差）
      var size = Math.max(8, Math.ceil(r * 20));
      var sc = document.createElement('canvas');
      sc.width = size;
      sc.height = size;
      var g = sc.getContext('2d');
      var half = size / 2;
      g.shadowBlur = r * 5;
      g.shadowColor = 'rgba(' + color + ', 0.6)';
      g.beginPath();
      g.arc(half, half, r, 0, Math.PI * 2);
      g.fillStyle = 'rgba(' + color + ', 1)';
      g.fill();
      return { canvas: sc, half: half };
    }

    // 创建一个粒子
    function createParticle() {
      const colors = CONFIG.particles.colors;
      var r = CONFIG.particles.minSize + Math.random() * (CONFIG.particles.maxSize - CONFIG.particles.minSize);
      var color = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: r,
        speed: CONFIG.particles.minSpeed + Math.random() * (CONFIG.particles.maxSpeed - CONFIG.particles.minSpeed),
        opacity: CONFIG.particles.minOpacity + Math.random() * (CONFIG.particles.maxOpacity - CONFIG.particles.minOpacity),
        color: color,
        // 水平漂移
        drift: (Math.random() - 0.5) * 0.3,
        // 闪烁相位
        phase: Math.random() * Math.PI * 2,
        // 闪烁速度
        flickerSpeed: 0.005 + Math.random() * 0.02,
        sprite: makeSprite(r, color),
      };
    }

    function createParticles() {
      // 移动端（宽度 ≤768px）减半粒子数，节省 GPU 填充率
      var count = isMobileViewport()
        ? Math.floor(CONFIG.particles.count * 0.5)
        : CONFIG.particles.count;
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push(createParticle());
      }
      return arr;
    }

    var _particleLastTs = null; // 帧率归一化基准

    function draw(time) {
      // 帧间隔折算 — 高刷屏(120/144Hz)速度一致（基准 60Hz）
      if (_particleLastTs === null) _particleLastTs = time;
      var k = Math.min(Math.max(time - _particleLastTs, 0), 50) / 16.667;
      _particleLastTs = time;
      // 特效开关：关闭时清屏并停止绘制（省 GPU）
      if (!_fxParticles) { ctx.clearRect(0, 0, w, h); return; }
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 上升移动
        p.y -= p.speed * k;
        // 水平漂移
        p.x += (p.drift + Math.sin(time * 0.0005 + p.phase) * 0.15) * k;

        // 超出顶部则重置到底部
        if (p.y < -p.r * 2) {
          p.y = h + p.r * 2;
          p.x = Math.random() * w;
        }
        // 水平边界循环
        if (p.x < -p.r * 2) p.x = w + p.r * 2;
        if (p.x > w + p.r * 2) p.x = -p.r * 2;

        // 闪烁透明度
        const flicker = Math.sin(time * p.flickerSpeed + p.phase) * 0.3 + 0.7;
        const alpha = p.opacity * flicker;

        // 绘制预烘焙光晕 sprite（替代每帧 shadowBlur 高斯模糊，视觉等价）
        ctx.globalAlpha = alpha;
        ctx.drawImage(p.sprite.canvas, p.x - p.sprite.half, p.y - p.sprite.half);
      }
      ctx.globalAlpha = 1;
    }

    particles = createParticles();
    window._registerTick(draw);
    window.__gyFx.register('particles', function (on) { _fxParticles = on; });
  }

  // ==================== 2. 飞鱼：自主漫游 + 鼠标吸引 ====================

  function initParallax() {
    if (!cursorFish) return;

    var isMobile = isMobileViewport();

    var pupil = cursorFish.querySelector('.fish-eye-pupil');
    var shine = cursorFish.querySelector('.fish-eye-shine');
    // 特效开关：关闭时隐藏飞鱼并跳过绘制（省 compositor）
    var _fxFish = _settingsBool('effects', 'fish', true);

    var FISH_SPEED = CONFIG.fish.speed;
    var IDLE_TIMEOUT = CONFIG.fish.idleTimeout;
    var MIN_CURSOR_DIST = CONFIG.fish.minCursorDist;

    // 鱼始终可见
    cursorFish.classList.add('visible');

    var fishFlipTarget = -1;  // 目标朝向：-1=朝右，1=朝左
    var fishFlipSmooth = -1;  // 平滑插值后的 scaleX 值

    var scaredUntil = 0;        // 受惊逃跑期间面朝远离光标方向

    var _fishLastTs = null; // 上一帧时间戳 — 帧率归一化基准

    function update(ts) {
      // 特效开关：关闭时隐藏飞鱼并跳过绘制（省 compositor）
      if (!_fxFish) {
        if (cursorFish.style.display !== 'none') cursorFish.style.display = 'none';
        return;
      }
      if (cursorFish.style.display !== '') cursorFish.style.display = '';
      // 帧间隔折算 — 高刷屏(120/144Hz)速度一致（基准 60Hz），后台切回限制步长
      if (_fishLastTs === null) _fishLastTs = ts;
      var k = Math.min(Math.max(ts - _fishLastTs, 0), 50) / 16.667;
      _fishLastTs = ts;
      var now = Date.now();
      var idleMs = lastMouseActivity ? now - lastMouseActivity : Infinity;

      // ==== 吸引强度：0=纯漫游，1=纯追逐 ====
      var targetBlend;
      if (!lastMouseActivity) {
        targetBlend = 0;
      } else if (idleMs < IDLE_TIMEOUT) {
        targetBlend = 1;
      } else {
        targetBlend = Math.max(0, 1 - (idleMs - IDLE_TIMEOUT) / 1500);
      }
      // 受惊逃跑期间立刻切纯漫游，不等衰减
      if (now < scaredUntil) { targetBlend = 0; attractBlend = 0; }
      attractBlend += (targetBlend - attractBlend) * Math.min(1, 0.04 * k);

      // ==== 漫游方向：从左向右，正弦波上下起伏 ====
      wanderPhase += 0.015 * k;
      var verticalWave = Math.sin(wanderPhase * 0.7) * 0.5; // ±~28°
      var wanderDX = Math.cos(verticalWave);  // 单位方向（始终朝右）
      var wanderDY = Math.sin(verticalWave);  // 上下起伏分量

      // ==== 吸引方向：保持 MIN_CURSOR_DIST 距离 ====
      var dx = targetMouseX - mouseX;
      var dy = targetMouseY - mouseY;
      var cursorDist = Math.sqrt(dx * dx + dy * dy);
      var attractDX = 0, attractDY = 0;

      if (cursorDist > 0.5) {
        var udx = dx / cursorDist; // 指向光标的单位向量
        var udy = dy / cursorDist;
        var margin = 8; // 死区容差

        if (cursorDist > MIN_CURSOR_DIST + margin) {
          // 太远 → 靠近光标
          attractDX = udx;
          attractDY = udy;
        } else if (cursorDist < MIN_CURSOR_DIST - margin) {
          // 太近 → 后退
          attractDX = -udx;
          attractDY = -udy;
        }
        // 在死区内：吸引为零，鱼原地漫游
      }

      // ==== 混合方向 + 惯性速度 ====
      var blend = attractBlend;
      var moveX = wanderDX * (1 - blend) + attractDX * blend;
      var moveY = wanderDY * (1 - blend) + attractDY * blend;
      var moveMag = Math.sqrt(moveX * moveX + moveY * moveY);

      // 目标速度：从混合方向计算，惯性平滑过渡
      var INERTIA = CONFIG.fish.inertIa;

      // 距光标较远时加速追赶（1.0x → 1.5x，300px 以上满速）
      var speedMult = 1;
      if (blend > 0.1) {
        speedMult = 1 + Math.min(1, Math.max(0, (cursorDist - MIN_CURSOR_DIST) / 230)) * 0.5;
      }

      var targetVelX = 0, targetVelY = 0;
      if (moveMag > 0.01) {
        targetVelX = (moveX / moveMag) * FISH_SPEED * speedMult;
        targetVelY = (moveY / moveMag) * FISH_SPEED * speedMult;
      }
      fishVelX += (targetVelX - fishVelX) * Math.min(1, INERTIA * k);
      fishVelY += (targetVelY - fishVelY) * Math.min(1, INERTIA * k);
      mouseX += fishVelX * k;
      mouseY += fishVelY * k;

      // ==== 边界处理 ====
      if (mouseX > window.innerWidth + 80) {
        mouseX = -80;
        mouseY = 60 + Math.random() * (window.innerHeight - 120);
      }
      mouseY = Math.max(50, Math.min(window.innerHeight - 50, mouseY));

      // ==== 朝向：追逐时面朝光标，漫游时面朝移动方向 ====
      var faceX, faceY;
      if (blend > 0.3 && cursorDist > 0.5) {
        if (now < scaredUntil) {
          // 受惊逃跑 → 面朝远离光标方向（尾巴对着光标）
          faceX = -dx;
          faceY = -dy;
        } else {
          // 被吸引 → 始终面朝光标
          faceX = dx;
          faceY = dy;
        }
      } else if (moveMag > 0.01) {
        // 漫游 → 面朝移动方向
        faceX = moveX;
        faceY = moveY;
      } else {
        faceX = wanderDX;
        faceY = wanderDY;
      }

      var faceMag = Math.sqrt(faceX * faceX + faceY * faceY);
      if (faceMag > 0.01) {
        var faceDirX = faceX / faceMag;
        var faceDirY = faceY / faceMag;
        // 目标朝向：朝左还是朝右（平滑过渡）
        fishFlipTarget = faceDirX >= 0 ? -1 : 1;

        // 旋转角：rotate(正)=顺时针=头向上，光标在下时需头向下，故取反
        var rawAngle = -Math.atan2(faceDirY, Math.abs(faceDirX)) * 180 / Math.PI;
        var diff = rawAngle - fishAngle;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        fishAngle += diff * Math.min(1, 0.08 * k);
      }

      // ==== 渲染 ====
      // 平滑翻转：避免 scaleX 瞬时跳变
      fishFlipSmooth += (fishFlipTarget - fishFlipSmooth) * Math.min(1, 0.08 * k);
      cursorFish.style.transform =
        'translate3d(' + mouseX + 'px, ' + mouseY + 'px, 0) ' +
        'translate(-42.1%, -51.6%) scaleX(' + fishFlipSmooth.toFixed(3) + ') rotate(' + fishAngle + 'deg)';

      // ==== 瞳孔追踪（带低通滤波，防止抖动） ====
      if (pupil) {
        if (blend > 0.3 && cursorDist > 10) {
          // 追逐模式：眼窝内追踪光标
          var gazeRaw = Math.atan2(dy, dx) * 180 / Math.PI;
          if (gazeRaw > 90) gazeRaw -= 180;
          if (gazeRaw < -90) gazeRaw += 180;
          var eyeError = gazeRaw - fishAngle;
          if (eyeError > 180) eyeError -= 360;
          if (eyeError < -180) eyeError += 360;
          var clamped = Math.max(-35, Math.min(35, eyeError));
          // scaleX 会反转水平方向，用 fishFlip 补偿
          var rawShiftX = (clamped / 35) * 1.6 * (fishFlipSmooth > 0 ? 1 : -1);
          var rawShiftY = (clamped / 35) * 0.9;
          // 低通滤波：每帧向目标值插值 30%，抑制微小抖动；值未变时跳过 DOM 写入
          if (pupil._smoothX == null) { pupil._smoothX = rawShiftX; pupil._smoothY = rawShiftY; }
          pupil._smoothX += (rawShiftX - pupil._smoothX) * Math.min(1, 0.30 * k);
          pupil._smoothY += (rawShiftY - pupil._smoothY) * Math.min(1, 0.30 * k);
          var pupX = (22 + pupil._smoothX).toFixed(2);
          var pupY = (29 + pupil._smoothY).toFixed(2);
          if (pupil._lastAttrX !== pupX) { pupil.setAttribute('cx', pupX); pupil._lastAttrX = pupX; }
          if (pupil._lastAttrY !== pupY) { pupil.setAttribute('cy', pupY); pupil._lastAttrY = pupY; }
          if (shine) {
            var shX = (21 + pupil._smoothX * 0.65).toFixed(2);
            var shY = (28 + pupil._smoothY * 0.65).toFixed(2);
            if (shine._lastAttrX !== shX) { shine.setAttribute('cx', shX); shine._lastAttrX = shX; }
            if (shine._lastAttrY !== shY) { shine.setAttribute('cy', shY); shine._lastAttrY = shY; }
          }
        } else {
          // 漫游模式：瞳孔归中
          pupil._smoothX = null; pupil._smoothY = null;
          if (pupil._lastAttrX !== '22') { pupil.setAttribute('cx', '22'); pupil._lastAttrX = '22'; }
          if (pupil._lastAttrY !== '29') { pupil.setAttribute('cy', '29'); pupil._lastAttrY = '29'; }
          if (shine) {
            if (shine._lastAttrX !== '21') { shine.setAttribute('cx', '21'); shine._lastAttrX = '21'; }
            if (shine._lastAttrY !== '28') { shine.setAttribute('cy', '28'); shine._lastAttrY = '28'; }
          }
        }
      }
    }

    // 点击任意位置 → 涟漪 + 鱼在范围内则逃跑（移动端无交互）
    var FISH_SCARE_RANGE = CONFIG.fish.scareRange;
    document.addEventListener('click', function (e) {
      if (isMobile) return;
      // 涟漪
      var ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.left = (e.clientX - 40) + 'px';
      ripple.style.top  = (e.clientY - 40) + 'px';
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', function () { ripple.remove(); });

      // 鱼在范围内 → 弹飞（关闭飞鱼特效时保留全局点击涟漪，但跳过逃跑）
      if (!_fxFish) return;
      var dx = mouseX - e.clientX;
      var dy = mouseY - e.clientY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < FISH_SCARE_RANGE) {
        // 立刻反向弹飞
        var awayX = dx / (dist || 1);
        var awayY = dy / (dist || 1);
        fishVelX = awayX * CONFIG.fish.scareSpeed;
        fishVelY = awayY * CONFIG.fish.scareSpeed;
        // 瞬间翻转面朝远离方向
        fishFlipTarget = awayX >= 0 ? -1 : 1;
        fishFlipSmooth = fishFlipTarget;
        // 3~5 秒后恢复正常
        scaredUntil = Date.now() + CONFIG.fish.scareDurationMin + Math.random() * CONFIG.fish.scareDurationRand;
      }
    });

    // 鼠标移动 → 记录活跃时间 + 更新目标位置（移动端跳过，只做自主漫游）
    document.addEventListener('mousemove', function (e) {
      if (isMobile) return;
      if (!_fxFish) return;
      lastMouseActivity = Date.now();
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    });

    window._registerTick(update);
    window.__gyFx.register('fish', function (on) {
      _fxFish = on;
      if (cursorFish) cursorFish.style.display = on ? '' : 'none';
    });
  }

  // ==================== 3. 音乐播放器 ====================

  function initMusic() {
    if (!musicBtn || !musicPlayer) return;

    // 从 playlist.js（<script> 标签加载）读取曲目列表
    var playlist = window.__PLAYLIST__ || [];
    var totalTracks = playlist.length;

    // 从设置恢复播放模式（0=列表循环 1=单曲 2=随机，默认随机）
    try {
      if (window.__gySettings) {
        var _m = window.__gySettings.get().music.mode;
        if (_m === 0 || _m === 1 || _m === 2) playMode = _m;
      }
    } catch (_err) {}

    // 安全读取 localStorage：禁用存储（隐私模式/企业策略）时返回 null，避免中断 init 链
    function safeGet(key) {
      try { return localStorage.getItem(key); } catch (_err) { return null; }
    }

    // 读取上次保存的音量（localStorage），若无则用默认值
    var savedVol = parseFloat(safeGet('gy_volume'));
    var volume = (savedVol >= 0 && savedVol <= 1) ? savedVol : CONFIG.music.startVolume;
    // 读取静音状态（localStorage）——静音态时 gy_volume 保存的是静音前的真实音量
    var _isMuted = safeGet('gy_muted') === '1';
    var _volumeBeforeMute = volume;
    if (_isMuted) volume = 0; // 恢复静音态：当前音量归零，真实音量保留在 _volumeBeforeMute
    var started = false; // 是否已完成首次加载

    // === 创建 audio ===
    audio = new Audio();
    audio.volume = 0;
    audio.preload = 'auto';
    /* 移动端兼容：iOS Safari 必须设置 playsinline，否则 play() 会静默拒绝 */
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');

    // 预加载用的隐藏音频元素，提前下载下一首
    var preloadAudio = new Audio();
    preloadAudio.preload = 'auto';
    preloadAudio.volume = 0;
    preloadAudio.muted = true; // 静音预加载，避免意外出声
    var preloadDone = false;   // 本轮是否已完成预加载，避免 progress 事件重复触发

    // 预加载失败（网络/404）时重置状态并清空 src，下次切歌可重新预载，坏 src 不挂起
    preloadAudio.addEventListener('error', function () {
      preloadDone = false;
      preloadAudio.src = '';
    });

    function preloadNextTrack() {
      if (!totalTracks || totalTracks <= 1) return;
      if (playMode === 1) return;           // 单曲循环：不需要预加载
      var nextIdx;
      if (playMode === 0) {
        nextIdx = (currentIndex + 1) % totalTracks;  // 列表循环：下一首
      } else {
        nextIdx = randomIndex();            // 随机：预载一首
      }
      // 先清空再赋值：取消旧预加载请求，避免多首 mp3 并行下载抢带宽
      preloadAudio.src = '';
      preloadAudio.src = CONFIG.music.dir + encodeURIComponent(playlist[nextIdx]);
      preloadDone = true;
    }

    // 智能预加载：等当前曲目缓冲足够后才开始下载下一首
    // 避免慢网速下两首 mp3（各 2-8MB）同时下载互相抢带宽导致卡顿
    audio.addEventListener('progress', function () {
      if (preloadDone || !isPlaying || !audio.duration) return;
      if (audio.buffered.length === 0) return;
      var bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
      // 缓冲超过 30 秒或超过 40% → 当前曲目已经稳定，可以放心预加载
      if (bufferedEnd > 30 || bufferedEnd / audio.duration > 0.4) {
        preloadNextTrack();
      }
    });

    // 拖动进度条后重新评估缓冲状态
    audio.addEventListener('seeking', function () { preloadDone = false; });

    // === 工具函数 ===

    // 从文件名获取显示曲名（去掉 .mp3 后缀）
    function getDisplayName(index) {
      var filename = playlist[index] || '';
      return filename.replace(/\.mp3$/i, '');
    }

    // HTML 转义：文件名拼接进 innerHTML 前转义，防止特殊字符破坏 DOM 结构
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }

    function updateLabel(index) {
      if (!musicLabel) return;
      var name = getDisplayName(index);
      musicLabel.textContent = name;
      musicLabel.title = name;
      musicLabel.style.display = 'block';
      musicLabel.classList.remove('loading');
      musicLabel.classList.add('playing');
      // 同步更新播放列表高亮
      if (listInner) {
        var items = listInner.querySelectorAll('.playlist-item');
        for (var k = 0; k < items.length; k++) {
          items[k].classList.toggle('current', parseInt(items[k].dataset.index, 10) === index);
        }
      }
    }

    // 曲名位置显示加载状态
    function showLoadingLabel(msg) {
      if (!musicLabel) return;
      musicLabel.textContent = msg || '加载中…';
      musicLabel.title = '';
      musicLabel.style.display = 'block';
      musicLabel.classList.add('loading');
      musicLabel.classList.remove('playing');
    }

    function loadTrack(index) {
      currentIndex = index;
      var src = CONFIG.music.dir + encodeURIComponent(playlist[index]);
      audio.src = src;            // 赋值 src 会自动触发 loadstart 事件，事件中已调用 showLoadingLabel()
      preloadDone = false;       // 新曲目重置，等缓冲够了再预加载
      started = true;
      // 曲名气泡提示仅在播放后显示
      if (musicLabel && musicLabel.parentElement) {
        musicLabel.parentElement.classList.add('show-tip');
      }
    }

    // 随机选曲
    function randomIndex() {
      if (totalTracks <= 1) return 0;
      var idx;
      do {
        idx = Math.floor(Math.random() * totalTracks);
      } while (idx === currentIndex);
      return idx;
    }

    var fadeAnimId = null; // 当前淡入/淡出动画 ID
    var _playToken = 0;    // 播放请求令牌 — 快速播放/暂停时旧 promise 回调不得覆盖新状态

    function play() {
      // 取消正在进行的淡出（如果快速切换）
      if (fadeAnimId) { cancelAnimationFrame(fadeAnimId); fadeAnimId = null; }
      var token = ++_playToken;
      audio.play().then(function () {
        if (token !== _playToken) return; // 已被暂停/新播放请求抢占
        musicBtn.classList.add('playing');
        isPlaying = true;
        fadeInVolume();
        preloadDone = false; // 等缓冲够了再自动预加载下一首
      }).catch(function (err) {
        if (token !== _playToken) return; // 被抢占的失败不提示
        console.warn('播放失败：', err.message);
        updateLabel(currentIndex); // 清除"加载中…"状态
        showToast('⚠️ 播放失败，请检查网络或点击重试', 2500);
      });
    }

    function pause() {
      _playToken++; // 使未决的播放 promise 失效
      // 立即暂停 + 更新 UI，淡出仅做音量平滑收尾（不阻塞响应）
      audio.pause();
      musicBtn.classList.remove('playing');
      isPlaying = false;
      // 取消正在进行的淡入
      if (fadeAnimId) { cancelAnimationFrame(fadeAnimId); fadeAnimId = null; }
    }

    function fadeInVolume() {
      if (fadeAnimId) cancelAnimationFrame(fadeAnimId);
      // 从当前音量开始淡入，避免暂停→恢复时音量骤降至 0 再爬升
      var startVol = audio.volume;
      var startTime = performance.now();
      function step(now) {
        var elapsed = now - startTime;
        if (elapsed < 0) elapsed = 0;
        var progress = Math.min(elapsed / CONFIG.music.fadeInMs, 1);
        // 从 startVol 开始逐渐过渡到目标 volume
        var val = startVol + (volume - startVol) * easeOutCubic(progress);
        if (val < 0) val = 0;
        audio.volume = val;
        if (progress < 1) {
          fadeAnimId = requestAnimationFrame(step);
        } else {
          fadeAnimId = null;
        }
      }
      fadeAnimId = requestAnimationFrame(step);
    }

    var playHistory = []; // 随机模式播放历史栈，支持"上一首"回到真正听过的曲目
    var MAX_HISTORY = 100; // 历史栈上限，防止无限增长

    // === 切歌逻辑 ===

    function playPrev() {
      if (!totalTracks) { showToast('⚠️ 播放列表为空', 1500); return; }
      if (playMode === 2) {
        // 随机模式：从历史栈弹出上一首真正播放过的曲目
        if (playHistory.length === 0) {
          showToast('没有更早的播放记录了', 1500);
          return;
        }
        currentIndex = playHistory.pop();
      } else {
        currentIndex = (currentIndex - 1 + totalTracks) % totalTracks;
      }
      loadTrack(currentIndex);
      play();
      notifySongChange();
      if (listOpen) scrollToListIndex(currentIndex);
    }

    function playNext() {
      if (!totalTracks) { showToast('⚠️ 播放列表为空', 1500); return; }
      if (playMode === 1) {
        // 单曲循环
        audio.currentTime = 0;
        play();
        if (listOpen) scrollToListIndex(currentIndex);
        return;
      }
      if (playMode === 2) {
        // 随机：记录当前曲目到历史，再随机选下一首
        if (playHistory.length >= MAX_HISTORY) playHistory.shift();
        playHistory.push(currentIndex);
        currentIndex = randomIndex();
      } else {
        // 列表循环
        currentIndex = (currentIndex + 1) % totalTracks;
      }
      loadTrack(currentIndex);
      play();
      notifySongChange();
      if (listOpen) scrollToListIndex(currentIndex);
    }

    // === 加载状态 — 曲名位置显示加载中/缓冲中 ===
    audio.addEventListener('loadstart', function () {
      showLoadingLabel();
    });

    audio.addEventListener('canplay', function () {
      updateLabel(currentIndex);
    });

    audio.addEventListener('waiting', function () {
      // 播放过程中缓冲不足时显示（拖拽进度条时跳过，避免闪烁"缓冲中…"）
      if (isPlaying && !progressSeeking) showLoadingLabel('缓冲中…');
    });

    audio.addEventListener('playing', function () {
      _audioErrorCount = 0;
      updateLabel(currentIndex);
    });

    // === 播放结束 ===
    audio.addEventListener('ended', playNext);

    // === 播放错误 → 自动跳过（连续失败 3 次后停止提示） ===
    var _audioErrorCount = 0;
    audio.addEventListener('error', function () {
      console.warn('音频加载错误：', audio.error ? audio.error.message : '未知错误');
      if (!started) { updateLabel(currentIndex); return; }
      // 已开始播放的曲目出错 → 计数检查
      if (++_audioErrorCount >= CONFIG.music.errorMaxCount) {
        showToast('⚠️ 多首曲目加载失败，请检查网络', 3000);
        pause();
        _audioErrorCount = 0;
        return;
      }
      showToast('⏭ 已跳过 · 下一首', 2000);
      // 等 toast 显示一会儿再切，避免连续快速切换
      setTimeout(function () {
        if (isPlaying) playNext();
      }, 300);
    });

    // === 时间格式化 ===
    function formatTime(sec) {
      if (!isFinite(sec) || sec < 0) return '0:00';
      var m = Math.floor(sec / 60);
      var s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // === 进度条 + 时间更新 ===
    audio.addEventListener('loadedmetadata', function () {
      if (timeTotal) timeTotal.textContent = formatTime(audio.duration);
    });

    var progressSeeking = false; // 用户拖拽中暂停 timeupdate 回写

    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return;
      if (!progressSeeking) {
        var pct = (audio.currentTime / audio.duration) * 100;
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressBar) progressBar.setAttribute('aria-valuenow', Math.round(pct));
      }
      if (timeCurrent) timeCurrent.textContent = formatTime(audio.currentTime);
    });

    // === 进度条点击/拖拽跳转 ===
    if (progressBar) {
      createSlider(progressBar, function (pct, isDown) {
        if (!audio.duration) return;
        if (pct < 0) {
          if (!isDown) progressSeeking = false;
          return;
        }
        progressSeeking = true;
        audio.currentTime = pct * audio.duration;
        progressFill.style.width = (pct * 100) + '%';
        if (!isDown) progressSeeking = false;
      }, function (key) {
        // 键盘跳转：左右 ±seekStep，上下 ±seekStepFast，Home/End 首尾；timeupdate 会回写进度条与 aria
        if (!audio.duration) return;
        var d = audio.duration;
        var step = CONFIG.music.seekStep, stepFast = CONFIG.music.seekStepFast;
        if (key === 'ArrowRight') audio.currentTime = Math.min(d, audio.currentTime + step);
        else if (key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - step);
        else if (key === 'ArrowUp') audio.currentTime = Math.min(d, audio.currentTime + stepFast);
        else if (key === 'ArrowDown') audio.currentTime = Math.max(0, audio.currentTime - stepFast);
        else if (key === 'Home') audio.currentTime = 0;
        else if (key === 'End') audio.currentTime = d;
      });

    }

    // === 切歌时弹出曲名提示 ===
    function notifySongChange() {
      showToast('🎵 ' + getDisplayName(currentIndex), 2200);
    }

    // === 播放模式切换 ===
    var modeIcons = {
      0: { cls: 'mode-list',    title: '列表循环', path: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z' },
      1: { cls: 'mode-single',  title: '单曲循环', path: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z' },
      2: { cls: 'mode-shuffle', title: '随机播放', path: 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z' },
    };

    function updateModeUI() {
      var m = modeIcons[playMode];
      modeBtn.className = 'music-btn music-btn--sm ' + m.cls;
      var modePath = document.getElementById('mode-icon-path');
      if (modePath) modePath.setAttribute('d', m.path);
      if (modeTip) modeTip.textContent = m.title;
    }

    modeBtn.addEventListener('click', function () {
      playMode = (playMode + 1) % 3;
      playHistory = []; // 切换模式时清空随机历史
      updateModeUI();
      // 模式切换后重置预加载标记，让 progress 事件按新模式重新触发
      if (isPlaying) { preloadDone = false; preloadAudio.src = ''; }
      // 持久化到设置（供刷新后恢复）
      try { if (window.__gySettings) window.__gySettings.save({ music: { mode: playMode } }); } catch (_err) {}
    });

    // === 点击曲名复制曲名 ===
    if (musicLabel) {
      musicLabel.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!started) return;
        copyText(getDisplayName(currentIndex), function () {
          showToast('📋 曲名已复制');
        });
      });
    }

    // === 播放列表下拉面板 ===
    var listBtn = document.getElementById('music-list-btn');
    var playlistEl = document.getElementById('music-playlist');
    var listInner = document.getElementById('playlist-inner');
    var listOpen = false;

    // 播放列表渲染缓存 — 避免每次打开重建 DOM
    var _playlistRendered = false;

    function selectTrack(idx) {
      if (idx === currentIndex && started) return;
      if (playMode === 2 && started) {
        if (playHistory.length >= MAX_HISTORY) playHistory.shift();
        playHistory.push(currentIndex);
      }
      loadTrack(idx);
      play();
      notifySongChange();
      scrollToListIndex(idx);
    }

    // 触摸防误触状态（事件委托共享）
    var _touchState = null;

    function renderPlaylist() {
      if (!listInner) return;

      if (!totalTracks) {
        if (!_playlistRendered) {
          listInner.innerHTML = '<span class="playlist-empty">🎵 歌单为空，请添加音乐文件</span>';
          if (window.twemoji) window.twemoji.parse(listInner);
          _playlistRendered = true;
        }
        return;
      }

      if (!_playlistRendered) {
        // 首次渲染：创建 DOM + 绑定事件委托
        var html = '';
        for (var i = 0; i < totalTracks; i++) {
          var isCurrent = (i === currentIndex && started);
          var cls = isCurrent ? ' class="playlist-item current"' : ' class="playlist-item"';
          html += '<span' + cls + ' data-index="' + i + '">' +
                  '<span class="pl-index">' + (i + 1) + '</span>' +
                  '<span class="pl-name">' + escapeHtml(getDisplayName(i)) + '</span>' +
                  '</span>';
        }
        listInner.innerHTML = html;

        // 事件委托：click（桌面端）
        listInner.addEventListener('click', function (e) {
          var item = e.target.closest('.playlist-item');
          if (!item) return;
          selectTrack(parseInt(item.dataset.index, 10));
        });

        // 事件委托：触摸防误触
        listInner.addEventListener('touchstart', function (e) {
          _touchState = { y: e.touches[0].clientY, moved: false };
        }, { passive: true });

        listInner.addEventListener('touchmove', function (e) {
          if (_touchState && Math.abs(e.touches[0].clientY - _touchState.y) > 10) {
            _touchState.moved = true;
          }
        }, { passive: true });

        listInner.addEventListener('touchend', function (e) {
          if (!_touchState || _touchState.moved) { _touchState = null; return; }
          var item = e.target.closest('.playlist-item');
          if (!item) { _touchState = null; return; }
          selectTrack(parseInt(item.dataset.index, 10));
          _touchState = null;
        });

        _playlistRendered = true;
      } else {
        // 已渲染过，仅更新高亮
        var items = listInner.querySelectorAll('.playlist-item');
        for (var k = 0; k < items.length; k++) {
          items[k].classList.toggle('current', parseInt(items[k].dataset.index, 10) === currentIndex && started);
        }
      }

      // 移动端打开列表不做定位跳转：列表刚展开由原生滚动接管（从顶部开始即可），
      // 避免折叠态/过渡期写 scrollTop 导致 iOS 列表卡死；切歌/点选时列表已打开会另行定位
      if (started && !isTouchDevice) scrollToListIndex(currentIndex);
    }

    // === 动量滚动系统 ===
    // 滚轮实时改变 velocity，rAF 循环驱动惯性滑行
    var scrollVel = 0;        // 当前速度 (px/frame)
    var scrollRaf = 0;        // 主循环 ID
    var scrollTarget = 0;     // 程序定位的目标（scrollToListIndex 使用）
    var scrollSpring = false; // 是否正在弹性定位
    var wheelActive = 0;      // 最后一帧滚轮输入的时间戳

    // 物理常量（从 CONFIG 读取）
    var FRICTION = CONFIG.playlist.friction;
    var WHEEL_GAIN = CONFIG.playlist.wheelGain;
    var MAX_SPEED = CONFIG.playlist.maxSpeed;
    var MAX_SPEED_CHANGE = CONFIG.playlist.maxSpeedChange;
    var SPRING_TENSION = CONFIG.playlist.springTension;

    // 滚轮平滑滤波 — 用 EWMA 抑制尖峰 delta（如触控板惯性阶段的偶发大值）
    var _wheelSmooth = 0;
    var WHEEL_SMOOTH_ALPHA = CONFIG.playlist.wheelSmoothAlpha;

    function startScrollRaf() {
      if (scrollRaf) return;
      function step() {
        if (!listInner || !listOpen) { scrollRaf = 0; return; }
        var cur = listInner.scrollTop;
        var maxS = listInner.scrollHeight - listInner.clientHeight;
        var now = performance.now();

        if (scrollSpring) {
          // --- 弹性定位模式（scrollToListIndex 驱动）---
          var diff = scrollTarget - cur;
          if (Math.abs(diff) < 0.3) {
            listInner.scrollTop = scrollTarget;
            scrollVel = 0;
            scrollSpring = false;
          } else {
            var next = cur + diff * SPRING_TENSION;
            if (next < 0) next = 0;
            else if (next > maxS) next = maxS;
            if (Math.abs(next - cur) > 0.01) listInner.scrollTop = next;
          }
        } else {
          // --- 滚轮/惯性模式 ---
          if (now - wheelActive >= 80) {
            // 无滚轮输入 → 惯性衰减
            if (Math.abs(scrollVel) > 0.05) {
              scrollVel *= FRICTION;
            } else {
              scrollVel = 0;
            }
          }
          if (Math.abs(scrollVel) > 0.01) {
            var next = cur + scrollVel;
            if (next < 0) { next = 0; scrollVel = 0; }
            else if (next > maxS) { next = maxS; scrollVel = 0; }
            if (Math.abs(next - cur) > 0.01) listInner.scrollTop = next;
          }
        }

        scrollRaf = requestAnimationFrame(step);
      }
      scrollRaf = requestAnimationFrame(step);
    }

    // 列表项索引 → scrollTop 居中定位（弹性动画）
    // 移动端：瞬时跳转定位，避免 rAF 弹簧动画持续写 scrollTop 与原生触摸滚动冲突（导致列表无法滑动）
    function scrollToListIndex(index) {
      if (!listInner) return;
      var item = listInner.querySelector('.playlist-item[data-index="' + index + '"]');
      if (!item) return;
      var maxS = listInner.scrollHeight - listInner.clientHeight;
      var target = item.offsetTop - (listInner.clientHeight - item.offsetHeight) / 2;
      if (target < 0) target = 0;
      if (target > maxS) target = maxS;
      if (isTouchDevice) {
        // 移动端：原生滚动接管，直接跳转定位
        listInner.scrollTop = target;
        scrollVel = 0;
        scrollSpring = false;
        return;
      }
      scrollTarget = target;
      scrollVel = 0;
      scrollSpring = true;
      wheelActive = 0;
      startScrollRaf();
    }

    // 鼠标滚轮接管 — 实时累加速度（带平滑滤波 + 增量限制）
    function onPlaylistWheel(e) {
      if (!listInner) return;
      e.preventDefault();
      var delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 18;
      // EWMA 平滑：新值 = α·当前 + (1-α)·历史，抑制触控板惯性阶段的尖峰
      _wheelSmooth = WHEEL_SMOOTH_ALPHA * delta + (1 - WHEEL_SMOOTH_ALPHA) * _wheelSmooth;
      var gain = _wheelSmooth * WHEEL_GAIN;
      // 限制单次滚轮事件的速度增量，避免快速滚动跳跃感
      if (gain > MAX_SPEED_CHANGE) gain = MAX_SPEED_CHANGE;
      if (gain < -MAX_SPEED_CHANGE) gain = -MAX_SPEED_CHANGE;
      scrollVel += gain;
      if (scrollVel > MAX_SPEED) scrollVel = MAX_SPEED;
      if (scrollVel < -MAX_SPEED) scrollVel = -MAX_SPEED;
      scrollSpring = false;
      wheelActive = performance.now();
      startScrollRaf();
    }

    function openPlaylist() {
      if (!playlistEl || !listInner) return;
      // 先展开面板再渲染定位：避免折叠态（max-height:0）下写 scrollTop，
      // iOS 对裁剪容器写 scrollTop 会破坏原生滚动（播放后 started=true 触发定位时列表卡死）
      playlistEl.classList.add('open');
      listBtn && listBtn.classList.add('open');
      listOpen = true;
      renderPlaylist();

      // 桌面端：启用自定义动量滚动
      if (!isTouchDevice) {
        listInner.addEventListener('wheel', onPlaylistWheel, { passive: false });
      }
      // 移动端：完全交给原生滚动，不做任何拦截

      // 列表只由按钮开关，不监听外部点击关闭
    }

    function closePlaylist() {
      if (!playlistEl) return;
      playlistEl.classList.remove('open');
      listBtn && listBtn.classList.remove('open');
      listOpen = false;

      // 停止动量滚动
      cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
      scrollVel = 0;
      _wheelSmooth = 0;
      scrollSpring = false;

      // 移除事件
      if (listInner) {
        listInner.removeEventListener('wheel', onPlaylistWheel);
      }
    }

    if (listBtn) {
      listBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (listOpen) closePlaylist(); else openPlaylist();
      });
    }

    // === 音量控制 ===
    function updateVolumeUI(vol) {
      var pct = Math.round(vol * 100);
      if (volumeFill) volumeFill.style.width = pct + '%';
      if (volumeBar) volumeBar.setAttribute('aria-valuenow', pct);
      if (volumePct) volumePct.textContent = pct + '%';
      updateVolumeIcon(vol);
    }

    // 统一音量调节入口（键盘快捷键 + 音量条键盘共用），含静音状态同步与持久化
    function adjustVolume(delta) {
      if (_isMuted && delta > 0) _isMuted = false;
      volume = Math.max(0, Math.min(1, volume + delta));
      audio.volume = volume;
      updateVolumeUI(volume);
      try {
        if (volume <= 0.005) {
          // 降到 0 = 静音，记录 0.05 作为一键恢复音量
          _isMuted = true;
          _volumeBeforeMute = 0.05;
          localStorage.setItem('gy_volume', '0.050');
          localStorage.setItem('gy_muted', '1');
        } else {
          localStorage.setItem('gy_volume', volume.toFixed(3));
          localStorage.setItem('gy_muted', '0');
        }
      } catch (e) {}
    }

    // 自定义拖拽（用 createSlider 工厂）
    if (volumeBar) {
      createSlider(volumeBar, function (pct) {
        if (pct < 0) return;
        // 用户主动拖拽 → 取消淡入/淡出动画，避免淡入 step 逐帧回写覆盖拖拽值
        if (fadeAnimId) { cancelAnimationFrame(fadeAnimId); fadeAnimId = null; }
        if (_isMuted && pct > 0.005) {
          // 拖动音量条即视为主动取消静音，同步标志位防止与音频实际状态脱节
          _isMuted = false;
          _volumeBeforeMute = pct;
          try { localStorage.setItem('gy_muted', '0'); } catch (e) {}
        }
        volume = pct;
        audio.volume = volume;
        updateVolumeUI(volume);
        // 持久化音量
        try { localStorage.setItem('gy_volume', pct.toFixed(3)); } catch (e) {}
      }, function (key) {
        // 键盘调音量：复用统一入口（含静音解除/持久化/图标同步）
        if (key === 'ArrowRight' || key === 'ArrowUp') adjustVolume(0.05);
        else if (key === 'ArrowLeft' || key === 'ArrowDown') adjustVolume(-0.05);
        else if (key === 'Home') adjustVolume(-1);   // 降到 0
        else if (key === 'End') adjustVolume(1);     // 升到 100%
      });

    }

    function updateVolumeIcon(vol) {
      if (!volumeIcon) return;
      var path;
      if (vol < 0.005) {
        path = 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z';
      } else if (vol < 0.35) {
        path = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z';
      } else {
        path = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z';
      }
      var volPath = document.getElementById('volume-icon-path');
      if (volPath) volPath.setAttribute('d', path);
    }

    // 音量按钮：点击切换静音/恢复（用 isMuted 标志消除与滑块的同步问题）
    volumeBtn.addEventListener('click', function () {
      if (_isMuted) {
        // 取消静音 — 恢复到静音前的真实音量
        _isMuted = false;
        volume = _volumeBeforeMute || CONFIG.music.startVolume;
        audio.volume = volume;
        updateVolumeUI(volume);
        try {
          localStorage.setItem('gy_volume', volume.toFixed(3));
          localStorage.setItem('gy_muted', '0');
        } catch (e) {}
      } else if (volume > 0.005) {
        // 静音 — 保存当前音量（滑块最新值）作为恢复音量，然后静音
        _isMuted = true;
        _volumeBeforeMute = volume;
        volume = 0;
        audio.volume = 0;
        updateVolumeUI(0);
        try {
          localStorage.setItem('gy_volume', _volumeBeforeMute.toFixed(3));
          localStorage.setItem('gy_muted', '1');
        } catch (e) {}
      } else {
        // 音量已为 0（刷新恢复的静音态或手动降到 0）——点击恢复上次音量
        _isMuted = false;
        volume = _volumeBeforeMute || CONFIG.music.startVolume;
        audio.volume = volume;
        updateVolumeUI(volume);
        try {
          localStorage.setItem('gy_volume', volume.toFixed(3));
          localStorage.setItem('gy_muted', '0');
        } catch (e) {}
      }
    });

    // === 按钮事件 ===
    musicBtn.addEventListener('click', function () {
      if (!started) {
        // 首次加载
        if (!totalTracks) { showToast('⚠️ 播放列表为空，请运行 python generate_playlist.py'); return; }
        loadTrack(randomIndex());
        play();
        notifySongChange();
        return;
      }
      if (isPlaying) pause(); else play();
    });

    prevBtn.addEventListener('click', function () {
      if (!started) return;
      playPrev();
    });

    nextBtn.addEventListener('click', function () {
      if (!started) return;
      playNext();
    });

    // === 初始化 UI ===
    updateModeUI();
    updateVolumeUI(volume);

    // === 键盘快捷键 ===
    document.addEventListener('keydown', function (e) {
      // 长按不放不重复触发（防止空格连续播放/暂停）
      if (e.repeat) return;
      var tag = e.target.tagName;
      // 输入框中不触发
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      // ARIA slider 控件不触发，保留键盘操作给原生功能
      if (e.target.getAttribute('role') === 'slider') return;
      // 焦点在按钮/链接上时不劫持，保留其原生激活（空格/回车）
      if (e.target.closest && e.target.closest('button, a, [role="button"]')) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) pause(); else play();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (started) playPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (started) playNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.05);
          break;
      }
    });

    // === 设置面板接口：播放模式 / 音量（供 js/settings.js 调用） ===
    window.__gyMusic.getMode = function () { return playMode; };
    window.__gyMusic.setMode = function (m) {
      playMode = ((m % 3) + 3) % 3;
      playHistory = [];               // 切模式清空随机历史
      updateModeUI();
      // 模式切换后重置预加载标记，让 progress 事件按新模式重新触发
      if (isPlaying) { preloadDone = false; preloadAudio.src = ''; }
      try { if (window.__gySettings) window.__gySettings.save({ music: { mode: playMode } }); } catch (_err) {}
    };
    window.__gyMusic.getVolume = function () { return volume; };
    window.__gyMusic.setVolume = function (v) {
      v = Math.max(0, Math.min(1, v));
      // 用户设置音量 → 取消淡入/淡出动画，避免逐帧回写覆盖拖拽值
      if (fadeAnimId) { cancelAnimationFrame(fadeAnimId); fadeAnimId = null; }
      if (_isMuted && v > 0.005) {
        // 非零 → 视为主动取消静音
        _isMuted = false;
        _volumeBeforeMute = v;
        try { localStorage.setItem('gy_muted', '0'); } catch (_err) {}
      }
      volume = v;
      audio.volume = volume;
      updateVolumeUI(volume);
      try {
        localStorage.setItem('gy_volume', v.toFixed(3));
        if (v < 0.005) { _isMuted = true; _volumeBeforeMute = 0.05; localStorage.setItem('gy_muted', '1'); }
      } catch (_err) {}
    };
  }

  // ==================== 4. 云层鼠标视差 ====================

  function initCloudParallax() {
    var cloudsLayer = document.getElementById('clouds-layer');
    if (!cloudsLayer) return;
    var clouds = cloudsLayer.querySelectorAll('.cloud');
    // 特效开关：关闭时隐藏云层。注册放最前——触摸设备虽跳过 parallax 逻辑，也要能隐藏（仅 display）
    var _fxClouds = _settingsBool('effects', 'clouds', true);
    cloudsLayer.style.display = _fxClouds ? '' : 'none';
    window.__gyFx.register('clouds', function (on) {
      _fxClouds = on;
      if (cloudsLayer) cloudsLayer.style.display = on ? '' : 'none';
    });

    // 触摸设备跳过（无 hover，mousemove 基本不触发），节省性能
    if (isTouchDevice) return;

    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;

    window.addEventListener('resize', function () {
      centerX = window.innerWidth / 2;
      centerY = window.innerHeight / 2;
    });

    // rAF 节流：高频 mousemove 只记最新偏移，每帧最多算一次/写一次 transform
    var _cloudRaf = null;
    var lastOX = 0;
    var lastOY = 0;

    document.addEventListener('mousemove', function (e) {
      if (!_fxClouds) return;
      // 鼠标相对于屏幕中心的偏移 → 云层反向微移（视差感）
      lastOX = (e.clientX - centerX) / centerX; // -1 ~ 1
      lastOY = (e.clientY - centerY) / centerY; // -1 ~ 1
      if (_cloudRaf) return;
      _cloudRaf = requestAnimationFrame(function () {
        _cloudRaf = null;
        // 不同层级的云移动幅度不同（远层小，近层大）
        for (var i = 0; i < clouds.length; i++) {
          var cloud = clouds[i];
          var parent = cloud.parentElement;
          var depth = 4; // 默认中层
          if (parent.classList.contains('cloud-drift--far')) depth = 2;
          else if (parent.classList.contains('cloud-drift--mid')) depth = 5;
          else if (parent.classList.contains('cloud-drift--near')) depth = 8;

          var dx = lastOX * depth;
          var dy = lastOY * depth * 0.5; // 垂直方向减半，模拟水平主导的微风
          cloud.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
        }
      });
    });
  }

  // ==================== 5. 深夜模式切换（自动 + 手动） ====================

  var _nightManual = false;

  /** 应用夜间模式 */
  function applyNight(isNight) {
    var root = document.documentElement;
    root.classList.toggle('night-mode', isNight);
    // 动态更新 theme-color（P4-2）
    var meta = document.getElementById('theme-color-meta');
    if (meta) meta.content = isNight ? '#132744' : '#B0D2E7';
    if (typeof window._onThemeSwitch === 'function') {
      window._onThemeSwitch(isNight);
    }
  }

  function initNightMode() {
    // 初始主题从设置读取（默认 auto = 系统偏色 + 时间自动；day/night 为手动覆盖）
    var initTheme = 'auto';
    try {
      if (window.__gySettings) {
        var _t = window.__gySettings.get().theme;
        if (_t === 'day' || _t === 'night' || _t === 'auto') initTheme = _t;
      }
    } catch (_err) {}
    _nightManual = (initTheme === 'day' || initTheme === 'night');
    if (_nightManual) applyNight(initTheme === 'night');

    function update() {
      if (_nightManual) return; // 手动模式覆盖自动
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var hour = new Date().getHours();
      var isNight = prefersDark || hour >= 19 || hour < 6;
      applyNight(isNight);
    }

    update();
    // 每分钟检查一次
    setInterval(update, 60000);

    // 暴露主题 setter 供设置面板（js/settings.js）调用，并持久化到 gy_settings
    window.__gyTheme.set = function (theme) {
      if (theme === 'auto') {
        _nightManual = false;
        update();
        showToast('🌗 已恢复自动日夜切换', 2200);
      } else {
        _nightManual = true;
        applyNight(theme === 'night');
        showToast(theme === 'night' ? '🌙 已切换到夜间模式' : '☀️ 已切换到日间模式', 2200);
      }
      try {
        if (window.__gySettings) window.__gySettings.save({ theme: theme });
      } catch (_err) {}
    };
  }

  // ==================== 6. 社交按钮提示 ====================

  function initSocialButtons() {
    var emailBtn = document.getElementById('email-btn');
    var githubBtn = document.getElementById('github-btn');
    var bilibiliBtn = document.getElementById('bilibili-btn');

    // 邮箱 — 复制到剪贴板
    if (emailBtn) {
      var email = 'guyu.email@qq.com';
      emailBtn.addEventListener('click', function (e) {
        e.preventDefault();
        copyText(email, function () {
          showToast('📋 邮箱已复制');
        });
      });
    }

    // GitHub — 跳转提示
    if (githubBtn) {
      githubBtn.addEventListener('click', function () {
        showToast('🔗 跳转到 GitHub');
      });
    }

    // Bilibili — 跳转提示
    if (bilibiliBtn) {
      bilibiliBtn.addEventListener('click', function () {
        showToast('🎬 正在前往 Bilibili');
      });
    }
  }

  // ==================== 7. 访客足迹（UTC 日期 + 情感化文案） ====================

  function initVisitor() {
    var el = document.getElementById('footer-visitor');
    if (!el) return;

    var STORAGE_KEY = 'gy_visit';
    var now = new Date();
    var nowTime = now.getTime();

    // ===== 本地日期键工具（YYYYMMDD 整数，按访客时区换日）=====
    // 注意：不能用 UTC 换日——UTC+8 用户每天 00:00–07:59 的访问会被归到前一天，
    // 导致"连续天数"与"今日次数"统计偏一天。
    function getLocalDayKey(ts) {
      var d = new Date(ts);
      return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }
    var todayLocal = getLocalDayKey(nowTime);

    var data;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      data = raw ? JSON.parse(raw) : null;
    } catch (_) { data = null; }

    // ===== 数据初始化或修复 =====
    if (!data || typeof data.first !== 'number' || isNaN(data.first)) {
      data = {
        first: nowTime,      // 首次访问时间戳（永久不变）
        last: nowTime,       // 上次访问时间戳
        count: 1,            // 总访问次数
        todayCount: 1,       // 今日访问次数
        streak: 1,           // 连续访问天数
        lastDate: todayLocal   // 上次访问的本地日期
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
      el.textContent = '✨ 初次来访，欢迎光临';
      return;
    }

    // ===== 判断访问状态 =====
    var lastDate = data.lastDate || getLocalDayKey(data.last || data.first);
    var isNewDay = lastDate !== todayLocal;

    // 更新数据
    data.last = nowTime;
    data.count += 1;

    if (isNewDay) {
      // 新的一天
      data.todayCount = 1;
      data.lastDate = todayLocal;
      // 连续天数：昨天访问过则+1，否则重置（按本地日期键回退一天，跨月/年安全）
      var yesterdayLocal = getLocalDayKey(nowTime - 86400000);
      data.streak = (lastDate === yesterdayLocal) ? (data.streak || 1) + 1 : 1;
    } else {
      // 同一天
      data.todayCount = (data.todayCount || 1) + 1;
    }

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}

    // ===== 生成情感化文案 =====
    var count = data.count;
    var todayCount = data.todayCount;
    var streak = data.streak;
    var totalDays = Math.max(1, Math.floor((nowTime - data.first) / 86400000) + 1);

    var messages = [];

    if (count === 1) {
      messages.push('✨ 初次来访，欢迎光临');
    } else if (isNewDay && streak >= 7) {
      messages.push('🔥 连续 ' + streak + ' 天到访 · 第 ' + count + ' 次相遇');
      messages.push('🌟 风雨无阻 ' + streak + ' 天 · 累计 ' + count + ' 次归来');
    } else if (isNewDay && streak >= 3) {
      messages.push('💫 连续 ' + streak + ' 天重逢 · 第 ' + count + ' 次相遇');
      messages.push('🌊 第 ' + streak + ' 天打卡 · 累计 ' + count + ' 次');
    } else if (isNewDay) {
      messages.push('🌊 新的一天 · 第 ' + count + ' 次相遇');
      messages.push('☀️ 欢迎回来 · 第 ' + count + ' 次到访');
    } else if (todayCount > 1) {
      messages.push('🌀 今天第 ' + todayCount + ' 次游来 · 累计 ' + count + ' 次');
      messages.push('🐟 今日第 ' + todayCount + ' 次到访 · 共 ' + count + ' 次');
    } else {
      messages.push('🌊 第 ' + count + ' 次相遇 · 相识第 ' + totalDays + ' 天');
      messages.push('💫 第 ' + count + ' 次重逢 · 相伴 ' + totalDays + ' 天');
    }

    // 基于日期种子随机挑选（同一天内保持一致）
    var seed = todayLocal + (count % 7);
    var idx = Math.abs(String(seed).split('').reduce(function(a, b) {
      return a + b.charCodeAt(0);
    }, 0)) % messages.length;

    el.textContent = messages[idx];
  }

  // ==================== 8. 页面加载进度条 ====================

  function initLoadBar() {
    var fill = document.getElementById('load-bar-fill');
    var bar = document.getElementById('load-bar');
    if (!fill || !bar) return;

    // 模拟进度：页面开始加载后逐步推进，DOM 完成后加速，window.onload 时完成
    var progress = 0;
    var timer = null;

    function step() {
      // DOM 未就绪时慢速推进到 60%，之后加速到 90%，window.onload 跳到 100%
      var target;
      if (document.readyState === 'loading') {
        target = Math.min(60, progress + (Math.random() * 8 + 2));
      } else {
        target = Math.min(90, progress + (Math.random() * 15 + 5));
      }
      progress = target;
      fill.style.width = progress + '%';

      if (progress < 90) {
        timer = setTimeout(step, 200 + Math.random() * 400);
      }
    }

    timer = setTimeout(step, 100);

    // 8 秒超时保险 — 防止资源加载卡死导致进度条永远停在 90%
    var loadTimeout = setTimeout(function () {
      clearTimeout(timer);
      fill.classList.add('done');
      setTimeout(function () {
        if (bar.parentNode) bar.parentNode.removeChild(bar);
      }, 500);
    }, CONFIG.loadBar.timeout);

    // window.onload 时完成
    window.addEventListener('load', function () {
      clearTimeout(timer);
      clearTimeout(loadTimeout);
      fill.classList.add('done');
      // 动画结束后移除 DOM
      setTimeout(function () {
        if (bar.parentNode) bar.parentNode.removeChild(bar);
      }, 500);
    });
  }

  // ==================== 启动 ====================

  function init() {
    initLoadBar();
    initNightMode();
    initParticles();
    initParallax();
    initCloudParallax();
    initMusic();
    initSocialButtons();
    initVisitor();
  }

  // DOMContentLoaded 或直接执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
