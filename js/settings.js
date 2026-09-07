/* ============================================
   GY · 天空之隙 — 设置面板
   gy_settings 存储 + 齿轮按钮 + 毛玻璃设置面板
   依赖（先于本文件加载 / 已由 index.html 保证顺序）：
   - index.html 中 #settings-toggle、#settings-overlay 等 DOM
   - 各子系统暴露的 window.__gyTheme / __gyFx / __gyMusic / __gyWaifu
   ============================================ */

(function () {
  'use strict';

  // ==================== gy_settings 存储 ====================

  var STORAGE_KEY = 'gy_settings';
  var DEFAULTS = {
    theme: 'auto',                                    // "auto" | "day" | "night"
    effects: { particles: true, fish: true, clouds: true, starfield: true },
    music: { mode: 2 },                               // 0=列表循环 1=单曲 2=随机
    live2d: true
  };

  /** 深浅合并：patch 覆盖 base，嵌套对象（effects/music）逐层合并 */
  function deepMerge(base, patch) {
    var out = {}, k;
    for (k in base) if (base.hasOwnProperty(k)) out[k] = base[k];
    if (patch) {
      for (k in patch) if (patch.hasOwnProperty(k)) {
        if (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k]) &&
            out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
          out[k] = deepMerge(out[k], patch[k]);
        } else {
          out[k] = patch[k];
        }
      }
    }
    return out;
  }

  function readStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (_err) {}
    return null;
  }

  var _data = null; // 内存缓存

  window.__gySettings = {
    get: function () {
      if (!_data) _data = deepMerge(DEFAULTS, readStorage());
      return _data;
    },
    save: function (patch) {
      _data = deepMerge(_data || DEFAULTS, patch);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_data)); } catch (_err) {}
      return _data;
    }
  };

  // ==================== 设置面板 ====================

  function initSettings() {
    var toggle = document.getElementById('settings-toggle');
    var overlay = document.getElementById('settings-overlay');
    var panel = document.getElementById('settings-panel');
    var closeBtn = document.getElementById('settings-close');
    if (!toggle || !overlay || !panel) return;

    var body = panel.querySelector('.settings-body');
    var themeBtns = panel.querySelectorAll('#settings-theme .seg-btn');
    var modeBtns = panel.querySelectorAll('#settings-mode .seg-btn');
    var effectInputs = panel.querySelectorAll('[data-effect]');
    var live2dInput = panel.querySelector('[data-live2d]');
    var volumeBar = document.getElementById('settings-volume-bar');
    var volumeFill = document.getElementById('settings-volume-fill');
    var volumeVal = document.getElementById('settings-volume-val');

    // ---- 控件状态同步 ----

    function applyThemeUI() {
      var t = window.__gySettings.get().theme;
      for (var i = 0; i < themeBtns.length; i++) {
        themeBtns[i].setAttribute('aria-checked', themeBtns[i].getAttribute('data-theme') === t ? 'true' : 'false');
      }
    }

    function applyModeUI() {
      var m = (window.__gyMusic && window.__gyMusic.getMode) ? window.__gyMusic.getMode() : window.__gySettings.get().music.mode;
      for (var i = 0; i < modeBtns.length; i++) {
        modeBtns[i].setAttribute('aria-checked', parseInt(modeBtns[i].getAttribute('data-mode'), 10) === m ? 'true' : 'false');
      }
    }

    function updateSettingsVolumeUI(v) {
      var pct = Math.round(v * 100);
      if (volumeFill) volumeFill.style.width = pct + '%';
      if (volumeVal) volumeVal.textContent = pct + '%';
      if (volumeBar) volumeBar.setAttribute('aria-valuenow', pct);
    }
    function applyVolumeUI() {
      var v = (window.__gyMusic && window.__gyMusic.getVolume) ? window.__gyMusic.getVolume() : 0.2;
      updateSettingsVolumeUI(v);
    }

    function applyEffectsUI() {
      var eff = window.__gySettings.get().effects;
      for (var i = 0; i < effectInputs.length; i++) {
        var name = effectInputs[i].getAttribute('data-effect');
        effectInputs[i].checked = !!eff[name];
      }
    }

    // ---- 打开 / 关闭 ----

    var _closeTimer = null;

    function open() {
      // 取消上一次关闭的延迟隐藏，避免快速「关→开」时旧 timer 把刚打开的面板藏起来
      if (_closeTimer) { clearTimeout(_closeTimer); _closeTimer = null; }
      applyThemeUI();
      applyModeUI();
      applyVolumeUI();
      applyEffectsUI();
      bindVolumeSlider();
      if (live2dInput) live2dInput.checked = !!window.__gySettings.get().live2d;
      overlay.hidden = false;
      requestAnimationFrame(function () { overlay.classList.add('open'); });
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('open');
      if (_closeTimer) clearTimeout(_closeTimer);
      _closeTimer = setTimeout(function () { overlay.hidden = true; _closeTimer = null; }, 260);
      if (toggle) toggle.focus();
    }

    // ---- 面板内提示条（动态创建，供"看板娘需刷新"等场景） ----

    function showNotice(msg) {
      if (!body) return;
      var notice = panel.querySelector('.settings-notice');
      if (!notice) {
        notice = document.createElement('p');
        notice.className = 'settings-notice';
        notice.setAttribute('role', 'status');
        body.appendChild(notice);
      }
      notice.textContent = msg;
      notice.classList.add('show');
      clearTimeout(notice._t);
      notice._t = setTimeout(function () { notice.classList.remove('show'); }, 2600);
    }

    // ---- 事件绑定 ----

    toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // 点击遮罩空白处关闭
    overlay.addEventListener('mousedown', function (e) {
      if (e.target === overlay) close();
    });
    // Esc 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) close();
    });

    // 主题
    for (var t = 0; t < themeBtns.length; t++) {
      themeBtns[t].addEventListener('click', function () {
        var theme = this.getAttribute('data-theme');
        if (window.__gyTheme && window.__gyTheme.set) window.__gyTheme.set(theme);
        applyThemeUI();
      });
    }

    // 播放模式
    for (var m = 0; m < modeBtns.length; m++) {
      modeBtns[m].addEventListener('click', function () {
        var mode = parseInt(this.getAttribute('data-mode'), 10);
        if (window.__gyMusic && window.__gyMusic.setMode) window.__gyMusic.setMode(mode);
        applyModeUI();
      });
    }

    // 视觉特效
    for (var ef = 0; ef < effectInputs.length; ef++) {
      effectInputs[ef].addEventListener('change', function () {
        var name = this.getAttribute('data-effect');
        var on = this.checked;
        if (window.__gyFx && window.__gyFx.set) window.__gyFx.set(name, on);
        var patch = { effects: {} };
        patch.effects[name] = on;
        window.__gySettings.save(patch);
      });
    }

    // 看板娘
    if (live2dInput) {
      live2dInput.addEventListener('change', function () {
        var on = live2dInput.checked;
        window.__gySettings.save({ live2d: on });
        if (window.__gyWaifu && window.__gyWaifu.set) window.__gyWaifu.set(on);
        // 开启但未被加载（初始跳过）→ 提示刷新
        if (on && window.__gyWaifu && !window.__gyWaifu.getLoaded()) {
          showNotice('看板娘需刷新页面后加载');
        }
      });
    }

    // 音量（复用音乐播放器 createSlider 拖拽条：拖拽 + 键盘可调）
    // 懒绑定：createSlider 工厂由 main.js 暴露，须等 main.init 之后才存在；
    // 首次打开面板时（open）绑定，避免 init 时序导致工厂未定义而漏绑。
    var _volumeBound = false;
    function bindVolumeSlider() {
      if (_volumeBound) return;
      if (!volumeBar || !window.__gyCreateSlider) return;
      _volumeBound = true;
      window.__gyCreateSlider(volumeBar, function (pct, isDown) {
        if (pct < 0) return;
        if (window.__gyMusic && window.__gyMusic.setVolume) window.__gyMusic.setVolume(pct);
        updateSettingsVolumeUI(pct);
      }, function (key) {
        if (!window.__gyMusic || !window.__gyMusic.getVolume || !window.__gyMusic.setVolume) return;
        var cur = window.__gyMusic.getVolume();
        if (key === 'ArrowUp' || key === 'ArrowRight') window.__gyMusic.setVolume(Math.min(1, cur + 0.05));
        else if (key === 'ArrowDown' || key === 'ArrowLeft') window.__gyMusic.setVolume(Math.max(0, cur - 0.05));
        else if (key === 'Home') window.__gyMusic.setVolume(0);
        else if (key === 'End') window.__gyMusic.setVolume(1);
        updateSettingsVolumeUI(window.__gyMusic.getVolume());
      });
    }
  }

  // DOMContentLoaded 或直接执行（与 main.js 一致）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }
})();
