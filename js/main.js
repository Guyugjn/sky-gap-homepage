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
        _tickers[_ti](ts);
      }
    }
    requestAnimationFrame(_globalLoop);
  }
  _globalLoop(0);

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

  function createSlider(container, onChange) {
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
        onChange(getPct(e));
      }
    }

    function onUp() {
      if (dragging) { dragging = false; onChange(-1, false); }
    }

    container.addEventListener('mousedown', onDown);
    container.addEventListener('touchstart', onDown, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);

    return {
      destroy: function () {
        container.removeEventListener('mousedown', onDown);
        container.removeEventListener('touchstart', onDown);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchend', onUp);
      }
    };
  }

  // ==================== 1. 光粒子系统 ====================

  function initParticles() {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', () => {
      resize();
      // 重新生成粒子以适应新尺寸
      particles = createParticles();
    });

    // 创建一个粒子
    function createParticle() {
      const colors = CONFIG.particles.colors;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: CONFIG.particles.minSize + Math.random() * (CONFIG.particles.maxSize - CONFIG.particles.minSize),
        speed: CONFIG.particles.minSpeed + Math.random() * (CONFIG.particles.maxSpeed - CONFIG.particles.minSpeed),
        opacity: CONFIG.particles.minOpacity + Math.random() * (CONFIG.particles.maxOpacity - CONFIG.particles.minOpacity),
        color: colors[Math.floor(Math.random() * colors.length)],
        // 水平漂移
        drift: (Math.random() - 0.5) * 0.3,
        // 闪烁相位
        phase: Math.random() * Math.PI * 2,
        // 闪烁速度
        flickerSpeed: 0.005 + Math.random() * 0.02,
      };
    }

    function createParticles() {
      // 移动端（宽度 ≤768px）减半粒子数，节省 GPU 填充率
      var count = window.innerWidth <= 768
        ? Math.floor(CONFIG.particles.count * 0.5)
        : CONFIG.particles.count;
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push(createParticle());
      }
      return arr;
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 上升移动
        p.y -= p.speed;
        // 水平漂移
        p.x += p.drift + Math.sin(time * 0.0005 + p.phase) * 0.15;

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

        // 绘制发光粒子 — 用 shadowBlur 替代 createRadialGradient，减少 GC 压力
        ctx.shadowBlur = p.r * 5;
        ctx.shadowColor = `rgba(${p.color}, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
        ctx.fill();
      }
      ctx.restore();
    }

    particles = createParticles();
    window._registerTick(draw);
  }

  // ==================== 2. 飞鱼：自主漫游 + 鼠标吸引 ====================

  function initParallax() {
    if (!cursorFish) return;

    var isMobile = window.innerWidth <= 768;

    var pupil = cursorFish.querySelector('.fish-eye-pupil');
    var shine = cursorFish.querySelector('.fish-eye-shine');

    var FISH_SPEED = CONFIG.fish.speed;
    var IDLE_TIMEOUT = CONFIG.fish.idleTimeout;
    var MIN_CURSOR_DIST = CONFIG.fish.minCursorDist;

    // 鱼始终可见
    cursorFish.classList.add('visible');

    var fishFlipTarget = -1;  // 目标朝向：-1=朝右，1=朝左
    var fishFlipSmooth = -1;  // 平滑插值后的 scaleX 值

    var scaredUntil = 0;        // 受惊逃跑期间面朝远离光标方向

    function update() {
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
      attractBlend += (targetBlend - attractBlend) * 0.04;

      // ==== 漫游方向：从左向右，正弦波上下起伏 ====
      wanderPhase += 0.015;
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
      fishVelX += (targetVelX - fishVelX) * INERTIA;
      fishVelY += (targetVelY - fishVelY) * INERTIA;
      mouseX += fishVelX;
      mouseY += fishVelY;

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
        fishAngle += diff * 0.08;
      }

      // ==== 渲染 ====
      // 平滑翻转：避免 scaleX 瞬时跳变
      fishFlipSmooth += (fishFlipTarget - fishFlipSmooth) * 0.08;
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
          // 低通滤波：每帧向目标值插值 30%，抑制微小抖动
          if (pupil._smoothX == null) { pupil._smoothX = rawShiftX; pupil._smoothY = rawShiftY; }
          pupil._smoothX += (rawShiftX - pupil._smoothX) * 0.30;
          pupil._smoothY += (rawShiftY - pupil._smoothY) * 0.30;
          pupil.setAttribute('cx', (22 + pupil._smoothX).toFixed(2));
          pupil.setAttribute('cy', (29 + pupil._smoothY).toFixed(2));
          if (shine) {
            shine.setAttribute('cx', (21 + pupil._smoothX * 0.65).toFixed(2));
            shine.setAttribute('cy', (28 + pupil._smoothY * 0.65).toFixed(2));
          }
        } else {
          // 漫游模式：瞳孔归中
          pupil._smoothX = null; pupil._smoothY = null;
          pupil.setAttribute('cx', '22');
          pupil.setAttribute('cy', '29');
          if (shine) {
            shine.setAttribute('cx', '21');
            shine.setAttribute('cy', '28');
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

      // 鱼在范围内 → 弹飞
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
      lastMouseActivity = Date.now();
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    });

    window._registerTick(update);
  }

  // ==================== 3. 音乐播放器 ====================

  function initMusic() {
    if (!musicBtn || !musicPlayer) return;

    // 从 playlist.js（<script> 标签加载）读取曲目列表
    var playlist = window.__PLAYLIST__ || [];
    var totalTracks = playlist.length;

    // 读取上次保存的音量（localStorage），若无则用默认值
    var savedVol = parseFloat(localStorage.getItem('gy_volume'));
    var volume = (savedVol >= 0 && savedVol <= 1) ? savedVol : CONFIG.music.startVolume;
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
      return Math.floor(Math.random() * totalTracks);
    }

    var fadeAnimId = null; // 当前淡入/淡出动画 ID

    function play() {
      // 取消正在进行的淡出（如果快速切换）
      if (fadeAnimId) { cancelAnimationFrame(fadeAnimId); fadeAnimId = null; }
      audio.play().then(function () {
        musicBtn.classList.add('playing');
        isPlaying = true;
        fadeInVolume();
        preloadDone = false; // 等缓冲够了再自动预加载下一首
      }).catch(function (err) {
        console.warn('播放失败：', err.message);
        updateLabel(currentIndex); // 清除"加载中…"状态
        showToast('⚠️ 播放失败，请检查网络或点击重试', 2500);
      });
    }

    function pause() {
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
    var _outsideClickHandler = null; // 外部点击关闭

    // 播放列表渲染缓存 — 避免每次打开重建 DOM
    var _playlistRendered = false;

    function selectTrack(idx) {
      if (idx === currentIndex && started) return;
      if (playMode === 2 && started) playHistory.push(currentIndex);
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
                  '<span class="pl-name">' + getDisplayName(i) + '</span>' +
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

      if (started) scrollToListIndex(currentIndex);
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
    function scrollToListIndex(index) {
      if (!listInner) return;
      var item = listInner.querySelector('.playlist-item[data-index="' + index + '"]');
      if (!item) return;
      var maxS = listInner.scrollHeight - listInner.clientHeight;
      var target = item.offsetTop - (listInner.clientHeight - item.offsetHeight) / 2;
      if (target < 0) target = 0;
      if (target > maxS) target = maxS;
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
      renderPlaylist();
      playlistEl.classList.add('open');
      listBtn && listBtn.classList.add('open');
      listOpen = true;

      // 桌面端：启用自定义动量滚动
      if (!isTouchDevice) {
        listInner.addEventListener('wheel', onPlaylistWheel, { passive: false });
      }
      // 移动端：完全交给原生滚动，不做任何拦截

      _outsideClickHandler = function(e) {
        if (!playlistEl || !listBtn) return;
        if (playlistEl.contains(e.target) || listBtn.contains(e.target)) return;
        closePlaylist();
      };
      setTimeout(function() {
        if (listOpen) document.addEventListener('click', _outsideClickHandler);
      }, 10);
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

      // 移除外部点击监听
      if (_outsideClickHandler) {
        document.removeEventListener('click', _outsideClickHandler);
        _outsideClickHandler = null;
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
      if (volumePct) volumePct.textContent = pct + '%';
      updateVolumeIcon(vol);
    }

    // 自定义拖拽（用 createSlider 工厂）
    if (volumeBar) {
      createSlider(volumeBar, function (pct) {
        if (pct < 0) return;
        volume = pct;
        audio.volume = volume;
        updateVolumeUI(volume);
        // 持久化音量
        try { localStorage.setItem('gy_volume', pct.toFixed(3)); } catch (e) {}
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
    var _isMuted = false;
    var _volumeBeforeMute = volume;
    volumeBtn.addEventListener('click', function () {
      if (_isMuted) {
        // 取消静音
        _isMuted = false;
        volume = _volumeBeforeMute || CONFIG.music.startVolume;
        audio.volume = volume;
        updateVolumeUI(volume);
        try { localStorage.setItem('gy_volume', volume.toFixed(3)); } catch (e) {}
      } else if (volume > 0.005) {
        // 静音 — 保存当前音量（来自滑块的最新值）然后静音
        _isMuted = true;
        _volumeBeforeMute = volume;
        volume = 0;
        audio.volume = 0;
        updateVolumeUI(0);
        try { localStorage.setItem('gy_volume', '0'); } catch (e) {}
      }
      // volume 已为 0 时再点静音按钮无反应，避免状态混乱
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
      // 输入框中不触发
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
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
          if (_isMuted) _isMuted = false;
          volume = Math.min(1, volume + 0.05);
          audio.volume = volume;
          updateVolumeUI(volume);
          try { localStorage.setItem('gy_volume', volume.toFixed(3)); } catch (e) {}
          break;
        case 'ArrowDown':
          e.preventDefault();
          volume = Math.max(0, volume - 0.05);
          audio.volume = volume;
          updateVolumeUI(volume);
          if (volume <= 0.005) {
            _isMuted = true;
            _volumeBeforeMute = 0.05;
          } else if (_isMuted) {
            _isMuted = false;
          }
          try { localStorage.setItem('gy_volume', volume.toFixed(3)); } catch (e) {}
          break;
      }
    });
  }

  // ==================== 4. 云层鼠标视差 ====================

  function initCloudParallax() {
    var cloudsLayer = document.getElementById('clouds-layer');
    if (!cloudsLayer) return;
    var clouds = cloudsLayer.querySelectorAll('.cloud');

    // 移动端跳过（触摸无 hover，且节省性能）
    if (window.matchMedia('(max-width: 768px)').matches) return;

    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;

    window.addEventListener('resize', function () {
      centerX = window.innerWidth / 2;
      centerY = window.innerHeight / 2;
    });

    document.addEventListener('mousemove', function (e) {
      // 鼠标相对于屏幕中心的偏移 → 云层反向微移（视差感）
      var offsetX = (e.clientX - centerX) / centerX; // -1 ~ 1
      var offsetY = (e.clientY - centerY) / centerY; // -1 ~ 1

      // 不同层级的云移动幅度不同（远层小，近层大）
      for (var i = 0; i < clouds.length; i++) {
        var cloud = clouds[i];
        var parent = cloud.parentElement;
        var depth = 4; // 默认中层
        if (parent.classList.contains('cloud-drift--far')) depth = 2;
        else if (parent.classList.contains('cloud-drift--mid')) depth = 5;
        else if (parent.classList.contains('cloud-drift--near')) depth = 8;

        var dx = offsetX * depth;
        var dy = offsetY * depth * 0.5; // 垂直方向减半，模拟水平主导的微风
        cloud.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
      }
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
    var btn = document.getElementById('theme-toggle');
    var iconPath = btn ? btn.querySelector('path') : null;

    var ICON_SUN = 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z';
    var ICON_MOON = 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z';

    function updateIcon() {
      if (!iconPath) return;
      var isNight = document.documentElement.classList.contains('night-mode');
      iconPath.setAttribute('d', isNight ? ICON_MOON : ICON_SUN);
    }

    function update() {
      if (_nightManual) return; // 手动模式覆盖自动
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var hour = new Date().getHours();
      var isNight = prefersDark || hour >= 19 || hour < 6;
      applyNight(isNight);
      updateIcon();
    }

    if (btn) {
      btn.addEventListener('click', function () {
        _nightManual = true;
        applyNight(!document.documentElement.classList.contains('night-mode'));
        updateIcon();
      });
    }

    update();
    // 每分钟检查一次
    setInterval(update, 60000);
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

    // ===== UTC 日期工具函数 =====
    function getUTCDate(ts) {
      var d = new Date(ts);
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    var todayUTC = getUTCDate(nowTime);

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
        lastDate: todayUTC   // 上次访问的 UTC 日期
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
      el.textContent = '✨ 初次来访，欢迎光临';
      return;
    }

    // ===== 判断访问状态 =====
    var lastDate = data.lastDate || getUTCDate(data.last || data.first);
    var isNewDay = lastDate !== todayUTC;

    // 更新数据
    data.last = nowTime;
    data.count += 1;

    if (isNewDay) {
      // 新的一天
      data.todayCount = 1;
      data.lastDate = todayUTC;
      // 连续天数：昨天访问过则+1，否则重置
      var yesterdayUTC = todayUTC - 86400000;
      data.streak = (lastDate === yesterdayUTC) ? (data.streak || 1) + 1 : 1;
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
    var seed = todayUTC + (count % 7);
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
