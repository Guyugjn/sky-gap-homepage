/* ============================================
   GY · 天空之隙 — 滚轮动量滚动
   与播放列表同一套算法与参数：惯性摩擦 + EWMA 平滑 + 单次增量限幅，
   滚一格只走一小段再缓动停下。供整页滚动与设置面板复用。

   只接管桌面鼠标滚轮：
   - 触摸端（pointer: coarse）完全交还原生惯性滚动
   - 触控板等精细滚动设备（单次 delta 很小）交还原生，原生本身就是平滑的
   - 键盘、滚动条拖拽、锚点跳转、scrollIntoView 一律不接管

   暴露：window.__gySmoothScroll = { attach(el, opts) }
   ============================================ */

(function () {
  'use strict';

  // 兜底参数：与 main.js 的 CONFIG.playlist 一致。
  // main.js 会把自己那份挂到 window.__gyScrollPhysics，运行期优先取它，保证两处手感同源。
  var FALLBACK = {
    friction: 0.92,
    wheelGain: 0.18,
    maxSpeed: 10,
    maxSpeedChange: 1.8,
    wheelSmoothAlpha: 0.55,
  };

  var IDLE_MS = 80;         // 超过该时长没有滚轮输入 → 进入惯性衰减
  var NATIVE_DELTA = 50;    // 换算后的 delta 小于该值视为精细滚动设备，交还原生
  var LINE_HEIGHT = 18;     // deltaMode=1（按行）时的换算高度

  function physics() {
    return window.__gyScrollPhysics || FALLBACK;
  }

  /** 覆盖参数与基准参数合并（只覆盖传入的字段，摩擦/平滑形状仍沿用播放列表那份） */
  function mergePhysics(overrides) {
    var base = physics();
    var out = {}, k;
    for (k in base) if (base.hasOwnProperty(k)) out[k] = base[k];
    for (k in overrides) if (overrides.hasOwnProperty(k)) out[k] = overrides[k];
    return out;
  }

  /**
   * 接管某个滚动容器的鼠标滚轮。
   * @param {Element} el 滚动容器（整页滚动传 document.scrollingElement）
   * @param {Object} [opts]
   *   listenTarget：滚轮监听挂在哪（整页滚动传 window），默认挂在 el 上
   *   isActive()：返回 false 时本次不接管（设置面板打开时页面让位给它）
   *   skip(e)：返回 true 时这次滚轮放行给原生（落在播放列表里等）
   *   physics：覆盖基准参数里的字段（步长要按容器量级配：整页 > 面板 > 播放列表）
   */
  function attach(el, opts) {
    opts = opts || {};
    if (!el) return null;

    var listenTarget = opts.listenTarget || el;
    var isActive = opts.isActive || function () { return true; };
    var skip = opts.skip || function () { return false; };
    var overrides = opts.physics || null;
    var merged = null;

    /** 本容器的物理参数：有覆盖就与基准参数合并；参数就绪后才缓存 */
    function localPhysics() {
      if (!overrides) return physics();
      if (!merged) {
        var m = mergePhysics(overrides);
        if (window.__gyScrollPhysics) merged = m;
        return m;
      }
      return merged;
    }

    var vel = 0;         // 当前速度（px/帧）
    var smooth = 0;      // EWMA 平滑后的滚轮量
    var lastInput = 0;   // 最后一次滚轮输入时间
    var raf = 0;

    function maxScroll() {
      var m = el.scrollHeight - el.clientHeight;
      return m > 0 ? m : 0;
    }

    function step() {
      var p = localPhysics();
      var cur = el.scrollTop;
      var now = performance.now();

      if (now - lastInput >= IDLE_MS) {
        if (Math.abs(vel) > 0.05) vel *= p.friction;
        else vel = 0;
      }

      if (Math.abs(vel) > 0.01) {
        var next = cur + vel;
        var max = maxScroll();
        if (next < 0) { next = 0; vel = 0; }
        else if (next > max) { next = max; vel = 0; }
        if (Math.abs(next - cur) > 0.01) el.scrollTop = next;
      }

      if (vel === 0) { raf = 0; return; }   // 停下即退出循环，不常驻占帧
      raf = requestAnimationFrame(step);
    }

    function stop() {
      vel = 0;
      smooth = 0;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    function onWheel(e) {
      if (!isActive() || skip(e)) return;
      if (e.defaultPrevented) return;                        // 已被别的接管器处理（如播放列表）
      if (e.ctrlKey || e.metaKey) return;                    // Ctrl/⌘ + 滚轮 = 浏览器缩放，必须放行
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // 横向手势
      if (maxScroll() <= 0) return;                          // 没得滚，交原生处理

      var delta = e.deltaY;
      if (e.deltaMode === 1) delta *= LINE_HEIGHT;
      else if (e.deltaMode === 2) delta *= el.clientHeight;
      if (Math.abs(delta) < NATIVE_DELTA) return;   // 精细滚动设备：原生更顺

      e.preventDefault();

      var p = localPhysics();
      smooth = p.wheelSmoothAlpha * delta + (1 - p.wheelSmoothAlpha) * smooth;
      var gain = smooth * p.wheelGain;
      if (gain > p.maxSpeedChange) gain = p.maxSpeedChange;
      if (gain < -p.maxSpeedChange) gain = -p.maxSpeedChange;
      vel += gain;
      if (vel > p.maxSpeed) vel = p.maxSpeed;
      if (vel < -p.maxSpeed) vel = -p.maxSpeed;

      lastInput = performance.now();
      if (!raf) raf = requestAnimationFrame(step);
    }

    if (!window.matchMedia('(pointer: coarse)').matches) {
      listenTarget.addEventListener('wheel', onWheel, { passive: false });
    }

    return {
      /** 立刻停住（容器内容被重建、面板关闭等场景） */
      stop: stop,
      destroy: function () {
        listenTarget.removeEventListener('wheel', onWheel);
        stop();
      }
    };
  }

  window.__gySmoothScroll = { attach: attach };
})();
