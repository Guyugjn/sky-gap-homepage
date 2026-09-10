/* ============================================
   GY · 天空之隙 — 星座星空模块
   每日运势 · 星环日轨 · 星空粒子 · 滚动浮现
   ============================================ */

(function () {
  'use strict';

  var _trailInited = false;
  var _canvasVisible = true;

  // 移动断点统一判定 — 实时查询 matchMedia，与 main.js 的 isMobileViewport 语义一致
  var _mobileMQ = window.matchMedia('(max-width: 768px)');
  function isMobileViewport() { return _mobileMQ.matches; }
  /** 触屏设备判定（手机/平板/触摸屏，含横屏手机 >768px）— 仅烟花爆发源等按触屏逻辑处理 */
  function isTouchCoarse() {
    return isMobileViewport() ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  // ==================== 星座数据 ====================

  const ZODIAC = [
    { name: 'aries',       nameCN: '白羊座', emoji: '♈', element: '火', planet: '火星',
      start: [3,21], end: [4,19],
      desc: '热情勇敢、直率坦诚，永远冲在最前面。白羊座是天生的开拓者，行动力爆棚，想到就去做。' },
    { name: 'taurus',      nameCN: '金牛座', emoji: '♉', element: '土', planet: '金星',
      start: [4,20], end: [5,20],
      desc: '稳重踏实、耐心坚韧，对美好事物有天然的感知力。金牛座慢热但长情，值得信赖依靠。' },
    { name: 'gemini',      nameCN: '双子座', emoji: '♊', element: '风', planet: '水星',
      start: [5,21], end: [6,20],
      desc: '聪明灵动、好奇心旺盛，能言善道又幽默风趣。双子座像一阵自由的风，永远活力满满。' },
    { name: 'cancer',      nameCN: '巨蟹座', emoji: '♋', element: '水', planet: '月亮',
      start: [6,21], end: [7,22],
      desc: '温柔细腻、情感丰富，像月光般润物无声。巨蟹座是十二星座中最会照顾人的温暖存在。' },
    { name: 'leo',         nameCN: '狮子座', emoji: '♌', element: '火', planet: '太阳',
      start: [7,23], end: [8,22],
      desc: '自信耀眼、慷慨大方，天生自带聚光灯。狮子座的舞台永远光芒四射，热情感染身边每个人。' },
    { name: 'virgo',       nameCN: '处女座', emoji: '♍', element: '土', planet: '水星',
      start: [8,23], end: [9,22],
      desc: '细致周全、逻辑清晰，追求完美的细节控。处女座的认真和可靠，让所有事情都井井有条。' },
    { name: 'libra',       nameCN: '天秤座', emoji: '♎', element: '风', planet: '金星',
      start: [9,23], end: [10,22],
      desc: '优雅平和、善于沟通，追求平衡与和谐。天秤座是天生社交家，审美在线，风度翩翩。' },
    { name: 'scorpio',     nameCN: '天蝎座', emoji: '♏', element: '水', planet: '冥王星',
      start: [10,23], end: [11,21],
      desc: '深邃敏锐、意志坚定，洞察力极强。天蝎座情感浓烈，一旦认定了就不会轻易放手。' },
    { name: 'sagittarius', nameCN: '射手座', emoji: '♐', element: '火', planet: '木星',
      start: [11,22], end: [12,21],
      desc: '乐观开朗、热爱自由，永远在探索的路上。射手座是行走的正能量发射器，心向远方。' },
    { name: 'capricorn',   nameCN: '摩羯座', emoji: '♑', element: '土', planet: '土星',
      start: [12,22], end: [1,19],
      desc: '沉稳务实、目标明确，一步一个脚印向上攀登。摩羯座是可靠的后盾和不达目的不罢休的实干家。' },
    { name: 'aquarius',    nameCN: '水瓶座', emoji: '♒', element: '风', planet: '天王星',
      start: [1,20], end: [2,18],
      desc: '独立创新、思维超前，脑子里装着一个未来世界。水瓶座特立独行，是真正的人间清醒。' },
    { name: 'pisces',      nameCN: '双鱼座', emoji: '♓', element: '水', planet: '海王星',
      start: [2,19], end: [3,20],
      desc: '浪漫梦幻、富有同理心，活在自己编织的诗意世界里。双鱼座是感性担当，温柔得让人融化。' }
  ];

  // ==================== 配置 ====================

  const BIRTHDAY = { month: 3, day: 22 }; // 你的生日（3月22日）

  const FORTUNE_API = 'https://v2.xxapi.cn/api/horoscope';

  // 页面可见性 — 共享 main.js 的 _pageVisible（全局 rAF hub 统一处理）

  // ==================== 工具函数 ====================

  /** 根据月日获取星座 */
  function getZodiacSign(month, day) {
    for (let i = 0; i < ZODIAC.length; i++) {
      const s = ZODIAC[i];
      const sm = s.start[0], sd = s.start[1];
      const em = s.end[0], ed = s.end[1];
      // 跨年星座（摩羯座 12.22-1.19）
      if (sm > em) {
        if ((month === sm && day >= sd) || (month === em && day <= ed)) return s;
      } else {
        if ((month === sm && day >= sd) || (month === em && day <= ed)) return s;
        // 检查是否在中间月份
        if (month > sm && month < em) return s;
      }
    }
    return ZODIAC[0]; // fallback
  }

  /** 格式化日期范围 */
  function formatDateRange(sign) {
    var sm = sign.start[0], sd = sign.start[1];
    var em = sign.end[0], ed = sign.end[1];
    return sm + '.' + sd + ' – ' + em + '.' + ed;
  }

  // ==================== 1. 每日运势（调用 API） ====================

  /** 当前运势对应的星座（默认为主人星座，访客查询后切换） */
  var currentFortuneSign = null;
  var currentFortuneTime = 'today';

  var TIME_NAMES = {
    today: '今日运势', week: '本周运势',
    month: '本月运势', year: '年度运势'
  };

  /** 指数数据项名称映射 */
  var ID_MAP = {
    all:    { fill: 'idx-all',    pct: 'idx-all-pct' },
    love:   { fill: 'idx-love',   pct: 'idx-love-pct' },
    work:   { fill: 'idx-work',   pct: 'idx-work-pct' },
    money:  { fill: 'idx-money',  pct: 'idx-money-pct' },
    health: { fill: 'idx-health', pct: 'idx-health-pct' }
  };

  /** 去除 API 返回文案末尾的"星座屋"字样（含各种混淆变体如星Q座Q屋、星^座^屋等） */
  function stripSource(text) {
    if (!text) return text;
    return text.replace(/[，,。\.\s]*星.?\s*座.?\s*屋(原创)?$/g, '').trim();
  }

  /** 渲染运势数据 */
  function renderFortune(data) {
    var sign = currentFortuneSign;
    document.getElementById('fortune-title').textContent =
      sign.emoji + ' ' + sign.nameCN + ' · ' + (TIME_NAMES[currentFortuneTime] || currentFortuneTime);
    /* Twemoji 重新解析 — 运势标题中的星座符号 */
    if (window.twemoji) window.twemoji.parse(document.getElementById('fortune-title'));

    // 指数条
    var indexData = data.index || {};
    Object.keys(ID_MAP).forEach(function (key) {
      var refs = ID_MAP[key];
      var rawPct = indexData[key];
      var pct = (typeof rawPct === 'number' ? rawPct + '%' : rawPct) || '0%';
      var fillEl = document.getElementById(refs.fill);
      var pctEl = document.getElementById(refs.pct);
      if (fillEl) fillEl.style.width = pct;
      if (pctEl) pctEl.textContent = pct;
    });

    // 星座信息
    var elElement = document.getElementById('sign-info-element');
    var secEl = document.getElementById('sign-info-secondary');
    var ELEM_EMOJI = { '火': '🔥', '土': '🪨', '风': '🌬️', '水': '💧' };
    var PLANET_EMOJI = { '火星': '♂️', '金星': '♀️', '水星': '☿', '月亮': '☾', '太阳': '☉', '冥王星': '♇', '木星': '♃', '土星': '♄', '天王星': '♅', '海王星': '♆' };
    if (elElement) {
      var emoji = ELEM_EMOJI[sign.element] || '';
      elElement.textContent = (emoji ? emoji + ' ' : '') + sign.element + '象';
    }
    if (secEl) {
      var pEmoji = PLANET_EMOJI[sign.planet] || '';
      secEl.textContent = (pEmoji ? pEmoji + ' ' : '') + sign.planet + ' · ' + formatDateRange(sign);
    }
    // Twemoji 解析星座信息中的元素/行星 emoji
    if (window.twemoji) {
      if (elElement) window.twemoji.parse(elElement);
      if (secEl) window.twemoji.parse(secEl);
    }

    // 概述
    var summary = (data.fortunetext && data.fortunetext.all) || data.shortcomment || '';
    document.getElementById('fortune-summary').textContent = stripSource(summary);

    // 幸运信息
    document.getElementById('lucky-color').textContent = data.luckycolor || '—';
    document.getElementById('lucky-number').textContent = data.luckynumber || '—';
    document.getElementById('lucky-sign').textContent = data.luckyconstellation || '—';

    // 宜忌
    var todo = data.todo || {};
    document.getElementById('todo-yi').textContent = (todo && todo.yi) || '—';
    document.getElementById('todo-ji').textContent = (todo && todo.ji) || '—';

    // 详细运势 — 用 DOM 构建而非 innerHTML 拼接，防第三方 API 文本注入 HTML
    var ft = data.fortunetext || {};
    var detailEl = document.getElementById('fortune-detail-text');
    var detailParts = [];
    function appendDetail(label, text) {
      if (!text || text.length <= 2) return;
      var p = document.createElement('p');
      var strong = document.createElement('strong');
      strong.textContent = label;
      p.appendChild(strong);
      p.appendChild(document.createTextNode(stripSource(text)));
      detailParts.push(p);
    }
    appendDetail('🩺 健康：', ft.health);
    appendDetail('💕 爱情：', ft.love);
    appendDetail('💼 工作：', ft.work);
    appendDetail('💰 财富：', ft.money);
    detailEl.textContent = '';
    detailParts.forEach(function (p) { detailEl.appendChild(p); });
    /* Twemoji 重新解析 — 运势详情中的动态 emoji */
    if (window.twemoji) window.twemoji.parse(document.getElementById('fortune-detail-text'));
  }

  /** 显示加载中 */
  function showFortuneLoading() {
    document.getElementById('fortune-loading').style.display = 'block';
    document.getElementById('fortune-error').style.display = 'none';
  }

  /** 显示错误 */
  function showFortuneError() {
    document.getElementById('fortune-loading').style.display = 'none';
    document.getElementById('fortune-error').style.display = 'block';
    bindFortuneRetry();
  }

  // 错误提示中的"重试"按钮：点击重新加载运势（按钮只绑定一次）
  function bindFortuneRetry() {
    var btn = document.getElementById('fortune-retry-btn');
    if (!btn || btn._retryBound) return;
    btn._retryBound = true;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      loadFortune();
    });
  }

  /** 加载运势（含竞态保护 + 超时兜底，无缓存） */
  var _lastFortuneController = null;
  var _lastFortuneTimer = null;
  var _fortuneReqId = 0; // 请求序号 — 竞态守卫：已过期的旧请求结果一律丢弃

  function loadFortune() {
    showFortuneLoading();

    var reqId = ++_fortuneReqId;

    // 取消上一个未完成的请求
    if (_lastFortuneController) {
      _lastFortuneController.abort();
    }
    if (_lastFortuneTimer) {
      clearTimeout(_lastFortuneTimer);
      _lastFortuneTimer = null;
    }

    var controller = new AbortController();
    _lastFortuneController = controller;

    // 第三方 API 超时兜底（10s）— 防止接口挂起导致永久 loading
    _lastFortuneTimer = setTimeout(function () {
      controller.abort();
    }, 10000);

    var url = FORTUNE_API + '?type=' + encodeURIComponent(currentFortuneSign.name)
      + '&time=' + encodeURIComponent(currentFortuneTime);

    fetch(url, { signal: controller.signal })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (reqId !== _fortuneReqId) return; // 旧请求结果丢弃（竞态守卫）
        if (_lastFortuneTimer) { clearTimeout(_lastFortuneTimer); _lastFortuneTimer = null; }
        document.getElementById('fortune-loading').style.display = 'none';
        document.getElementById('fortune-error').style.display = 'none';
        if (json.code === 200 && json.data) {
          renderFortune(json.data);
        } else {
          showFortuneError();
        }
      })
      .catch(function (err) {
        // 超时（本请求超时 abort）→ 显示错误；被新请求取消 → 静默丢弃
        if (err.name === 'AbortError' && reqId === _fortuneReqId) {
          if (_lastFortuneTimer) { clearTimeout(_lastFortuneTimer); _lastFortuneTimer = null; }
          showFortuneError();
          return;
        }
        if (err.name === 'AbortError') return; // 被新请求取消
        if (reqId !== _fortuneReqId) return;
        if (_lastFortuneTimer) { clearTimeout(_lastFortuneTimer); _lastFortuneTimer = null; }
        showFortuneError();
      });
  }

  /** 切换运势的星座（外部调用） */
  function setFortuneSign(sign) {
    currentFortuneSign = sign;
    currentFortuneTime = 'today';
    // 重置 tab 激活状态（同步 aria-pressed；用 for 循环兼容无 NodeList.forEach 的旧浏览器）
    var tabs = document.querySelectorAll('.fortune-tab');
    for (var tf = 0; tf < tabs.length; tf++) {
      tabs[tf].classList.remove('active');
      tabs[tf].setAttribute('aria-pressed', 'false');
    }
    var todayTab = document.querySelector('.fortune-tab[data-time="today"]');
    if (todayTab) {
      todayTab.classList.add('active');
      todayTab.setAttribute('aria-pressed', 'true');
    }
    loadFortune();
  }

  function initFortune() {
    var mySign = getZodiacSign(BIRTHDAY.month, BIRTHDAY.day);
    currentFortuneSign = mySign;

    // Tab 切换（用普通函数 + this，兼容无 NodeList.forEach 的旧浏览器）
    var tabs = document.querySelectorAll('.fortune-tab');
    for (var tf = 0; tf < tabs.length; tf++) {
      tabs[tf].addEventListener('click', function () {
        for (var tj = 0; tj < tabs.length; tj++) {
          tabs[tj].classList.remove('active');
          tabs[tj].setAttribute('aria-pressed', 'false');
        }
        this.classList.add('active');
        this.setAttribute('aria-pressed', 'true');
        currentFortuneTime = this.dataset.time;
        loadFortune();
      });
    }

    // 首次加载
    loadFortune();
  }

  // ==================== 2A. 星轨滑星 — 统一的生日选择器（白天/夜间共用） ====================

  /** 星轨滑星：双弧星轨——内弧 12 月节点 / 外弧日期星点，星核沿弧滑选生日。
   *  桌面/手机：按下即选 + 滑动连续选取（两条独立轨道带，维度锁定不误判）；
   *  中心实时预览 月日·星座；选齐后点「确认选择」揭晓（星座发光 + 庆祝粒子 + 运势联动）。
   *  换月立即重建日期弧（点击带画线/星点亮起动效，滑动即时跟手）；无自动复位。 */

  function initStarTrail() {
    if (_trailInited) return;
    var deck = document.getElementById('tarot-deck');
    var svg = document.getElementById('star-trail-svg');
    if (!deck || !svg) return;

    var hintEl = document.getElementById('tarot-hint');
    var oracleEl = document.getElementById('tarot-oracle');
    var confirmBtn = document.getElementById('tarot-confirm');
    var resultEl = document.getElementById('orbit-result');
    if (!hintEl || !confirmBtn) return;

    var NS = 'http://www.w3.org/2000/svg';
    var VB_W = 640, VB_H = 344;        // viewBox（内容域实际只到 y≈336，344 已含余量）
    var CX = 320, CY = 330;            // 公共弧心（上半圆：左端 1 → 右端 N）
    var R_MONTH = 150;                 // 内弧：月份弧半径（12 节点均分）
    var R_DAY = 235;                   // 外弧：日期弧半径（星点随当月天数重建）
    var DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 平年（2/29 不生成点，顺延）

    /** 稳定伪随机（0~1），用于星点大小/明暗错落 */
    function hash01(seed) {
      var x = Math.sin(seed) * 43758.5453;
      return x - Math.floor(x);
    }
    /** 月份 m(1..12) → 内弧坐标（12 节点均分布满上半圆） */
    function monthToPos(m) {
      var t = (m - 1) / 11;
      var a = Math.PI * (1 - t);
      return { x: CX + R_MONTH * Math.cos(a), y: CY - R_MONTH * Math.sin(a) };
    }
    /** 弧上点（viewBox 坐标） → 最近月份节点 */
    function posToMonth(vx, vy) {
      var a = Math.atan2(CY - vy, vx - CX);
      if (a < 0) a = 0;
      if (a > Math.PI) a = Math.PI;
      var m = Math.round((1 - a / Math.PI) * 11) + 1;
      return Math.max(1, Math.min(12, m));
    }
    /** 日 d(1..n) → 外弧坐标（当月 n 天均分布满上半圆） */
    function dayToPos(d, n) {
      var t = (d - 1) / Math.max(1, n - 1);
      var a = Math.PI * (1 - t);
      return { x: CX + R_DAY * Math.cos(a), y: CY - R_DAY * Math.sin(a) };
    }
    /** 日 d(1..n) → 外弧外侧日期数字标签位置（弧线外 18 单位径向偏移） */
    function dayLabelPos(d, n) {
      var t = (d - 1) / Math.max(1, n - 1);
      var a = Math.PI * (1 - t);
      return { x: CX + (R_DAY + 18) * Math.cos(a), y: CY - (R_DAY + 18) * Math.sin(a) };
    }
    /** 弧上点（viewBox 坐标） → 当月日序号（1..n） */
    function posToDay(vx, vy, n) {
      var a = Math.atan2(CY - vy, vx - CX);
      if (a < 0) a = 0;
      if (a > Math.PI) a = Math.PI;
      var d = Math.round((1 - a / Math.PI) * (n - 1)) + 1;
      return Math.max(1, Math.min(n, d));
    }
    /** 几何判定：点是否落在任一弧的命中带内（viewBox 单位）。
     *  仅用于旧版 Safari（SVG 子元素 touch-action 不生效）的「弧内阻止滚动」兜底；
     *  常规命中走透明轨道元素 .trail-arc-hit（元素级 touch-action: none）。 */
    var ARC_SNAP = 24;
    function isNearArc(vx, vy) {
      var dx = vx - CX, dy = CY - vy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      return Math.abs(dist - R_MONTH) <= ARC_SNAP || Math.abs(dist - R_DAY) <= ARC_SNAP;
    }

    /* ---- 构建 SVG ---- */
    var frag = document.createDocumentFragment();

    // 星核亮金柔光渐变
    var defs = document.createElementNS(NS, 'defs');
    defs.innerHTML =
      '<radialGradient id="trail-core-g" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#FFFDF4" stop-opacity="1"/>' +
      '<stop offset="35%" stop-color="#FFE9B0" stop-opacity="0.9"/>' +
      '<stop offset="100%" stop-color="#FFD98A" stop-opacity="0"/>' +
      '</radialGradient>';
    frag.appendChild(defs);

    // ── 内弧：月份弧（引导线 + 12 节点 + 标签，静态构建） ──
    var monthArc = document.createElementNS(NS, 'g');
    monthArc.setAttribute('class', 'trail-month-arc');
    // 引导弧线：提示内弧是「可滑动的月份轨道」
    var monthGuide = document.createElementNS(NS, 'path');
    monthGuide.setAttribute('d', 'M' + (CX - R_MONTH) + ',' + CY +
      ' A' + R_MONTH + ',' + R_MONTH + ' 0 0 1 ' + (CX + R_MONTH) + ',' + CY);
    monthGuide.setAttribute('class', 'trail-month-guide');
    monthArc.appendChild(monthGuide);
    var monthNodes = [], monthLabels = [];
    for (var mIdx = 1; mIdx <= 12; mIdx++) {
      var mp = monthToPos(mIdx);
      var mc = document.createElementNS(NS, 'circle');
      mc.setAttribute('cx', mp.x.toFixed(2));
      mc.setAttribute('cy', mp.y.toFixed(2));
      mc.setAttribute('r', '4');
      mc.setAttribute('class', 'month-node');
      mc.setAttribute('fill', '#B7CFE2');
      mc.dataset.month = mIdx;
      monthArc.appendChild(mc);
      monthNodes.push(mc);

      var lp = { x: CX + (R_MONTH + 26) * Math.cos(Math.PI * (1 - (mIdx - 1) / 11)), y: CY - (R_MONTH + 26) * Math.sin(Math.PI * (1 - (mIdx - 1) / 11)) };
      var ml = document.createElementNS(NS, 'text');
      ml.setAttribute('x', lp.x.toFixed(2));
      ml.setAttribute('y', lp.y.toFixed(2));
      ml.setAttribute('class', 'month-label');
      ml.setAttribute('text-anchor', 'middle');
      ml.setAttribute('dominant-baseline', 'middle');
      ml.textContent = mIdx + '月';
      ml.dataset.month = mIdx;
      monthArc.appendChild(ml);
      monthLabels.push(ml);
    }
    frag.appendChild(monthArc);

    // ── 外弧：日期弧（星点，随所选月份重建） ──
    var dayArc = document.createElementNS(NS, 'g');
    dayArc.setAttribute('class', 'trail-day-arc');
    frag.appendChild(dayArc);

    // ── 两条独立的弧形滑动轨道（透明命中带，顶层绘制，不与任何弧内容绑定——
    //    点在/滑在某条轨道带内即锁定该弧维度，直到松手；两条轨道互不干扰） ──
    function makeArcHit(arc, radius) {
      var hit = document.createElementNS(NS, 'path');
      hit.setAttribute('d', 'M' + (CX - radius) + ',' + CY +
        ' A' + radius + ',' + radius + ' 0 0 1 ' + (CX + radius) + ',' + CY);
      hit.setAttribute('class', 'trail-arc-hit trail-arc-hit--' + arc);
      hit.setAttribute('data-arc', arc);
      return hit;
    }
    frag.appendChild(makeArcHit('month', R_MONTH));
    frag.appendChild(makeArcHit('day', R_DAY));

    // 星核（拖动选择器，顶层，可跨弧吸附）
    var coreGroup = document.createElementNS(NS, 'g');
    coreGroup.setAttribute('class', 'trail-core-group');
    var coreHalo = document.createElementNS(NS, 'circle');
    coreHalo.setAttribute('r', '17');
    coreHalo.setAttribute('class', 'trail-core-halo');
    coreHalo.setAttribute('fill', 'url(#trail-core-g)');
    var coreInner = document.createElementNS(NS, 'circle');
    coreInner.setAttribute('r', '6');
    coreInner.setAttribute('class', 'trail-core-inner');
    coreInner.setAttribute('fill', '#FFFFFF');
    var coreDot = document.createElementNS(NS, 'circle');
    coreDot.setAttribute('r', '2.4');
    coreDot.setAttribute('fill', '#F6C660');
    coreGroup.appendChild(coreHalo);
    coreGroup.appendChild(coreInner);
    coreGroup.appendChild(coreDot);
    frag.appendChild(coreGroup);

    /** 今天月/日（仅用于「今日点」标记：默认月 = 今天月时显示） */
    var todayMonth = (new Date()).getMonth() + 1;
    var todayDay = (new Date()).getDate();
    var _selMonth = 1;       // 默认选中 1 月（金色光点/月份高亮初始落位）
    var starDay = [];    // 当月星点（索引 = day-1，随重建刷新）
    var dayLabels = [];  // 当月日期数字（索引 = day-1，随重建刷新）

    function setCoreTo(x, y) {
      // CSS transform + transition：非拖拽状态下星核平滑飞行（拖拽中 transition 被 .dragging 禁用）
      coreGroup.style.transform = 'translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px)';
    }

    /** 当月天数（2 月按闰年动态判断，闰年可选中 2/29） */
    function _selDays() {
      if (_selMonth !== 2) return DAYS[_selMonth - 1];
      var y = new Date().getFullYear();
      var isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      return isLeap ? 29 : 28;
    }

    /**
     * 重建日期弧（外弧）— 一条完整细线 + 星点 + 今日点。
     * animate=true：日期数字从弧线上沿径向依次升起（松手收尾等一次性切换）；
     * animate=false：即时显示（按下即选，无动画）。
     * 防抖：距上一次「动画重建」<350ms 的动画请求自动降级为即时替换（快速连切避免动画重放）。
     */
    var _lastAnim = 0;
    function buildDayArc(animate) {
      var now = Date.now();
      if (animate) {
        if (now - _lastAnim < 350) animate = false;
        else _lastAnim = now;
      }
      dayArc.textContent = '';
      starDay = [];
      dayLabels = [];
      var n = _selDays();
      dayArc.classList.toggle('no-anim', !animate);

      // 一条完整的日期弧线（纯色细线，始终完整可见；无动画，直接显示）
      var p0d = dayToPos(1, n), p1d = dayToPos(n, n);
      var arcLine = document.createElementNS(NS, 'path');
      arcLine.setAttribute('d', 'M' + p0d.x.toFixed(2) + ',' + p0d.y.toFixed(2) +
        ' A' + R_DAY + ',' + R_DAY + ' 0 0 1 ' + p1d.x.toFixed(2) + ',' + p1d.y.toFixed(2));
      arcLine.setAttribute('class', 'trail-day-line');
      dayArc.appendChild(arcLine);

      // 全部日期星点 — 常显（不随选中状态淡出；换月时沿弧依次点亮）
      for (var d = 1; d <= n; d++) {
        var pos = dayToPos(d, n);
        var sc = document.createElementNS(NS, 'circle');
        sc.setAttribute('cx', pos.x.toFixed(2));
        sc.setAttribute('cy', pos.y.toFixed(2));
        sc.setAttribute('r', (1.5 + hash01(_selMonth * 100 + d) * 0.9).toFixed(2));
        sc.setAttribute('class', 'trail-star');
        sc.setAttribute('fill', '#FFFFFF');
        sc.setAttribute('opacity', (0.7 + hash01(_selMonth * 100 + d * 7 + 3) * 0.3).toFixed(2));
        sc.dataset.day = d;
        if (animate) sc.style.animationDelay = ((d - 1) * 12) + 'ms';
        dayArc.appendChild(sc);
        starDay.push(sc);

        // 日期数字（弧线外侧；换月时从弧线上沿径向依次升起，选中日金色高亮）
        var lp = dayLabelPos(d, n);
        var dl = document.createElementNS(NS, 'text');
        dl.setAttribute('x', lp.x.toFixed(2));
        dl.setAttribute('y', lp.y.toFixed(2));
        dl.setAttribute('class', 'trail-day-label');
        dl.setAttribute('text-anchor', 'middle');
        dl.setAttribute('dominant-baseline', 'middle');
        dl.textContent = d;
        dl.dataset.day = d;
        if (animate) {
          // 动画起点 = 弧线上（标签位沿半径内移 18 单位），最终径向飘出到标签位
          dl.style.setProperty('--rise-x', ((lp.x - pos.x) * -1).toFixed(2) + 'px');
          dl.style.setProperty('--rise-y', ((lp.y - pos.y) * -1).toFixed(2) + 'px');
          dl.style.animationDelay = ((d - 1) * 12) + 'ms';
        }
        dayArc.appendChild(dl);
        dayLabels.push(dl);
      }

      // 今日点：仅当当前月 = 今天月时显示
      if (_selMonth === todayMonth) {
        var tpos = dayToPos(todayDay, n);
        var tc = document.createElementNS(NS, 'circle');
        tc.setAttribute('cx', tpos.x.toFixed(2));
        tc.setAttribute('cy', tpos.y.toFixed(2));
        tc.setAttribute('r', '3.4');
        tc.setAttribute('class', 'trail-today');
        tc.setAttribute('fill', '#FFF3CE');
        dayArc.appendChild(tc);
      }
    }

    // 初始：默认选中 1 月（金色光点落在 1 月节点），日期弧显示 1 月
    buildDayArc(true);
    // 先落位星核（首渲染无过渡——避免从 SVG 原点 (0,0) 飞入 1 月）
    var initCore = monthToPos(1);
    setCoreTo(initCore.x, initCore.y);
    svg.appendChild(frag);

    /* ---- 状态与交互 ---- */
    var _selDay = 0;            // 当前选中的日序号（0=未选）
    var _activeStar = null;     // 选中星点元素
    var _activeLabel = null;    // 选中日期数字元素
    var _activeMonthNode = null; // 选中月份节点元素
    var _dragging = false;
    var _downX = 0, _downY = 0;
    var _pending = null;        // pointermove 排队 { arc:'month'|'day', x, y }（rAF 合并，每帧应用一次）
    var _dayArcDirty = false;   // 滑动换月中：日期弧滞后于 _selMonth，松手时统一重建

    function clearStarHighlight() {
      if (_activeStar) { _activeStar.classList.remove('active'); _activeStar = null; }
      if (_activeLabel) { _activeLabel.classList.remove('active'); _activeLabel = null; }
    }
    function clearMonthHighlight() {
      if (_activeMonthNode) { _activeMonthNode.classList.remove('active'); _activeMonthNode = null; }
      for (var i = 0; i < monthLabels.length; i++) monthLabels[i].classList.remove('active');
    }

    /* ---- 初始默认态：金色光点与月份高亮落在 1 月 ---- */
    (function defaultMonth() {
      var node = monthNodes[0];
      node.classList.add('active');
      _activeMonthNode = node;
      monthLabels[0].classList.add('active');
      var mp = monthToPos(1);
      setCoreTo(mp.x, mp.y);
      hintEl.textContent = '1月 · 沿外弧滑选日期';
    })();

    /** 应用选中月份（换月推迟日期弧更新、星核吸附月份节点）
     *  mode='start'（按下即选）：日期数字立即显示（无动画），月节点弹跳；
     *  mode='move'（滑动跟随）：日期弧推迟（避免闪烁），月节点不弹跳；
     *  松手（endDrag）时统一重建并播放数字升起动画。 */
    function updateMonth(m, mode) {
      if (m === _selMonth) {
        /* 仍在当前月节点：仅把星核吸附过去（不改动日期选择） */
        var mp0 = monthToPos(m);
        setCoreTo(mp0.x, mp0.y);
        return;
      }
      _selMonth = m;
      _selDay = 0;
      orbitState.month = m;
      orbitState.day = 0;
      orbitState.activeSignIndex = -1;
      _updateGlow(-1, 0);   // 换月度选日取消：清掉上次选中星座的发光，避免残留
      if (mode === 'start') {
        _dayArcDirty = false;
        buildDayArc(false);   // 开始：立即显示，无动画
      } else {
        _dayArcDirty = true;  // 滑动中：日期弧保持不动，松手时统一更新
      }
      clearStarHighlight();
      clearMonthHighlight();
      monthArc.classList.toggle('no-anim', mode !== 'start');
      var node = monthNodes[m - 1];
      node.classList.add('active');
      _activeMonthNode = node;
      monthLabels[m - 1].classList.add('active');
      var mp = monthToPos(m);
      setCoreTo(mp.x, mp.y);
      spawnRing(mp.x, mp.y, monthArc);
      hintEl.textContent = m + '月 · 沿外弧滑选日期';
      oracleEl.textContent = '';
      oracleEl.classList.remove('pop');
      if (confirmBtn.style.display !== 'none') confirmBtn.style.display = 'none';
    }

    /** 选中涟漪 — 金环从选中点扩散消散（滑动连选时连续轻闪，animationend 自清理）
     *  parent：涟漪所属分组（日期弧/月份弧），随各自弧的语义重建/清空 */
    function spawnRing(x, y, parent) {
      var ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', x.toFixed(2));
      ring.setAttribute('cy', y.toFixed(2));
      ring.setAttribute('r', '7');
      ring.setAttribute('class', 'trail-ring');
      ring.addEventListener('animationend', function () { ring.remove(); });
      // 兜底：动画被取消（父级隐藏/移除等）时 animationend 不触发，定时清理防残留
      setTimeout(function () { if (ring.parentNode) ring.remove(); }, 900);
      (parent || dayArc).appendChild(ring);
    }

    /** 应用选中日期（更新星核/星点/星座图标/提示/星座发光/确认按钮） */
    function updateDay(d) {
      if (d === _selDay) return;
      _selDay = d;
      orbitState.month = _selMonth;
      orbitState.day = d;
      var sign = getZodiacSign(_selMonth, d);
      var idx = findConstellationIndex(sign.nameCN);
      orbitState.activeSignIndex = idx;

      var pos = dayToPos(d, _selDays());
      setCoreTo(pos.x, pos.y);
      spawnRing(pos.x, pos.y, dayArc);
      if (_activeStar) _activeStar.classList.remove('active');
      _activeStar = starDay[d - 1];
      if (_activeStar) _activeStar.classList.add('active');
      // 日期数字高亮同步
      if (_activeLabel) _activeLabel.classList.remove('active');
      _activeLabel = dayLabels[d - 1] || null;
      if (_activeLabel) _activeLabel.classList.add('active');

      hintEl.textContent = _selMonth + '月' + d + '日 · ' + sign.nameCN;
      if (oracleEl) {
        oracleEl.textContent = sign.emoji || '';
        if (window.twemoji) window.twemoji.parse(oracleEl);
        oracleEl.classList.remove('pop');
        void oracleEl.offsetHeight;
        oracleEl.classList.add('pop');
      }
      _updateGlow(idx, 2);

      // 显示确认按钮（强制回流，确保从 display:none 切换后动画重触发）
      if (!orbitState.confirmed && confirmBtn.style.display === 'none') {
        confirmBtn.style.display = '';
        confirmBtn.style.animation = 'none';
        void confirmBtn.offsetHeight;
        confirmBtn.style.animation = '';
      }
    }

    function clientToVb(clientX, clientY) {
      var rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / rect.width * VB_W,
        y: (clientY - rect.top) / rect.height * VB_H
      };
    }
    /** 按弧上落点应用维度（arc: 'month'=内弧月份 / 'day'=外弧日期，与 data-arc 一致）
     *  mode：'start'=按下即选（一次性）；'move'=滑动连续选取 */
    function applyPick(arc, vb, mode) {
      if (arc === 'month') updateMonth(posToMonth(vb.x, vb.y), mode);
      else updateDay(posToDay(vb.x, vb.y, _selDays()));
    }
    /** pointermove 排队落点 — 注册到全局 rAF，一帧合并一次 */
    function flushPending() {
      if (!_pending) return;
      var p = _pending;
      _pending = null;
      applyPick(p.arc, { x: p.x, y: p.y }, 'move');
    }
    if (typeof window._registerTick === 'function') window._registerTick(flushPending);

    /* ---- 交互：两条独立滑轨，桌面/手机均支持按下即选 + 滑动连续选取 ----
       按下点在任一条轨道带（.trail-arc-hit）内 → 锁定该弧（_dragArc）直到松手；
       轨道带外 → 不拦截（触摸交给页面滚动）。维度切换只能通过换手按下另一条弧。 */
    var _dragArc = null;         // 当前锁定的轨道：'month' | 'day' | null

    /** 事件目标向上找轨道命中元素（SVG 内星点/节点都绘制在轨道之下，通常 target 即轨道） */
    function arcFromTarget(t) {
      var el = t && t.nodeType === 1 ? t : null;
      while (el) {
        if (el.classList && el.classList.contains('trail-arc-hit')) return el.dataset.arc || null;
        el = el.parentNode;
      }
      return null;
    }

    svg.addEventListener('pointerdown', function (e) {
      if (orbitState.confirmed) return;
      var arc = arcFromTarget(e.target);
      if (!arc) return; // 轨道外：不拦截（触摸留给页面滚动）
      _downX = e.clientX;
      _downY = e.clientY;
      _dragArc = arc;
      _dragging = true;
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
      var vb = clientToVb(e.clientX, e.clientY);
      applyPick(arc, vb, 'start');
      coreGroup.classList.add('dragging');
    });
    svg.addEventListener('pointermove', function (e) {
      if (!_dragging || orbitState.confirmed) return;
      if (Math.abs(e.clientX - _downX) + Math.abs(e.clientY - _downY) < 4) return;
      var vb = clientToVb(e.clientX, e.clientY);
      _pending = { arc: _dragArc, x: vb.x, y: vb.y };
    });
    svg.addEventListener('pointerup', function (e) {
      endDrag();
    });
    function endDrag() {
      _dragArc = null;
      _dragging = false;
      coreGroup.classList.remove('dragging');
      // 应用可能残留的最后落点（松手前最后一帧的 pointermove 尚未被 rAF 消费）
      if (_pending) {
        var p = _pending;
        _pending = null;
        applyPick(p.arc, { x: p.x, y: p.y }, 'move');
      }
      // 滑动换月收尾：松手后把日期弧更新到最终选中月，播放数字升起动画（开始/滑动中无动画）
      if (_dayArcDirty) {
        _dayArcDirty = false;
        buildDayArc(true);
      }
    }
    svg.addEventListener('pointercancel', endDrag);

    // 旧版 Safari 兜底：SVG 子元素 touch-action 不生效，用 touchstart preventDefault
    // 阻止「轨道带内起手的触摸」触发页面滚动（轨道带外不阻止，页面可正常滚动）
    svg.addEventListener('touchstart', function (e) {
      if (orbitState.confirmed) return;
      var t = e.touches[0];
      var vb = clientToVb(t.clientX, t.clientY);
      if (isNearArc(vb.x, vb.y)) e.preventDefault();
    }, { passive: false });

    /* ---- 揭晓 ---- */
    function doConfirm() {
      if (_selDay <= 0) return;
      orbitState.confirmed = true;
      var sign = getZodiacSign(_selMonth, _selDay);
      orbitState.activeSignIndex = findConstellationIndex(sign.nameCN);
      _updateGlow(orbitState.activeSignIndex, 3);
      // 上一个星座的退场若还没走完，立即收尾，避免与新揭晓的描画互相打架
      var confCo = CONSTELLATIONS[orbitState.activeSignIndex];
      if (confCo) { confCo._dismissPhase = 0; confCo._dismissFade = 0; confCo._revealHold = null; }
      if (typeof window._spawnCelebrate === 'function') window._spawnCelebrate(orbitState.activeSignIndex);
      coreGroup.classList.add('confirmed');
      coreInner.setAttribute('fill', '#F6C660');
      fireStarBeam(true);
      confirmBtn.style.display = 'none';
      hintEl.style.opacity = '0';
      oracleEl.textContent = '';
      resultEl.style.display = '';
      resultEl.innerHTML =
        '<button class="orbit-redo" id="orbit-redo" type="button">重新选择</button>';
      if (window.twemoji) window.twemoji.parse(resultEl);
      if (typeof setFortuneSign === 'function') setFortuneSign(sign);
    }
    confirmBtn.addEventListener('click', doConfirm);

    /* ---- 引导光束：鼠标进入「确认区」（确认按钮 + 其四周留白）即从按钮射向所选星座，
       并一直连着不自行消散，直到点下确认（转金光闪一次）或离开确认区；键盘 focus/blur 同理 ---- */
    var actionsEl = document.getElementById('tarot-actions');
    if (actionsEl) {
      actionsEl.addEventListener('mouseenter', function () {
        if (!orbitState.confirmed) fireStarBeam(false, true);
      });
      actionsEl.addEventListener('mouseleave', function () {
        // 揭晓后（按钮已隐藏）的金光走自己的闪灭节奏，不受指针移出影响
        if (orbitState.confirmed) return;
        if (typeof window._clearStarBeam === 'function') window._clearStarBeam();
      });
    }
    confirmBtn.addEventListener('focus', function () {
      fireStarBeam(false, true);
    });
    confirmBtn.addEventListener('blur', function () {
      // 指针仍停在确认区内：保留待机光束，交给 mouseleave 收尾
      if (actionsEl && actionsEl.matches(':hover')) return;
      if (typeof window._clearStarBeam === 'function') window._clearStarBeam();
    });

    /* ---- 重置（仅由「重新选择」按钮 / 日夜切换触发，无自动复位）
       exitAnim = 来自「重新选择」：点亮中的星座按入场逆序退场——连线从最后一条起逐条回缩，星点辉光随后落尽 ---- */
    function resetState(exitAnim) {
      // 先记下揭晓中的星座再清状态——退场凭这两个标记继续跑完
      var litIndex = exitAnim ? orbitState.activeSignIndex : -1;
      if (litIndex >= 0 && CONSTELLATIONS[litIndex] && (CONSTELLATIONS[litIndex].glowLevel || 0) > 0) {
        CONSTELLATIONS[litIndex]._dismissPhase = 1; // 1 = 连线逆序回缩（星点保持点亮）
        CONSTELLATIONS[litIndex]._dismissGlow = CONSTELLATIONS[litIndex].glowLevel;
        CONSTELLATIONS[litIndex]._dismissFade = 0;
        CONSTELLATIONS[litIndex]._revealHold = null;
      }
      _selMonth = 1;          // 重置回默认态：1 月（与初始一致）
      _selDay = 0;
      orbitState.month = 0;
      orbitState.day = 0;
      orbitState.activeSignIndex = -1;
      orbitState.confirmed = false;
      _updateGlow(-1, 0);
      clearStarHighlight();
      clearMonthHighlight();
      monthArc.classList.remove('no-anim');
      coreGroup.classList.remove('confirmed');
      coreInner.setAttribute('fill', '#FFFFFF');
      buildDayArc(true);
      var node = monthNodes[0];
      node.classList.add('active');
      _activeMonthNode = node;
      monthLabels[0].classList.add('active');
      var mp = monthToPos(1);
      setCoreTo(mp.x, mp.y);
      confirmBtn.style.display = 'none';
      resultEl.style.display = 'none';
      resultEl.innerHTML = '';
      hintEl.style.opacity = '';
      hintEl.textContent = '1月 · 沿外弧滑选日期';
      oracleEl.textContent = '';
      oracleEl.classList.remove('pop');
      // 按钮隐藏后不会派发 mouseleave，主动清掉残留光束
      if (typeof window._clearStarBeam === 'function') window._clearStarBeam();
    }
    // 暴露供主题切换/调用方使用（沿用原契约名）
    window._resetTarot = resetState;

    /* ---- 重新选择按钮 ---- */
    resultEl.addEventListener('click', function (e) {
      if (e.target && (e.target.id === 'orbit-redo' || (e.target.parentNode && e.target.parentNode.id === 'orbit-redo'))) resetState(true);
    });

    /* ---- 初始提示 8s 后渐隐 ---- */
    setTimeout(function () {
      if (!_selDay && !orbitState.confirmed) hintEl.style.opacity = '0.3';
    }, 8000);

    _trailInited = true;
  }


  // ==================== 2B. 星轨共享状态（供星轨与 Canvas 发光读取） ====================

  /** 日轨全局状态（供 Canvas 发光渲染读取） */
  var orbitState = {
    month: 0,           // 0=未选
    day: 0,             // 0=未选
    activeSignIndex: -1, // 当前高亮的星座索引（-1=无）
    confirmed: false     // 是否已确认
  };


  /** 根据星座名找到 CONSTELLATIONS 数组中的索引 */
  function findConstellationIndex(nameCN) {
    for (var i = 0; i < CONSTELLATIONS.length; i++) {
      if (CONSTELLATIONS[i].name === nameCN) return i;
    }
    return -1;
  }


  /** 引导光束 — 星环射向星图上对应星座（Canvas 绘制，闪烁后消散）
   *  hold = 悬停期间的待机光束：连上后一直亮着，直到离开或确认 */
  function fireStarBeam(gold, hold) {
    if (orbitState.month > 0 && orbitState.day > 0 && typeof window._spawnStarBeam === 'function') {
      window._spawnStarBeam(orbitState.activeSignIndex, gold, hold);
    }
  }


  // ==================== 3. 星空粒子网络 ====================

  // 12 黄道星座 — 官方星座连线数据（Stellarium 现代天球星空文化），球心投影后两轴同比归一：
  // 形状/比例/连线拓扑与真实星空一致，pts 为 0~1 等比坐标，lines 为折线笔画，mags 为该点真实星等
  var CONSTELLATION_SHAPES = {
    '白羊座': {
      pts: [[0,0], [0.7472,0.3221], [0.9763,0.5247], [1,0.6422]],
      lines: [[0,1,2,3]],
      mags: [3.61, 2.01, 2.64, 3.88] },
    '金牛座': {
      pts: [[0,0.2343], [0.4618,0.4157], [0.5149,0.4364], [0.58,0.4445], [0.5574,0.3859], [0.5168,0.335], [0.1095,0], [0.7218,0.5396], [0.9803,0.6183], [0.7058,0.74], [1,0.6397], [0.9169,0.9171]],
      lines: [[0,1,2,3,4,5,6], [3,7,8,9], [8,10,11]],
      mags: [2.97, 0.87, 3.4, 3.65, 3.77, 3.53, 1.65, 3.41, 3.73, 3.91, 3.61, 4.29] },
    '双子座': {
      pts: [[1,0.4457], [0.9071,0.4523], [0.6655,0.3375], [0.3706,0.092], [0.1269,0], [0,0.1817], [0.0994,0.2448], [0.2647,0.4911], [0.4442,0.5618], [0.753,0.7598], [0.6694,0.9357], [0.281,0.7563]],
      lines: [[0,1,2,3,4,5,6,7,8,9,10], [7,11]],
      mags: [3.31, 2.87, 3.06, 4.41, 1.58, 1.16, 4.06, 3.5, 4.01, 1.93, 3.35, 3.58] },
    '巨蟹座': {
      pts: [[0,0.8637], [0.1735,0.5447], [0.1906,0.3765], [0.1529,0], [0.5299,1]],
      lines: [[0,1,2,3], [1,4]],
      mags: [4.26, 3.94, 4.66, 4.03, 3.53] },
    '狮子座': {
      pts: [[0.8371,0.476], [0.8408,0.3151], [0.7386,0.2149], [0.314,0.1805], [0,0.3606], [0.3019,0.3521], [0.7622,0.0954], [0.9422,0], [1,0.0718]],
      lines: [[0,1,2,3,4,5,0], [2,6,7,8]],
      mags: [1.36, 3.48, 2.01, 2.56, 2.14, 3.33, 3.43, 3.88, 2.97] },
    '处女座': {
      pts: [[1,0.0852], [0.9701,0.1942], [0.8018,0.2482], [0.6835,0.2646], [0.534,0.3503], [0.4542,0.4708], [0.1795,0.3649], [0.0207,0.3625], [0.575,0], [0.6096,0.1622], [0.4039,0.2464], [0.2589,0.2007], [0,0.1906]],
      lines: [[0,1,2,3,4,5,6,7], [8,9,3], [4,10,11,12]],
      mags: [4.04, 3.59, 3.89, 2.74, 4.38, 0.98, 4.07, 3.87, 2.85, 3.39, 3.38, 4.23, 3.73] },
    '天秤座': {
      pts: [[0.3736,0.7756], [0.5373,0.3315], [0.233,0], [0.0154,0.2674], [0.0153,0.9175], [0,1]],
      lines: [[0,1,2,3,4,5], [1,3]],
      mags: [3.25, 2.75, 2.61, 3.91, 3.6, 3.66] },
    '天蝎座': {
      pts: [[0.9463,0.2787], [0.9482,0.1271], [0.9089,0], [0.734,0.2421], [0.6545,0.2747], [0.592,0.3482], [0.4636,0.6012], [0.4515,0.7583], [0.4333,0.9415], [0.2983,0.9867], [0.1004,1], [0,0.8906], [0.0357,0.8367], [0.1003,0.7444]],
      lines: [[0,1,2], [1,3,4,5,6,7,8,9,10,11,12,13]],
      mags: [2.89, 2.29, 2.56, 2.9, 1.06, 2.82, 2.29, 3, 3.62, 3.32, 1.86, 2.99, 2.39, 1.62] },
    '射手座': {
      pts: [[0.7304,0.7332], [0.6903,0.6453], [0.7256,0.4895], [0.6827,0.334], [0.809,0.19], [0.2909,1], [0.2758,0.8598], [0.4151,0.4795], [0.5436,0.382], [0.0687,0.9306], [0.0084,0.6988], [0,0.3812], [0.1473,0.3186], [0.2366,0.3004], [0.3138,0.3232], [0.4705,0.357], [0.839,0.5217], [0.3818,0.4043], [0.3966,0.2005], [0.3555,0.1762], [0.2893,0.1053], [0.2543,0.0673], [0.2507,0], [0.4522,0.1784], [0.4802,0.2351]],
      lines: [[0,1,2,3,4], [5,6,7,8,3], [9,10,11,12,13,14,15,8,2,16,1,7,17,15,18,19,20,21,22], [18,23,24,15]],
      mags: [3.1, 1.79, 2.72, 2.82, 3.84, 3.96, 3.96, 2.6, 3.17, 4.12, 4.37, 4.7, 4.59, 5.02, 4.86, 2.05, 2.98, 3.32, 3.76, 2.88, 4.88, 3.92, 4.52, 3.52, 4.86] },
    '摩羯座': {
      pts: [[1,0], [0.9563,0.1041], [0.8628,0.2402], [0.6697,0.5773], [0.6096,0.653], [0.2414,0.4525], [0,0.1748], [0.0805,0.1952], [0.2797,0.1945], [0.4587,0.2087]],
      lines: [[0,1,2,3,4,5,6,7,8,9,0]],
      mags: [4.3, 3.05, 4.77, 4.13, 4.12, 3.77, 2.85, 3.69, 4.28, 4.08] },
    '水瓶座': {
      pts: [[1,0.264], [0.9683,0.2495], [0.7339,0.16], [0.5399,0.0387], [0.4503,0.0629], [0.4099,0.0319], [0.3731,0.0341], [0.2778,0.2032], [0.1339,0.2436], [0.1903,0.5214], [0.5334,0.3438], [0.477,0.2064], [0.4299,0], [0.113,0.5019], [0,0.4573]],
      lines: [[0,1,2,3,4,5,6,7,8,9], [2,10], [3,11], [5,12], [13,8,14]],
      mags: [3.78, 4.73, 2.9, 2.95, 3.86, 3.65, 4.04, 3.73, 4.41, 3.68, 4.29, 4.17, 4.8, 3.96, 4.82] },
    '双鱼座': {
      pts: [[0.2948,0.1293], [0.3092,0], [0.2675,0.0642], [0.3043,0.2104], [0.1934,0.3294], [0.1086,0.4615], [0,0.603], [0.0526,0.5943], [0.1271,0.5441], [0.1918,0.5313], [0.2836,0.5024], [0.3418,0.4969], [0.4174,0.5044], [0.6791,0.5184], [0.7861,0.5431], [0.8531,0.5246], [0.8984,0.5455], [0.92,0.5925], [0.8649,0.6392], [0.7777,0.628], [0.752,0.5906], [1,0.5784]],
      lines: [[0,1,2,0,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,14], [17,21]],
      mags: [4.67, 4.51, 4.74, 4.66, 3.62, 4.26, 3.82, 4.61, 4.45, 4.84, 5.21, 4.27, 4.44, 4.03, 4.13, 4.27, 5.05, 3.7, 4.95, 4.49, 4.95, 4.48] }
  };

  /** 生成星座锚点 — 动态计算以支持 resize 时切换布局 */
  function getAnchors() {
    return !isMobileViewport()
      ? [
          [0.02, 0.06], [0.14, 0.14], [0.02, 0.26], [0.14, 0.34], [0.02, 0.44], [0.14, 0.52],
          [0.84, 0.06], [0.72, 0.14], [0.84, 0.26], [0.72, 0.34], [0.84, 0.44], [0.72, 0.52]
        ]
      : [
          [0.5, 0.4], [0.5, 0.4], [0.5, 0.4], [0.5, 0.4], [0.5, 0.4], [0.5, 0.4],
          [0.5, 0.4], [0.5, 0.4], [0.5, 0.4], [0.5, 0.4], [0.5, 0.4], [0.5, 0.4]
        ];
  }

  /** 由 CONSTELLATION_SHAPES 构建渲染数组：折线拆成点对边、预计算包围盒、分配锚点
   *  左侧 6（白羊→处女）、右侧 6（天秤→双鱼），与 ZODIAC 同序，环绕星环两侧 */
  function buildConstellations() {
    var order = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
                 '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
    var out = [];
    for (var i = 0; i < order.length; i++) {
      var shape = CONSTELLATION_SHAPES[order[i]];
      var edges = [];
      for (var l = 0; l < shape.lines.length; l++) {
        var ln = shape.lines[l];
        for (var e = 1; e < ln.length; e++) edges.push([ln[e - 1], ln[e]]);
      }
      var minU = 1, maxU = 0, minV = 1, maxV = 0;
      for (var p = 0; p < shape.pts.length; p++) {
        if (shape.pts[p][0] < minU) minU = shape.pts[p][0];
        if (shape.pts[p][0] > maxU) maxU = shape.pts[p][0];
        if (shape.pts[p][1] < minV) minV = shape.pts[p][1];
        if (shape.pts[p][1] > maxV) maxV = shape.pts[p][1];
      }
      // 亮星标记（≤2 等）：发光半径额外放大的那几颗
      var mags = shape.mags || [];
      var bright = [];
      for (var b = 0; b < mags.length; b++) {
        if (mags[b] <= 2) bright.push(b);
      }
      out.push({
        name: order[i], pts: shape.pts, edges: edges, mags: mags, bright: bright,
        anchor: [0.5, 0.5], // 占位，generate() 时重新赋值
        minU: minU, minV: minV, fw: (maxU - minU) || 1, fh: (maxV - minV) || 1
      });
    }
    return out;
  }
  var CONSTELLATIONS = buildConstellations();

  /** 共享函数：更新 Canvas 星座发光状态（白天/夜间共用，避免主题切换时未定义） */
  function _updateGlow(signIndex, level) {
    for (var i = 0; i < CONSTELLATIONS.length; i++) {
      CONSTELLATIONS[i].glowLevel = 0;
    }
    if (signIndex >= 0 && signIndex < CONSTELLATIONS.length && level > 0) {
      CONSTELLATIONS[signIndex].glowLevel = level;
    }
  }

  function initStars() {
    var section = document.getElementById('zodiac-section');
    var canvas = document.getElementById('starchart-canvas');
    if (!canvas || !section) return;
    var ctx = canvas.getContext('2d');

    // 星空特效开关（用户设置）：关闭时连同流星/光束/庆祝粒子一并停用，但保留星座选择器与运势功能
    var _fxStarfield = true;
    try {
      if (window.__gySettings) {
        var _e = window.__gySettings.get().effects;
        if (_e && typeof _e.starfield === 'boolean') _fxStarfield = _e.starfield;
      }
    } catch (_err) {}

    var W, H;
    var particles = [];       // 自由粒子
    var cNodes = [];          // 星座节点

    // 星点调色 — 从 CSS 变量读取；日夜切换时每帧向新值插值（与 DOM 的 theme-fade 2s 过渡同步渐变）
    var theme = { rgb: '137,196,225', lineRgb: '180,200,230', meteorRgb: '255,255,240' }; // 绘制用字符串
    var themeCur = { rgb: [137, 196, 225], lineRgb: [180, 200, 230], meteorRgb: [255, 255, 240] }; // 浮点当前值
    var themeTarget = { rgb: [137, 196, 225], lineRgb: [180, 200, 230], meteorRgb: [255, 255, 240] };
    var THEME_KEYS = ['rgb', 'lineRgb', 'meteorRgb'];
    var THEME_VARS = ['--star-rgb', '--star-line-rgb', '--star-meteor-rgb'];

    function parseRgb(str) {
      var p = str.split(',');
      if (p.length !== 3) return null;
      var out = [parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2])];
      return (isNaN(out[0]) || isNaN(out[1]) || isNaN(out[2])) ? null : out;
    }

    /** 读取 CSS 变量到目标值；immediate=true 时立即对齐（载入时不渐变） */
    function readTheme(immediate) {
      var cs = getComputedStyle(document.documentElement);
      for (var i = 0; i < THEME_KEYS.length; i++) {
        var v = parseRgb(cs.getPropertyValue(THEME_VARS[i]).trim());
        if (v) {
          themeTarget[THEME_KEYS[i]] = v;
          if (immediate) themeCur[THEME_KEYS[i]] = v.slice();
        }
      }
      if (immediate) lerpTheme();
    }

    /** 每帧把当前色推向目标并刷新绘制字符串 — 星点像黄昏般缓缓变色 */
    function lerpTheme() {
      for (var i = 0; i < THEME_KEYS.length; i++) {
        var key = THEME_KEYS[i], cur = themeCur[key], tgt = themeTarget[key];
        cur[0] += (tgt[0] - cur[0]) * 0.025;
        cur[1] += (tgt[1] - cur[1]) * 0.025;
        cur[2] += (tgt[2] - cur[2]) * 0.025;
        theme[key] = Math.round(cur[0]) + ',' + Math.round(cur[1]) + ',' + Math.round(cur[2]);
      }
    }

    // 亮星连线 — 同一星座内节点间用虚线连接，模拟星座轮廓
    var constellationLines = [];
    // 流星 — 偶发性划过，动态点缀
    var meteors = [];

    // 庆祝粒子 — 确认星座后绚丽金色烟花
    var celebrateParticles = []; // [{cx, cy, vx, vy, r, alpha, life, maxLife, color, trail, spin}]

    /** 金色调色板 — 暖金/亮金/暖白/橘红 多彩烟花感 */
    var CELEBRATE_COLORS = [
      '255, 215, 110',  // 亮金
      '240, 192, 96',   // 暖金
      '255, 240, 180',  // 暖白
      '255, 170, 90',   // 橘金
      '255, 250, 220'   // 米白
    ];

    /** 在指定星座节点位置生成绚丽庆祝粒子（触屏设备从星核/星轨中心爆发） */
    function spawnCelebrate(constIndex) {
      if (constIndex < 0) return;
      // 白天模式临时显示 Canvas 以渲染庆祝粒子
      if (canvas.style.display !== 'block') canvas.style.display = 'block';
      var srcX, srcY;

      if (isTouchCoarse()) {
        // 触屏设备：优先以星核（当前选中位置）为爆发源 → 星轨中心 → 确认按钮
        var sRect = section.getBoundingClientRect();
        var core = section.querySelector('.trail-core-group');
        if (core) {
          var cRect = core.getBoundingClientRect();
          srcX = cRect.left + cRect.width / 2 - sRect.left;
          srcY = cRect.top + cRect.height / 2 - sRect.top;
        } else {
          var trail = document.getElementById('star-trail');
          if (trail) {
            var tRect = trail.getBoundingClientRect();
            srcX = tRect.left + tRect.width / 2 - sRect.left;
            srcY = tRect.top + tRect.height / 2 - sRect.top;
          } else {
            var btn = document.getElementById('tarot-confirm');
            if (!btn) return;
            var bRect = btn.getBoundingClientRect();
            srcX = bRect.left + bRect.width / 2 - sRect.left;
            srcY = bRect.top + bRect.height / 2 - sRect.top;
          }
        }
      } else {
        if (!document.documentElement.classList.contains('night-mode')) {
          // 白天模式：从确认按钮位置爆发
          var sRect = section.getBoundingClientRect();
          var btn = document.getElementById('tarot-confirm');
          if (!btn) return;
          var bRect = btn.getBoundingClientRect();
          srcX = bRect.left + bRect.width / 2 - sRect.left;
          srcY = bRect.top + bRect.height / 2 - sRect.top - 30;
        } else {
          // 夜间模式：以星座中心为爆发源
          var nodes = [];
          for (var i = 0; i < cNodes.length; i++) {
            if (cNodes[i].constIndex === constIndex) nodes.push(cNodes[i]);
          }
          if (!nodes.length) return;
          srcX = 0; srcY = 0;
          for (var n = 0; n < nodes.length; n++) {
            var nd = nodes[n];
            srcX += nd.cx;
            srcY += nd.cy;
          }
          srcX /= nodes.length; srcY /= nodes.length;
        }
      }

      // 主爆发 — 60 个多彩粒子向四周喷射
      for (var p = 0; p < 60; p++) {
        var angle = (p / 60) * Math.PI * 2 + Math.random() * 0.25;
        var speed = 1.5 + Math.random() * 4.5;
        var life = 1400 + Math.random() * 2000;
        celebrateParticles.push({
          cx: srcX, cy: srcY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.4, // 较强向上偏，烟花升腾感
          r: 1.2 + Math.random() * 2.6,
          alpha: 0.85 + Math.random() * 0.15,
          life: life, maxLife: life,
          color: CELEBRATE_COLORS[(Math.random() * CELEBRATE_COLORS.length) | 0],
          trail: 0.25 + Math.random() * 0.35, // 拖尾长度系数
          spin: Math.random() * Math.PI * 2, // 闪烁相位
          twinkleSpeed: 0.008 + Math.random() * 0.02,
        });
      }

      // 次级小爆发 — 延迟 350ms 在原位补一波细碎火星
      setTimeout(function () {
        for (var p2 = 0; p2 < 35; p2++) {
          var a2 = Math.random() * Math.PI * 2;
          var sp2 = 0.6 + Math.random() * 2.2;
          var lf2 = 800 + Math.random() * 1200;
          celebrateParticles.push({
            cx: srcX, cy: srcY,
            vx: Math.cos(a2) * sp2,
            vy: Math.sin(a2) * sp2 - 0.6,
            r: 0.8 + Math.random() * 1.6,
            alpha: 0.7 + Math.random() * 0.3,
            life: lf2, maxLife: lf2,
            color: CELEBRATE_COLORS[(Math.random() * CELEBRATE_COLORS.length) | 0],
            trail: 0.15 + Math.random() * 0.25,
            spin: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.012 + Math.random() * 0.02,
          });
        }
      }, 350);
    }
    // 暴露给星轨（initStarTrail）调用
    window._spawnCelebrate = spawnCelebrate;

    // 星环 → 星座 引导光束（悬停确认区期间常亮 / 确认时金光闪一次后消散）
    var starBeams = []; // [{x1,y1,x2,y2, life, maxLife, t, gold, hold, constIndex}]

    /** 确认按钮中心 → Canvas 坐标（按钮隐藏时返回 null） */
    function beamOrigin() {
      var btn = document.getElementById('tarot-confirm');
      if (!btn) return null;
      var bRect = btn.getBoundingClientRect();
      if (!bRect.width && !bRect.height) return null; // 按钮已隐藏
      var sRect = section.getBoundingClientRect();
      return {
        x: bRect.left + bRect.width / 2 - sRect.left,
        y: bRect.top + bRect.height / 2 - sRect.top
      };
    }

    /** 从「确认选择」按钮中心射向对应星座中心的光束（手机端不生成）。
     *  仅夜间模式（_canvasVisible）；替换式：新光束生成时清掉旧光束——
     *  任何时刻最多一条，避免多条线叠加。
     *  hold = 待机光束：不自行衰减，只在原地呼吸；同目标重复调用不重建，保持已延伸的长度。 */
    function spawnStarBeam(constIndex, gold, hold) {
      if (!_fxStarfield) return; // 星空特效关闭：不生成引导光束
      if (isMobileViewport()) return; // 手机端无引导光束
      if (!_canvasVisible) return; // 白天模式无星空背景：不生成光束（避免 starBeams 只增不减）
      if (constIndex < 0 || constIndex >= CONSTELLATIONS.length) return;
      var nodes = [];
      for (var i = 0; i < cNodes.length; i++) {
        if (cNodes[i].constIndex === constIndex) nodes.push(cNodes[i]);
      }
      if (!nodes.length) return;
      var tx = 0, ty = 0;
      for (var n = 0; n < nodes.length; n++) { tx += nodes[n].cx; ty += nodes[n].cy; }
      tx /= nodes.length; ty /= nodes.length;
      var origin = beamOrigin();
      if (!origin) return;
      starBeams.length = 0; // 替换旧光束
      starBeams.push({
        x1: origin.x, y1: origin.y, x2: tx, y2: ty,
        life: 1300, maxLife: 1300, t: 0,
        gold: !!gold, hold: !!hold, constIndex: constIndex
      });
    }
    // 暴露给星轨（initStarTrail）调用
    window._spawnStarBeam = spawnStarBeam;
    /** 清空引导光束（鼠标离开确认按钮等场景） */
    window._clearStarBeam = function () { starBeams = []; };
    /** 主题切换时清空 Canvas 残留粒子/光束/流星/连线状态，防止白天确认的粒子夜间突现 */
    window._clearCanvasEffects = function () {
      celebrateParticles = [];
      starBeams = [];
      meteors = [];
      // 清除星座连线 reveal 状态
      if (typeof constellationLines !== 'undefined') {
        for (var cli = 0; cli < constellationLines.length; cli++) {
          constellationLines[cli].reveal = 0;
        }
      }
      // 清除 _revealHold / 退场标记
      if (typeof CONSTELLATIONS !== 'undefined') {
        for (var conj = 0; conj < CONSTELLATIONS.length; conj++) {
          CONSTELLATIONS[conj]._revealHold = null;
          CONSTELLATIONS[conj]._dismissPhase = 0;
          CONSTELLATIONS[conj]._dismissGlow = 0;
          CONSTELLATIONS[conj]._dismissFade = 0;
        }
      }
    };

    function hash(seed) {
      var x = Math.sin(seed) * 43758.5453;
      return x - Math.floor(x);
    }

    function generate() {
      particles = [];
      cNodes = [];
      constellationLines = [];

      // 自由粒子（星空背景）— 铺满整个星座区
      var freeCount = isMobileViewport() ? 100 : 200;
      for (var i = 0; i < freeCount; i++) {
        var s = hash(i * 71 + 13);
        var t = hash(i * 101 + 17);
        particles.push({
          rx: 0.02 + s * 0.96, ry: 0.02 + t * 0.96,
          cx: 0, cy: 0,
          vx: (hash(i * 37 + 3) - 0.5) * 0.25,
          vy: (hash(i * 53 + 7) - 0.5) * 0.25,
          r: 0.6 + hash(i * 83 + 11) * 2.2,
          baseAlpha: 0.25 + hash(i * 91 + 19) * 0.45,
          twinkleSpeed: 0.002 + hash(i * 43 + 13) * 0.012,
          twinkleOffset: hash(i * 67 + 23) * Math.PI * 2,
        });
      }

      // 星座节点 — 重新计算锚点以支持 resize，等比缩放居中到锚点块
      var anchors = getAnchors();
      for (var c = 0; c < CONSTELLATIONS.length; c++) {
        var co = CONSTELLATIONS[c];
        co.anchor = anchors[c];
        var pts = co.pts;
        var brightSet = co.bright || [];
        var mags = co.mags || [];
        // 锚点块（像素）：聚在星环左右两侧附近，块间允许交叠
        var bx = co.anchor[0] * W;
        var by = co.anchor[1] * H;
        var bw = 0.15 * W;
        var bh = 0.18 * H;
        var k = Math.min(bw / co.fw, bh / co.fh); // 等比缩放系数
        var ox = bx + (bw - co.fw * k) / 2;
        var oy = by + (bh - co.fh * k) / 2;
        var base = cNodes.length; // 该星座节点的全局起始下标
        for (var p = 0; p < pts.length; p++) {
          var isBright = false;
          for (var bi = 0; bi < brightSet.length; bi++) {
            if (brightSet[bi] === p) { isBright = true; break; }
          }
          // 真实星等 → 星点大小/亮度（1 等 ≈ r1.9、α0.8；6 等 ≈ r0.7、α0.3）
          var mag = (mags && mags[p] != null) ? mags[p] : 4.5;
          var mt = Math.max(0, Math.min(1, (6 - mag) / 5.5));
          cNodes.push({
            rx: (ox + (pts[p][0] - co.minU) * k) / W,
            ry: (oy + (pts[p][1] - co.minV) * k) / H,
            cx: 0, cy: 0,
            constIndex: c,
            vx: 0, vy: 0,
            r: 0.7 + mt * 1.3,
            baseAlpha: 0.3 + mt * 0.5,
            twinkleSpeed: 0.002 + Math.random() * 0.01,
            twinkleOffset: Math.random() * Math.PI * 2,
            bright: isBright,
            glowSmooth: 0, // 发光平滑插值（激活时星点从星空中缓缓浮现）
          });
        }
        // 生成该星座的连线（a/b 存 cNodes 全局下标）— 平时隐藏，确认后逐笔描画
        var edges = co.edges || [];
        for (var ei = 0; ei < edges.length; ei++) {
          constellationLines.push({ constIndex: c, a: base + edges[ei][0], b: base + edges[ei][1], reveal: 0 });
        }
      }
    }

    /** 生成一颗流星 — 从画面上半区斜向划过 */
    function spawnMeteor() {
      if (!_fxStarfield) return; // 星空特效关闭：不生成流星
      var startX = Math.random() * W * 1.2;
      meteors.push({
        x: startX,
        y: Math.random() * H * 0.5,
        vx: -(4 + Math.random() * 6),
        vy: 2 + Math.random() * 4,
        life: 1,
        decay: 0.02 + Math.random() * 0.012,
        length: 40 + Math.random() * 70,
      });
    }

    var _meteorTimer = null;
    /** 定时调度流星 — 每 2.5~7s 生成一颗，页面隐藏或白天模式跳过；受星空特效开关门控 */
    function scheduleMeteor() {
      if (_meteorTimer) return;   // 已有调度，避免重复链
      if (!_fxStarfield) return;  // 星空特效关闭：不启动流星调度
      var delay = 2500 + Math.random() * 4500;
      _meteorTimer = setTimeout(function () {
        _meteorTimer = null;
        if (_fxStarfield && !document.hidden && W > 0 && _canvasVisible) spawnMeteor();
        scheduleMeteor();
      }, delay);
    }

    /** 退场星座的连线是否已全部收回（用于从"逆序回缩"切到"辉光收尾"） */
    function linesRetracted(ci) {
      for (var i = 0; i < constellationLines.length; i++) {
        if (constellationLines[i].constIndex === ci && constellationLines[i].reveal > 0) return false;
      }
      return true;
    }

    var _starLastTs = null;
    function update(timestamp) {
      // 帧间隔折算（60Hz 基准）：高刷屏动画速度一致，限制 50ms 上限防后台切回瞬移
      if (_starLastTs === null) _starLastTs = timestamp;
      var k = Math.min(Math.max(timestamp - _starLastTs, 0), 50) / 16.667;
      _starLastTs = timestamp;
      // 自由粒子：布朗漂移 + 弹簧回归（仅在夜间模式渲染）
      if (_canvasVisible) {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.cx === 0 && p.cy === 0) { p.cx = p.rx * W; p.cy = p.ry * H; }

        var rx = p.rx * W, ry = p.ry * H;

        // 弹簧力 → 初始位 + 漂移偏移
        var fx = (rx - p.cx) * 0.003 * k;
        var fy = (ry - p.cy) * 0.003 * k;

        p.vx += fx; p.vy += fy;
        var pDrag = Math.pow(0.93, k);
        p.vx *= pDrag; p.vy *= pDrag;
        p.cx += p.vx * k; p.cy += p.vy * k;

        // 边界回弹
        if (p.cx < -10) p.vx += 0.3 * k;
        if (p.cx > W + 10) p.vx -= 0.3 * k;
        if (p.cy < -10) p.vy += 0.3 * k;
        if (p.cy > H + 10) p.vy -= 0.3 * k;
      }
      } // end _canvasVisible

      // 星座节点：弹簧回归（无自主晃动，保持形状）+ 发光平滑插值
      // 手机端跳过星座节点更新（连线/光束/节点均不绘制，仅保留庆祝粒子和流星）
      if (!isMobileViewport() && _canvasVisible) {
        for (var j = 0; j < cNodes.length; j++) {
          var n = cNodes[j];
          if (n.cx === 0 && n.cy === 0) { n.cx = n.rx * W; n.cy = n.ry * H; }

          var nrx = n.rx * W, nry = n.ry * H;
          var nfx = (nrx - n.cx) * 0.0025 * k;
          var nfy = (nry - n.cy) * 0.0025 * k;

          n.vx += nfx; n.vy += nfy;
          var nDrag = Math.pow(0.90, k);
          n.vx *= nDrag; n.vy *= nDrag;
          n.cx += n.vx * k; n.cy += n.vy * k;

          // 发光等级平滑趋近 — 激活时星点从星空中缓缓浮现，取消时缓缓隐没
          // 退场回缩阶段以点亮时的旧值为目标：线还没收完，星图不该先暗下去
          var nCo = CONSTELLATIONS[n.constIndex];
          var tg = nCo._dismissPhase === 1 ? (nCo._dismissGlow || 0) : (nCo.glowLevel || 0);
          n.glowSmooth += (tg - n.glowSmooth) * Math.min(1, 0.06 * k);
        }
      }

      // 星座连线描画：确认后延迟片刻（等引导光束到达）开始逐笔勾勒
      // 退场（_dismissPhase）：1 = 连线按入场逆向逐条回缩、星点保持点亮 → 2 = 辉光收尾
      // 手机端跳过连线描画状态更新（连线/光束/节点均不绘制）
      if (!isMobileViewport() && _canvasVisible) {
        for (var ch = 0; ch < CONSTELLATIONS.length; ch++) {
          var co = CONSTELLATIONS[ch];
          if (co._dismissPhase === 1) {
            if (linesRetracted(ch)) {
              // 收笔后与入场"等光束到达"对称地停一拍，星点再落下去
              if (co._revealHold == null) co._revealHold = 26; // ~430ms，与入场同一时长
              else if (co._revealHold > 0) { co._revealHold -= k; continue; }
              co._dismissPhase = 2; // 转入辉光收尾：星点辉光按入场同速率回落
              co._dismissGlow = 0;
              co._dismissFade = 1;
            }
            continue;
          }
          if (co._dismissPhase === 2) {
            co._dismissFade = Math.max(0, co._dismissFade - 0.02 * k); // ≈0.83s，与入场星点浮现同长
            if (co._dismissFade <= 0) co._dismissPhase = 0;
            continue;
          }
          if ((co.glowLevel || 0) >= 3) {
            if (co._revealHold == null) co._revealHold = 26; // ~430ms（60Hz 基准）
            else if (co._revealHold > 0) co._revealHold -= k;
          } else {
            co._revealHold = null;
          }
        }
        for (var lr = constellationLines.length - 1; lr >= 0; lr--) {
          var ln = constellationLines[lr];
          var lco = CONSTELLATIONS[ln.constIndex];
          if (lco._dismissPhase === 1) {
            // 逆序链式回缩：入场是"前一条画过 65% 本条才动笔"，退场反过来——后画的那条先收回 65%，前一条才开始
            var nextLn = lr + 1 < constellationLines.length && constellationLines[lr + 1].constIndex === ln.constIndex
              ? constellationLines[lr + 1] : null;
            if (!nextLn || nextLn.reveal < 0.35 - (Math.random() * 0.04)) {
              ln.reveal = Math.max(0, ln.reveal - 0.055 * k);
            }
          } else if ((lco.glowLevel || 0) >= 3 && lco._revealHold <= 0) {
            // 链式描画：同星座内前一条线画过 65% 后，本条才动笔（加微小随机延迟，增加手绘感）
            var prevLn = lr > 0 && constellationLines[lr - 1].constIndex === ln.constIndex
              ? constellationLines[lr - 1] : null;
            if (!prevLn || prevLn.reveal > 0.65 + (Math.random() * 0.04)) {
              ln.reveal = Math.min(1, ln.reveal + 0.055 * k);
            }
          } else {
            ln.reveal = Math.max(0, ln.reveal - 0.08 * k);
          }
        }
      }

      // 庆祝粒子衰减 — 位移 + 重力 + 空气阻力 + 闪烁相位
      for (var cp = celebrateParticles.length - 1; cp >= 0; cp--) {
        var cpItem = celebrateParticles[cp];
        cpItem.cx += cpItem.vx * k;
        cpItem.cy += cpItem.vy * k;
        cpItem.vy += 0.018 * k; // 重力
        var cpDrag = Math.pow(0.985, k); // 空气阻力 → 末段渐缓飘落
        cpItem.vx *= cpDrag;
        cpItem.vy *= cpDrag;
        cpItem.spin += cpItem.twinkleSpeed * k; // 闪烁相位推进
        cpItem.life -= 16 * k;
        if (cpItem.life <= 0) celebrateParticles.splice(cp, 1);
      }
      // 白天模式粒子全部消散后恢复 Canvas 隐藏
      if (celebrateParticles.length === 0 && !document.documentElement.classList.contains('night-mode')) {
        canvas.style.display = '';
      }

      // 引导光束衰减（仅夜间模式）；待机光束不计时，只在原地呼吸
      if (_canvasVisible) {
      for (var sbu = starBeams.length - 1; sbu >= 0; sbu--) {
        if (starBeams[sbu].hold) { starBeams[sbu].t += 16 * k; continue; }
        starBeams[sbu].life -= 16 * k;
        if (starBeams[sbu].life <= 0) starBeams.splice(sbu, 1);
      }
      }

      // 流星位移衰减
      for (var mf = meteors.length - 1; mf >= 0; mf--) {
        var mt = meteors[mf];
        mt.x += mt.vx * k;
        mt.y += mt.vy * k;
        mt.life -= mt.decay * k;
        if (mt.life <= 0 || mt.x < -100 || mt.y > H + 100) meteors.splice(mf, 1);
      }
    }

    function draw(timestamp) {
      if (W <= 0 || H <= 0) return;
      // 0. 透明清屏 — 透出全站纯色背景（白天浅蓝 / 夜间深蓝），星座区与页面同色
      ctx.clearRect(0, 0, W, H);

      // 星座连线 — 未激活星座隐藏；手机端完全不画连线（夜间模式专属）
      // 入场描画与退场回缩共用同一套画法（笔尖光点指向当前笔尖），退场即入场的倒放
      if (!isMobileViewport() && _canvasVisible) {
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        for (var li = 0; li < constellationLines.length; li++) {
          var line = constellationLines[li];
          var lco3 = CONSTELLATIONS[line.constIndex];
          if (!lco3) continue;
          if (line.reveal <= 0) continue; // 未描画 / 已收回：不留残影
          if ((lco3.glowLevel || 0) === 0 && !lco3._dismissPhase) continue; // 未激活星座隐藏
          var na = cNodes[line.a];
          var nb = cNodes[line.b];
          if (!na || !nb) continue;

          var lex = na.cx + (nb.cx - na.cx) * line.reveal;
          var ley = na.cy + (nb.cy - na.cy) * line.reveal;

          ctx.beginPath();
          ctx.moveTo(na.cx, na.cy);
          ctx.lineTo(lex, ley);
          ctx.strokeStyle = 'rgba(240, 210, 150, ' + (0.2 + 0.5 * line.reveal) + ')';
          ctx.stroke();
          // 笔尖光点
          if (line.reveal < 1) {
            ctx.beginPath();
            ctx.arc(lex, ley, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(250, 225, 170, 0.9)';
            ctx.fill();
          }
        }
      } // end if 桌面端画连线

      // 星环 → 星座 引导光束：延伸（前 28%）→ 闪烁 → 淡出（手机端不画，夜间模式专属）
      // 待机光束停在闪烁段不再推进，直到离开确认区或确认时替换为金光
      if (!isMobileViewport() && _canvasVisible) {
      for (var sbd = 0; sbd < starBeams.length; sbd++) {
        var bm = starBeams[sbd];
        // 待机光束每帧咬住按钮中心（页面滚动/布局变化后不会与按钮脱节）
        if (bm.hold) {
          var bo = beamOrigin();
          if (bo) { bm.x1 = bo.x; bm.y1 = bo.y; }
        }
        var bt = bm.hold ? Math.min(0.6, bm.t / bm.maxLife) : 1 - bm.life / bm.maxLife;
        var reach = Math.min(1, bt / 0.28);
        reach = 1 - (1 - reach) * (1 - reach); // ease-out 延伸
        var bAlpha;
        if (bt < 0.28) {
          bAlpha = 0.75;
        } else if (bt < 0.7) {
          var bPhase = bm.hold ? bm.t / 1400 : (bt - 0.28) / 0.42; // 待机光束用真实时间推进呼吸
          bAlpha = 0.35 + 0.45 * Math.abs(Math.sin(bPhase * Math.PI * 2.5));
        } else {
          bAlpha = 0.8 * (1 - (bt - 0.7) / 0.3);
        }
        var bex = bm.x1 + (bm.x2 - bm.x1) * reach;
        var bey = bm.y1 + (bm.y2 - bm.y1) * reach;
        var bCol = bm.gold ? '240,200,120' : theme.lineRgb;
        var bGrad = ctx.createLinearGradient(bm.x1, bm.y1, bex, bey);
        bGrad.addColorStop(0, 'rgba(' + bCol + ',0)');
        bGrad.addColorStop(0.25, 'rgba(' + bCol + ',' + (bAlpha * 0.35) + ')');
        bGrad.addColorStop(1, 'rgba(' + bCol + ',' + bAlpha + ')');
        ctx.beginPath();
        ctx.moveTo(bm.x1, bm.y1);
        ctx.lineTo(bex, bey);
        ctx.strokeStyle = bGrad;
        ctx.lineWidth = bm.gold ? 1.8 : 1.4;
        ctx.lineCap = 'round';
        ctx.stroke();
        // 前端光点
        ctx.beginPath();
        ctx.arc(bex, bey, bm.gold ? 2.6 : 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + bCol + ',' + bAlpha + ')';
        ctx.fill();
      }
      } // end if 桌面端画光束

      // 流星
      for (var mi = meteors.length - 1; mi >= 0; mi--) {
        var m = meteors[mi];
        var tailX = m.x - m.vx * m.length / 8;
        var tailY = m.y - m.vy * m.length / 8;
        var mg = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        mg.addColorStop(0, 'rgba(' + theme.meteorRgb + ',' + (m.life * 0.8) + ')');
        mg.addColorStop(0.4, 'rgba(' + theme.meteorRgb + ',' + (m.life * 0.45) + ')');
        mg.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = mg;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 1. 庆祝粒子 — 绚丽金色烟花：光晕 + 流线拖尾 + 闪烁
      for (var cpi = 0; cpi < celebrateParticles.length; cpi++) {
        var cp = celebrateParticles[cpi];
        var cpRatio = cp.life / cp.maxLife;
        var cpAlpha = cp.alpha * cpRatio;
        // 闪烁 — 末段加剧忽明忽暗
        var twinkle = 0.7 + 0.3 * Math.abs(Math.sin(cp.spin));
        var drawA = cpAlpha * twinkle;
        var col = cp.color || '240, 192, 96';
        var curR = cp.r * (0.4 + 0.6 * cpRatio);

        // 外层柔光晕 — 用 shadowBlur 替代 createRadialGradient，减少 GC 压力
        ctx.save();
        ctx.shadowBlur = curR * 4.5;
        ctx.shadowColor = 'rgba(' + col + ',' + (drawA * 0.55) + ')';
        ctx.beginPath();
        ctx.arc(cp.cx, cp.cy, curR * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + col + ',' + (drawA * 0.55) + ')';
        ctx.fill();
        ctx.restore();

        // 流线拖尾 — 沿速度方向拉出渐变尾巴
        var tl = cp.trail * 14;
        var tx = cp.cx - cp.vx * tl;
        var ty = cp.cy - cp.vy * tl;
        var tGrad = ctx.createLinearGradient(cp.cx, cp.cy, tx, ty);
        tGrad.addColorStop(0, 'rgba(' + col + ',' + (drawA * 0.7) + ')');
        tGrad.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.beginPath();
        ctx.moveTo(cp.cx, cp.cy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = tGrad;
        ctx.lineWidth = curR * 1.4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 核心亮点 — 高饱和白金色
        ctx.beginPath();
        ctx.arc(cp.cx, cp.cy, curR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 250, 230, ' + Math.min(1, drawA * 1.2) + ')';
        ctx.fill();
      }

      // 2. 自由粒子（仅夜间模式）
      if (_canvasVisible) {
      for (var k = 0; k < particles.length; k++) {
        var p = particles[k];
        var tw = 1 + Math.sin(timestamp * p.twinkleSpeed + p.twinkleOffset) * 0.2;
        var alpha = Math.max(0.05, Math.min(0.85, p.baseAlpha * tw));

        ctx.beginPath();
        ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + theme.rgb + ',' + alpha + ')';
        ctx.fill();
      }
      }

      // 3. 星座节点 — 仅显示 glowLevel > 0 的激活星座；手机端完全不画星座（夜间模式专属）
      if (_canvasVisible) {
      for (var m = 0; m < cNodes.length; m++) {
        var nd = cNodes[m];
        // 手机端：跳过星座节点绘制（坐标仍保留供庆祝粒子/光束使用）
        if (isMobileViewport()) continue;
        // glowLevel === 0 且不在退场中 → 完全跳过，不留痕迹（退场中的星座要画到辉光落尽）
        var ndCo = CONSTELLATIONS[nd.constIndex];
        var constGlow = ndCo ? (ndCo.glowLevel || 0) : 0;
        var ndPhase = ndCo ? (ndCo._dismissPhase || 0) : 0;
        if (constGlow === 0 && ndPhase === 0) continue;
        var g = nd.glowSmooth; // 0~3 连续插值
        // 辉光收尾：星点亮度随辉光线性落尽（与入场星点浮现同长），避免最后一帧突兀消失
        var ndFade = ndPhase === 2 ? (ndCo._dismissFade || 0) : 1;
        var ntw = 1 + Math.sin(timestamp * nd.twinkleSpeed + nd.twinkleOffset) * 0.2;
        var nAlpha = Math.max(0.05, Math.min(0.85, nd.baseAlpha * ntw)) * ndFade;

        if (g < 0.04) {
          // 未激活：按自由粒子绘制，隐于星空不可辨
          ctx.beginPath();
          ctx.arc(nd.cx, nd.cy, nd.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + theme.rgb + ',' + nAlpha + ')';
          ctx.fill();
          continue;
        }

        // 激活：光晕随 g 连续增强；确认（g→3）转金色 — 用 shadowBlur 替代 createRadialGradient 减少 GC
        var gold = g >= 2.5;
        var gCol = gold ? '240,192,96' : theme.rgb;
        var glowR = nd.r * (3 + g * 2.4) * (nd.bright ? 1.15 : 1);
        var glowA = Math.min(0.9, 0.15 + g * 0.24) * ndFade;
        ctx.save();
        ctx.shadowBlur = glowR;
        ctx.shadowColor = 'rgba(' + gCol + ',' + glowA + ')';
        ctx.beginPath();
        ctx.arc(nd.cx, nd.cy, nd.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + gCol + ',' + glowA + ')';
        ctx.fill();
        ctx.restore();

        var dotA = Math.min(1, nAlpha + g * 0.25);
        ctx.beginPath();
        ctx.arc(nd.cx, nd.cy, nd.r * (0.85 + g * 0.12), 0, Math.PI * 2);
        ctx.fillStyle = gold
          ? 'rgba(250, 226, 168, ' + dotA + ')'
          : 'rgba(235, 244, 252, ' + dotA + ')';
        ctx.fill();
      }
      } // end _canvasVisible

    }

    // ---- 主循环（注册到全局 rAF 调度） ----

    // 视口门控：section 滚出视口时暂停星空绘制（画布铺在 section 内，不可见时绘制是纯浪费）。
    // 庆祝粒子不受门控——确认瞬间必在视口内，粒子持续期间若滚走也仅短暂多画几帧
    var _sectionInView = true;
    if (typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver(function (entries) {
        _sectionInView = entries[0].isIntersecting;
      }).observe(section);
    }

    function tick(ts) {
      if (W <= 0 || H <= 0) return;
      // 星空特效关闭：清空粒子/光束并停绘（保留星座选择器与运势功能）
      if (!_fxStarfield) {
        starBeams = [];
        celebrateParticles = [];
        return;
      }
      if (!_sectionInView && celebrateParticles.length === 0) return;
      if (!_canvasVisible && celebrateParticles.length === 0) return;
      lerpTheme();
      update(ts);
      draw(ts);
    }

    function resize() {
      // DPR 上限 2：3x 屏用 2x，填充率降 2.25 倍（星星为 1px 级小点，2x 下视觉几乎无差）
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = section.offsetWidth;
      H = section.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 重置庆祝粒子与光束（尺寸变化后旧坐标失效）
      celebrateParticles = [];
      starBeams = [];
      generate();
    }

    resize();
    _canvasVisible = document.documentElement.classList.contains('night-mode');
    readTheme(true); // 载入时立即对齐当前模式，不渐变
    // 日夜切换时刷新调色目标（监听 <html> 的 night-mode class 切换），星点随插值渐变
    if (typeof MutationObserver !== 'undefined') {
      var themeObserver = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].attributeName === 'class') { readTheme(); break; }
        }
      });
      themeObserver.observe(document.documentElement, { attributes: true });
    }
    if (typeof window._registerTick === 'function') {
      window._registerTick(tick);
    }
    scheduleMeteor(); // 启动流星调度（动态点缀）
    // 星空特效开关（供设置面板调用）：关闭清空粒子/光束，开启恢复流星调度
    if (typeof window.__gyFx === 'object' && window.__gyFx && window.__gyFx.register) {
      window.__gyFx.register('starfield', function (on) {
        _fxStarfield = on;
        if (!on) { starBeams = []; celebrateParticles = []; }
        else { scheduleMeteor(); }
      });
    }
    // 防抖：resize 会触发 generate()（星点/粒子重建），窗口拖拽连续触发时合并为一次
    var _zodiacResizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(_zodiacResizeTimer);
      _zodiacResizeTimer = setTimeout(resize, 200);
    });
  }

  // ==================== 4. 滚动渐进浮现（IntersectionObserver 驱动） ====================

  function initScrollBehavior() {
    // ---- IntersectionObserver 驱动浮现（替代 scroll + rAF） ----
    var revealEls = document.querySelectorAll('.reveal-up');
    if (!revealEls.length) return;

    // 兜底：旧浏览器无 IntersectionObserver 时直接显示，不依赖 JS 监听
    if (typeof IntersectionObserver === 'undefined') {
      for (var r = 0; r < revealEls.length; r++) {
        revealEls[r].style.opacity = '1';
        revealEls[r].style.transform = 'translateY(0)';
      }
      return;
    }

    // 只有 JS 运行至此才加 js 标记：让 .reveal-up 从"默认可见"切换为"隐藏等 IO 入场"
    // （若前面 initFortune/initStars 抛错，此处不执行，内容保持默认可见，不丢失）
    document.documentElement.classList.add('js');

    // 从 class d0~d6 读取交错延迟（秒）
    var DELAY_MAP = [0, 0.12, 0.28, 0.44, 0.6, 0.78, 0.96];
    function getDelay(el) {
      for (var d = 0; d <= 6; d++) {
        if (el.classList.contains('d' + d)) return DELAY_MAP[d];
      }
      return 0;
    }

    // 预设过渡 — 增强弹性回弹，Playful 个性（回弹 ~18%）
    var transitionStyle = 'opacity 0.55s cubic-bezier(0.34,1.56,0.64,1), transform 0.55s cubic-bezier(0.34,1.56,0.64,1)';

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = getDelay(el);
          // 先设过渡再改变属性，确保动画触发
          el.style.transition = transitionStyle;
          // 用 setTimeout 实现交错延迟
          setTimeout(function () {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, delay * 1000);
          // 只触发一次，之后不再观察
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1 });

    for (var i = 0; i < revealEls.length; i++) {
      observer.observe(revealEls[i]);
    }
  }

  // ==================== 启动 ====================

  function init() {
    initFortune();
    initStars();   // 必须先初始化星空（CONSTELLATIONS），供星轨查询

    // 星轨滑星：白天/夜间共用同一选择器（DOM 常显，皮肤随主题切换）
    initStarTrail();

    // 暴露全局切换函数供 main.js 中日夜切换调用（切换仅做状态重置，不再重建 DOM）
    window._onThemeSwitch = function (toNight) {
      // 模式未实际变化时跳过（防止自动定时器每分钟触发重置）
      if (toNight === window._lastNightMode) return;
      window._lastNightMode = toNight;

      // 清空共享状态，避免白天/夜间的选择互相影响
      orbitState.month = 0;
      orbitState.day = 0;
      orbitState.activeSignIndex = -1;
      orbitState.confirmed = false;
      _updateGlow(-1, 0);
      // 清空 Canvas 残留粒子/光束，防止白天确认的庆祝粒子在夜间突现
      if (typeof window._clearCanvasEffects === 'function') window._clearCanvasEffects();
      _canvasVisible = toNight;
      if (typeof window._resetTarot === 'function') window._resetTarot();
    };
    // 记录当前模式，防止下次自动检测时误触发重置
    window._lastNightMode = document.documentElement.classList.contains('night-mode');

    initScrollBehavior();
  }

  // DOM 加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
