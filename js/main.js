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
  };

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
  const volumeSlider = document.getElementById('volume-slider');
  const volumeIcon = document.getElementById('volume-icon');
  const progressWrap = document.querySelector('.progress-wrap');
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
  let wanderAngle = Math.random() * Math.PI * 2;
  let wanderPhase = Math.random() * Math.PI * 2;
  let attractBlend = 0; // 0=漫游, 1=追逐光标
  let fishVelX = 0;     // 飞鱼当前速度（带惯性）
  let fishVelY = 0;
  let audio = null;
  let isPlaying = false;
  let currentIndex = 0;       // 当前播放索引
  let playMode = 2;           // 0=列表循环 1=单曲循环 2=随机（默认随机）
  let animationId = null;

  // ==================== 共享 toast 提示 ====================

  var _toastTimer = null;

  function showToast(msg, duration) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
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
    }, duration || 1800);
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
      const arr = [];
      for (let i = 0; i < CONFIG.particles.count; i++) {
        arr.push(createParticle());
      }
      return arr;
    }

    particles = createParticles();

    function draw(time) {
      ctx.clearRect(0, 0, w, h);

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

        // 绘制发光粒子
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

        // 内发光
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        gradient.addColorStop(0, `rgba(${p.color}, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(${p.color}, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${p.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    function animate(time) {
      draw(time);
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);
  }

  // ==================== 2. 飞鱼：自主漫游 + 鼠标吸引 ====================

  function initParallax() {
    if (!cursorFish) return;

    var pupil = cursorFish.querySelector('.fish-eye-pupil');
    var shine = cursorFish.querySelector('.fish-eye-shine');

    var FISH_SPEED = 2.5;         // 恒定速度（px/帧）
    var IDLE_TIMEOUT = 4000;      // 鼠标静止 4 秒后飞走
    var MIN_CURSOR_DIST = 70;     // 追逐时与光标的最小距离

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
      var INERTIA = 0.08; // 惯性系数（越小惯性越明显）

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
      cursorFish.style.left = mouseX + 'px';
      cursorFish.style.top = mouseY + 'px';
      cursorFish.style.transform =
        'translate(-42.1%, -51.6%) scaleX(' + fishFlipSmooth.toFixed(3) + ') rotate(' + fishAngle + 'deg)';

      // ==== 瞳孔追踪 ====
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
          var shiftX = (clamped / 35) * 1.6 * (fishFlipSmooth > 0 ? 1 : -1);
          var shiftY = (clamped / 35) * 0.9;
          pupil.setAttribute('cx', (22 + shiftX).toFixed(2));
          pupil.setAttribute('cy', (29 + shiftY).toFixed(2));
          if (shine) {
            shine.setAttribute('cx', (21 + shiftX * 0.65).toFixed(2));
            shine.setAttribute('cy', (28 + shiftY * 0.65).toFixed(2));
          }
        } else {
          // 漫游模式：瞳孔归中
          pupil.setAttribute('cx', '22');
          pupil.setAttribute('cy', '29');
          if (shine) {
            shine.setAttribute('cx', '21');
            shine.setAttribute('cy', '28');
          }
        }
      }

      requestAnimationFrame(update);
    }

    // 点击任意位置 → 涟漪 + 鱼在范围内则逃跑
    var FISH_SCARE_RANGE = 100; // 鱼受惊范围（px）
    document.addEventListener('click', function (e) {
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
        fishVelX = awayX * 22;
        fishVelY = awayY * 22;
        // 瞬间翻转面朝远离方向
        fishFlipTarget = awayX >= 0 ? -1 : 1;
        fishFlipSmooth = fishFlipTarget;
        // 3~5 秒后恢复正常
        scaredUntil = Date.now() + 3000 + Math.random() * 2000;
      }
    });

    // 鼠标移动 → 记录活跃时间 + 更新目标位置
    document.addEventListener('mousemove', function (e) {
      lastMouseActivity = Date.now();
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    });

    update();
  }

  // ==================== 3. 音乐播放器 ====================

  function initMusic() {
    if (!musicBtn || !musicPlayer) return;

    // 从 playlist.js（<script> 标签加载）读取曲目列表
    var playlist = window.__PLAYLIST__ || [];
    var totalTracks = playlist.length;

    var volume = CONFIG.music.startVolume;
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
    }

    // 曲名位置显示加载状态
    function showLoadingLabel(msg) {
      if (!musicLabel) return;
      musicLabel.textContent = msg || '加载中…';
      musicLabel.title = '';
      musicLabel.style.display = 'block';
      musicLabel.classList.add('loading');
    }

    function loadTrack(index) {
      currentIndex = index;
      var src = CONFIG.music.dir + encodeURIComponent(playlist[index]);
      audio.src = src;            // 赋值 src 会自动触发 loadstart 事件，事件中已调用 showLoadingLabel()
      preloadDone = false;       // 新曲目重置，等缓冲够了再预加载
      started = true;
    }

    // 随机选曲
    function randomIndex() {
      return Math.floor(Math.random() * totalTracks);
    }

    var vinylWrap = document.querySelector('.vinyl-wrap');
    var fadeAnimId = null; // 当前淡入/淡出动画 ID

    function play() {
      // 取消正在进行的淡出（如果快速切换）
      if (fadeAnimId) { cancelAnimationFrame(fadeAnimId); fadeAnimId = null; }
      audio.play().then(function () {
        musicBtn.classList.add('playing');
        if (vinylWrap) vinylWrap.classList.add('spinning');
        isPlaying = true;
        if (progressWrap) progressWrap.classList.add('visible');
        fadeInVolume();
        preloadDone = false; // 等缓冲够了再自动预加载下一首
      }).catch(function (err) {
        console.warn('播放失败：', err.message);
        updateLabel(currentIndex); // 清除"加载中…"状态
        showToast('⚠️ 播放失败，请检查网络或点击重试', 2500);
      });
    }

    function pause() {
      // 淡出后暂停
      fadeOutVolume(function () {
        audio.pause();
        musicBtn.classList.remove('playing');
        if (vinylWrap) vinylWrap.classList.remove('spinning');
        if (progressWrap) progressWrap.classList.remove('visible');
        isPlaying = false;
      });
    }

    function fadeInVolume() {
      if (fadeAnimId) cancelAnimationFrame(fadeAnimId);
      var startTime = performance.now();
      function step(now) {
        var progress = Math.min((now - startTime) / CONFIG.music.fadeInMs, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        audio.volume = volume * eased;
        if (progress < 1) {
          fadeAnimId = requestAnimationFrame(step);
        } else {
          fadeAnimId = null;
        }
      }
      fadeAnimId = requestAnimationFrame(step);
    }

    function fadeOutVolume(callback) {
      if (fadeAnimId) cancelAnimationFrame(fadeAnimId);
      var startVol = audio.volume;
      var startTime = performance.now();
      var duration = 500;
      function step(now) {
        var progress = Math.min((now - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        audio.volume = startVol * (1 - eased);
        if (progress < 1) {
          fadeAnimId = requestAnimationFrame(step);
        } else {
          fadeAnimId = null;
          audio.volume = 0;
          if (callback) callback();
        }
      }
      fadeAnimId = requestAnimationFrame(step);
    }

    var playHistory = []; // 随机模式播放历史栈，支持"上一首"回到真正听过的曲目

    // === 切歌逻辑 ===

    function playPrev() {
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
    }

    function playNext() {
      if (playMode === 1) {
        // 单曲循环
        audio.currentTime = 0;
        play();
        return;
      }
      if (playMode === 2) {
        // 随机：记录当前曲目到历史，再随机选下一首
        playHistory.push(currentIndex);
        currentIndex = randomIndex();
      } else {
        // 列表循环
        currentIndex = (currentIndex + 1) % totalTracks;
      }
      loadTrack(currentIndex);
      play();
      notifySongChange();
    }

    // === 加载状态 — 曲名位置显示加载中/缓冲中 ===
    audio.addEventListener('loadstart', function () {
      showLoadingLabel();
    });

    audio.addEventListener('canplay', function () {
      updateLabel(currentIndex);
    });

    audio.addEventListener('waiting', function () {
      // 播放过程中缓冲不足时显示
      if (isPlaying) showLoadingLabel('缓冲中…');
    });

    audio.addEventListener('playing', function () {
      updateLabel(currentIndex);
    });

    // === 播放结束 ===
    audio.addEventListener('ended', playNext);

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

    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return;
      var pct = (audio.currentTime / audio.duration) * 100;
      if (progressFill) progressFill.style.width = pct + '%';
      if (timeCurrent) timeCurrent.textContent = formatTime(audio.currentTime);
    });

    // === 进度条点击/拖拽跳转 ===
    if (progressBar) {
      var dragging = false;

      function seekFromEvent(e) {
        if (!audio.duration) return;
        var rect = progressBar.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        var pct = Math.max(0, Math.min(1, x / rect.width));
        audio.currentTime = pct * audio.duration;
        progressFill.style.width = (pct * 100) + '%';
      }

      progressBar.addEventListener('mousedown', function (e) {
        dragging = true;
        seekFromEvent(e);
      });

      document.addEventListener('mousemove', function (e) {
        if (dragging) seekFromEvent(e);
      });

      document.addEventListener('mouseup', function () {
        dragging = false;
      });

      // 触摸支持
      progressBar.addEventListener('touchstart', function (e) {
        dragging = true;
        seekFromEvent(e);
      });

      document.addEventListener('touchmove', function (e) {
        if (dragging) seekFromEvent(e);
      });

      document.addEventListener('touchend', function () {
        dragging = false;
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
      modeBtn.querySelector('path').setAttribute('d', m.path);
      if (modeTip) modeTip.textContent = m.title;
    }

    modeBtn.addEventListener('click', function () {
      playMode = (playMode + 1) % 3;
      playHistory = []; // 切换模式时清空随机历史
      updateModeUI();
      // 模式切换后重置预加载标记，让 progress 事件按新模式重新触发
      if (isPlaying) { preloadDone = false; preloadAudio.src = ''; }
    });

    // === 点击唱片复制曲名 ===
    if (vinylWrap) {
      vinylWrap.style.cursor = 'pointer';
      vinylWrap.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!started) return;
        copyText(getDisplayName(currentIndex), function () {
          showToast('📋 曲名已复制');
        });
      });
    }

    // === 音量控制 ===
    function updateVolumeUI(vol) {
      var pct = Math.round(vol * 100);
      if (volumeSlider) volumeSlider.value = pct;
      if (volumePct) volumePct.textContent = pct + '%';
      updateVolumeIcon(vol);
    }

    volumeSlider.addEventListener('input', function () {
      volume = parseInt(this.value) / 100;
      audio.volume = volume;
      if (volumePct) volumePct.textContent = this.value + '%';
      updateVolumeIcon(volume);
    });

    volumeBtn.addEventListener('click', function () {
      if (volume > 0.005) {
        volumeSlider.dataset.prev = volume;
        volume = 0;
        audio.volume = 0;
        updateVolumeUI(0);
      } else {
        var prev = parseFloat(volumeSlider.dataset.prev) || CONFIG.music.startVolume;
        volume = prev;
        audio.volume = volume;
        updateVolumeUI(prev);
      }
    });

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
      volumeIcon.querySelector('path').setAttribute('d', path);
    }

    // === 按钮事件 ===
    musicBtn.addEventListener('click', function () {
      if (!started) {
        // 首次加载
        if (!totalTracks) { showToast('⚠️ 播放列表为空，请运行 python generate_playlist.py'); return; }
        loadTrack(randomIndex());
        play();
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
  }

  // ==================== 4. 社交按钮提示 ====================

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

  // ==================== 启动 ====================

  function init() {
    initParticles();
    initParallax();
    initMusic();
    initSocialButtons();
  }

  // DOMContentLoaded 或直接执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
