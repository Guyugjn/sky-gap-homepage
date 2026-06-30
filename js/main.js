/* ============================================
   GY · 天空之隙 — 交互脚本
   光粒子 · 视差云 · 鼠标跟随 · 音乐播放器
   ============================================ */

(function () {
  'use strict';

  // ==================== 配置 ====================

  const CONFIG = {
    music: {
      dir: 'assets/music/',    // 音乐目录
      startVolume: 0.05,       // 初始音量
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
    parallax: {
      factor: 0.03,            // 鼠标视差系数
    },
  };

  // ==================== DOM 引用 ====================

  const canvas = document.getElementById('particles-canvas');
  const cloudsLayer = document.getElementById('clouds-layer');
  const cursorGlow = document.getElementById('cursor-glow');
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
  const avatarImg = document.getElementById('avatar');

  // ==================== 状态 ====================

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let targetMouseX = mouseX;
  let targetMouseY = mouseY;
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
    clearTimeout(_toastTimer);
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
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

  // ==================== 2. 鼠标视差 + 跟随柔光 ====================

  function initParallax() {
    if (!cloudsLayer || !cursorGlow) return;

    const clouds = cloudsLayer.querySelectorAll('.cloud');

    function update() {
      // 平滑插值
      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;

      // 云层视差位移
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = (mouseX - centerX) * CONFIG.parallax.factor;
      const deltaY = (mouseY - centerY) * CONFIG.parallax.factor;

      clouds.forEach(function (cloud) {
        const speed = parseFloat(cloud.getAttribute('data-speed')) || 0.04;
        cloud.style.transform =
          'translate(' + (deltaX * speed * 40) + 'px, ' + (deltaY * speed * 20) + 'px)';
      });

      // 鼠标跟随柔光
      cursorGlow.style.left = mouseX + 'px';
      cursorGlow.style.top = mouseY + 'px';

      requestAnimationFrame(update);
    }

    document.addEventListener('mousemove', function (e) {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;

      // 首次移动时显示光晕
      if (!cursorGlow.classList.contains('visible')) {
        cursorGlow.classList.add('visible');
      }
    });

    // 鼠标离开窗口时隐藏光晕
    document.addEventListener('mouseleave', function () {
      cursorGlow.classList.remove('visible');
    });

    document.addEventListener('mouseenter', function () {
      cursorGlow.classList.add('visible');
    });

    // 触屏设备：无鼠标跟随，但依然有视差（使用设备陀螺仪或固定位置）
    if ('ontouchstart' in window) {
      cursorGlow.style.display = 'none';
      // 触屏设备将云层定位于中心
      targetMouseX = window.innerWidth / 2;
      targetMouseY = window.innerHeight / 2;
    }

    update();
  }

  // ==================== 3. 音乐播放器 ====================

  function initMusic() {
    if (!musicBtn || !musicPlayer) return;

    // 曲名显示列表（与 00.mp3 ~ 63.mp3 一一对应）
    var PLAYLIST_NAMES = [
      '-記憶- (ヨスガノソラ メインテーマ) - 市川淳',
      '-遠い空へ- (ヨスガノソラ メインテーマ) - 市川淳',
      '-願い- (ヨスガノソラ メインテーマ) - 市川淳',
      'BLUE - 金閉開羅巧夢',
      'Bamboo - Piano Masters',
      'Cry for the moon - 出羽良彰',
      'Decretum - 梶浦由記',
      'Deep Inside Region - 市川淳',
      'Final Breath - Cœur de pirate',
      'Fonte - Saigenji',
      'Hyourinaomoi - 出羽良彰',
      'I Will Protect You - 横山克',
      'Kishiouno hokori - 川井憲次',
      'Let me hear (Remix) - S9ryne',
      'Nr. 1 - Martin Ermen',
      'Ocean of Memories - 深澤秀行',
      'Silent express - 出羽良彰',
      'Sorrow - 日本群星',
      'The moment - 跟弃',
      'The moment（music box ver） - 跟弃',
      'Yuri on ICE - 梅林太郎',
      'a memories for us feat.Day\'s - Clover Day\'s',
      'deep in old grief (纯音乐) - 梶浦由記',
      'imbalanceAlice - 深澤秀行',
      'take your hands - 梶浦由記',
      'かたわれ時 - RADWIMPS',
      'すりぬける心 - 渡辺善太郎',
      'アゲイン - 横山克',
      'ウソとホント～PianoSolo - 横山克',
      'シシリエンヌ - 田中公平',
      'リズと青い鳥 第三楽章「愛ゆえの決断」 - 北宇治高校吹奏楽部',
      'ロック风アレンジ - 麻枝准',
      '不安な心 - 川田瑠夏',
      '予感 - MANYO',
      '五月雨 - 高梨康治、刃-yaiba-',
      '今日は飲まなきゃ - 浜口史郎',
      '伝说 - 出羽良彰',
      '優等悪魔の光と影 - 松尾早人',
      '去り逝く者、残される者 - MANYO',
      '友人A君を私の伴奏者に任命します - 横山克',
      '命 - S9ryne',
      '回梦游仙 - 骆集益',
      '夜の向日葵 - szak',
      '夜想曲第2番 変ホ長調 op.9-2 -ノクターン- - 末廣健一郎',
      '天空を駆ける風の都 - 狐の工作室',
      '寂しい夜 - 三輪学',
      '小さな旋律 - szak',
      '恋の記憶 - 松尾早人',
      '恋～口づけまでの距離 [メインテーマ] - 松尾早人',
      '想い出は遠くの日々 - 天門',
      '戸惑いの中 - 市川淳',
      '春の香り - 横山克',
      '栄の活躍 - 松本晃彦',
      '潮鳴り - 折戸伸治',
      '瞳ニ映ル景色 - 末廣健一郎',
      '私の嘘～PianoSolo - 横山克',
      '私を好きにならないで - 大島ミチル',
      '終ワリノ歌 - 末廣健一郎',
      '追い求めてきたもの - 三輪学',
      '降り続く雨の街で - VISUAL ARTS、Key Sounds Label',
      '雲流れ - Foxtail-Grass Studio',
      '饒舌な本と無口な少女 - 松尾早人',
      '鳥の詩 ~ - Lia',
    ];
    var totalTracks = PLAYLIST_NAMES.length;

    var volume = CONFIG.music.startVolume;
    var started = false; // 是否已完成首次加载

    // === 创建 audio ===
    audio = new Audio();
    audio.volume = 0;
    audio.preload = 'auto';

    // === 工具函数 ===

    function padIndex(i) {
      return (i < 10 ? '0' : '') + i;
    }

    function updateLabel(index) {
      if (!musicLabel) return;
      var name = PLAYLIST_NAMES[index];
      musicLabel.textContent = name;
      musicLabel.title = name;
    }

    function loadTrack(index) {
      currentIndex = index;
      var src = CONFIG.music.dir + padIndex(index) + '.mp3';
      audio.src = src;
      updateLabel(index);
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
      }).catch(function (err) {
        console.warn('播放失败：', err.message);
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

    // === 切歌逻辑 ===

    function playPrev() {
      if (playMode === 2) {
        // 随机模式：回到上一首随机曲目（用 history）
        currentIndex = Math.max(0, currentIndex - 1);
        if (currentIndex < 0) currentIndex = totalTracks - 1;
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
        // 随机
        currentIndex = randomIndex();
      } else {
        // 列表循环
        currentIndex = (currentIndex + 1) % totalTracks;
      }
      loadTrack(currentIndex);
      play();
      notifySongChange();
    }

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
      showToast('🎵 ' + PLAYLIST_NAMES[currentIndex], 2200);
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
      updateModeUI();
    });

    // === 点击唱片复制曲名 ===
    if (vinylWrap) {
      vinylWrap.style.cursor = 'pointer';
      vinylWrap.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!started) return;
        copyText(PLAYLIST_NAMES[currentIndex], function () {
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

    // GitHub — 占位提示
    if (githubBtn) {
      githubBtn.addEventListener('click', function (e) {
        e.preventDefault();
        showToast('🔗 GitHub 链接待补充');
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
