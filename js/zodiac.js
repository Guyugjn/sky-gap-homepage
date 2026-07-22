/* ============================================
   GY · 天空之隙 — 星座星空模块
   每日运势 · 星环日轨 · 星空粒子 · 滚动浮现
   ============================================ */

(function () {
  'use strict';

  var _tarotInited = false;
  var _orbitInited = false;
  var _canvasVisible = true;

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
      var pct = indexData[key] || '0%';
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

    // 详细运势
    var ft = data.fortunetext || {};
    var detailParts = [];
    if (ft.health && ft.health.length > 2) detailParts.push('<p><strong>🩺 健康：</strong>' + stripSource(ft.health) + '</p>');
    if (ft.love && ft.love.length > 2) detailParts.push('<p><strong>💕 爱情：</strong>' + stripSource(ft.love) + '</p>');
    if (ft.work && ft.work.length > 2) detailParts.push('<p><strong>💼 工作：</strong>' + stripSource(ft.work) + '</p>');
    if (ft.money && ft.money.length > 2) detailParts.push('<p><strong>💰 财富：</strong>' + stripSource(ft.money) + '</p>');
    document.getElementById('fortune-detail-text').innerHTML = detailParts.join('');
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
  }

  /** 加载运势（含竞态保护 + 缓存，保存 1 天） */
  var _lastFortuneController = null;
  var _fortuneCache = {};

  function loadFortune() {
    showFortuneLoading();

    // 取消上一个未完成的请求
    if (_lastFortuneController) {
      _lastFortuneController.abort();
    }

    // 缓存键：星座名 + 时间维度
    var cacheKey = currentFortuneSign.name + '_' + currentFortuneTime;
    var cached = _fortuneCache[cacheKey];
    if (cached && Date.now() - cached.ts < 86400000) {
      document.getElementById('fortune-loading').style.display = 'none';
      document.getElementById('fortune-error').style.display = 'none';
      renderFortune(cached.data);
      return;
    }

    var controller = new AbortController();
    _lastFortuneController = controller;

    var url = FORTUNE_API + '?type=' + encodeURIComponent(currentFortuneSign.name)
      + '&time=' + encodeURIComponent(currentFortuneTime);

    fetch(url, { signal: controller.signal })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        document.getElementById('fortune-loading').style.display = 'none';
        document.getElementById('fortune-error').style.display = 'none';
        if (json.code === 200 && json.data) {
          _fortuneCache[cacheKey] = { data: json.data, ts: Date.now() };
          renderFortune(json.data);
        } else {
          showFortuneError();
        }
      })
      .catch(function (err) {
        if (err.name === 'AbortError') return; // 忽略取消请求
        showFortuneError();
      });
  }

  /** 切换运势的星座（外部调用） */
  function setFortuneSign(sign) {
    currentFortuneSign = sign;
    currentFortuneTime = 'today';
    // 重置 tab 激活状态
    var tabs = document.querySelectorAll('.fortune-tab');
    tabs.forEach(function (t) { t.classList.remove('active'); });
    var todayTab = document.querySelector('.fortune-tab[data-time="today"]');
    if (todayTab) todayTab.classList.add('active');
    loadFortune();
  }

  function initFortune() {
    var mySign = getZodiacSign(BIRTHDAY.month, BIRTHDAY.day);
    currentFortuneSign = mySign;

    // Tab 切换
    var tabs = document.querySelectorAll('.fortune-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentFortuneTime = tab.dataset.time;
        loadFortune();
      });
    });

    // 首次加载
    loadFortune();
  }

  // ==================== 2A. 塔罗牌卡日历（白天模式专用） ====================

  /** 塔罗牌卡日历复用 orbitState、_updateGlow() 等共享全局状态。
   *  上排12张月份符卡 → 下排日历网格选日期 → 月日选齐显示"揭晓"按钮。 */

  function initTarot() {
    if (_tarotInited) return;
    var deck = document.getElementById('tarot-deck');
    if (!deck) return;

    var monthsEl = document.getElementById('tarot-months');
    var dayGrid  = document.getElementById('day-grid');
    var oracleEl = document.getElementById('tarot-oracle');
    var hintEl   = document.getElementById('tarot-hint');
    var confirmBtn = document.getElementById('tarot-confirm');
    var resultEl  = document.getElementById('orbit-result');

    if (!monthsEl || !dayGrid) return;

    /* ---- 获取今天的真实日期 ---- */
    var today = new Date();
    var todayMonth = today.getMonth() + 1;
    var todayDay = today.getDate();

    /* ---- 渲染日期星丸 ---- */

    function renderDayPills() {
      dayGrid.innerHTML = '';
      var frag = document.createDocumentFragment();

      for (var d = 1; d <= 31; d++) {
        var btn = document.createElement('button');
        btn.className = 'day-pill';
        btn.textContent = d;
        btn.dataset.day = d;
        btn.type = 'button';
        frag.appendChild(btn);
      }

      dayGrid.appendChild(frag);
    }

    /** 根据选中月份 dim 超出天数并同步今日标记 */
    function syncDayDim(month) {
      if (month <= 0) {
        // 未选月份：清除所有 dim 和 today
        dayGrid.querySelectorAll('.day-pill').forEach(function (btn) {
          btn.classList.remove('dimmed', 'today');
        });
        return;
      }
      var maxDay = daysInMonth(month);
      dayGrid.querySelectorAll('.day-pill').forEach(function (btn) {
        var d = parseInt(btn.dataset.day);
        btn.classList.toggle('dimmed', d > maxDay);
        btn.classList.toggle('today', month === todayMonth && d === todayDay);
      });
    }

    /* ---- 高亮 ---- */

    function syncMonths(month) {
      monthsEl.querySelectorAll('.tarot-card').forEach(function (c) {
        c.classList.remove('active', 'matched');
        if (parseInt(c.dataset.month) === month) {
          c.classList.add(orbitState.confirmed ? 'matched' : 'active');
        }
      });
    }

    function syncDayHighlight(day) {
      dayGrid.querySelectorAll('.day-pill').forEach(function (c) {
        c.classList.remove('active', 'matched');
        if (parseInt(c.dataset.day) === day) {
          c.classList.add(orbitState.confirmed ? 'matched' : 'active');
        }
      });
    }

    function clearAllHighlight() {
      monthsEl.querySelectorAll('.tarot-card').forEach(function (c) { c.classList.remove('active', 'matched'); });
      dayGrid.querySelectorAll('.day-pill').forEach(function (c) { c.classList.remove('active', 'matched'); });
    }

    /* ---- 发光 + 提示 ---- */

    function updateHint() {
      if (!hintEl) return;
      hintEl.style.opacity = '';
      var hm = orbitState.month > 0, hd = orbitState.day > 0;

      if (hm && hd) {
        var sign = getZodiacSign(orbitState.month, orbitState.day);
        var idx = findConstellationIndex(sign.nameCN);
        orbitState.activeSignIndex = idx;
        _updateGlow(idx, 2);
        hintEl.textContent = orbitState.month + '月' + orbitState.day + '日 · ' + sign.nameCN;
        if (oracleEl) oracleEl.textContent = sign.emoji;
        if (confirmBtn) confirmBtn.style.display = '';
        fireStarBeam(false);
      } else if (hm) {
        var names = MONTH_TO_SIGNS[orbitState.month];
        var idx = findConstellationIndex(names[0]);
        orbitState.activeSignIndex = idx;
        _updateGlow(idx, 1);
        hintEl.textContent = orbitState.month + '月 · 选一个日期星丸';
        if (oracleEl) oracleEl.textContent = '';
        if (confirmBtn) confirmBtn.style.display = 'none';
      } else if (hd) {
        orbitState.activeSignIndex = -1;
        _updateGlow(-1, 0);
        hintEl.textContent = orbitState.day + '日 · 再选一张月份符卡';
        if (oracleEl) oracleEl.textContent = '';
        if (confirmBtn) confirmBtn.style.display = 'none';
      } else {
        orbitState.activeSignIndex = -1;
        _updateGlow(-1, 0);
        hintEl.textContent = '选月份符卡 · 再选日期星丸';
        if (oracleEl) oracleEl.textContent = '';
        if (confirmBtn) confirmBtn.style.display = 'none';
      }
      if (window.twemoji && oracleEl) window.twemoji.parse(oracleEl);
    }

    /* ---- 月份符卡点击 ---- */
    monthsEl.addEventListener('click', function (e) {
      var card = e.target.closest('.tarot-card');
      if (!card || !card.dataset.month || orbitState.confirmed) return;
      clearAutoReset();
      var m = parseInt(card.dataset.month);
      orbitState.month = m;
      orbitState.day = 0; // 切月份清空已选日期，重新选
      syncDayDim(m);
      syncMonths(m);
      // 清除残留的日期高亮
      dayGrid.querySelectorAll('.day-pill').forEach(function (btn) {
        btn.classList.remove('active', 'matched');
      });
      updateHint();
      scheduleAutoReset();
    });

    /* ---- 日期星丸点击 ---- */
    dayGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('.day-pill');
      if (!btn || !btn.dataset.day || orbitState.confirmed || btn.classList.contains('dimmed')) return;
      clearAutoReset();
      orbitState.day = parseInt(btn.dataset.day);
      syncDayHighlight(orbitState.day);
      updateHint();
      scheduleAutoReset();
    });

    /* ---- 揭晓 ---- */
    function doConfirm() {
      if (orbitState.month <= 0 || orbitState.day <= 0) return;
      clearAutoReset();
      orbitState.confirmed = true;
      var sign = getZodiacSign(orbitState.month, orbitState.day);
      orbitState.activeSignIndex = findConstellationIndex(sign.nameCN);
      _updateGlow(orbitState.activeSignIndex, 3);
      if (typeof window._spawnCelebrate === 'function') window._spawnCelebrate(orbitState.activeSignIndex);
      syncMonths(orbitState.month);
      syncDayHighlight(orbitState.day);
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
    confirmBtn.addEventListener('touchend', function (e) { e.preventDefault(); doConfirm(); });

    function resetState() {
      clearAutoReset();
      orbitState.month = 0;
      orbitState.day = 0;
      orbitState.activeSignIndex = -1;
      orbitState.confirmed = false;
      _updateGlow(-1, 0);
      clearAllHighlight();
      syncDayDim(0);
      confirmBtn.style.display = 'none';
      resultEl.style.display = 'none';
      resultEl.innerHTML = '';
      hintEl.style.opacity = '';
      hintEl.textContent = '选月份符卡 · 再选日期星丸';
      oracleEl.textContent = '';
    }

    // 暴露白天 resetState 给主题切换调用
    window._resetTarot = resetState;

    /* ---- 重新选择按钮事件 ---- */
    resultEl.addEventListener('click', function (e) {
      if (e.target && (e.target.id === 'orbit-redo' || (e.target.parentNode && e.target.parentNode.id === 'orbit-redo'))) resetState();
    });

    /* ---- 自动复位 ---- */
    var _arTimer = null;
    function clearAutoReset() { if (_arTimer) { clearTimeout(_arTimer); _arTimer = null; } }
    function scheduleAutoReset() { clearAutoReset(); _arTimer = setTimeout(resetState, 12000); }

    /* ---- 启动 ---- */
    renderDayPills();

    setTimeout(function () {
      if (!orbitState.month && !orbitState.confirmed) hintEl.style.opacity = '0.3';
    }, 8000);
    _tarotInited = true;
  }

  // ==================== 2B. 星环日轨（夜间模式专用） ====================

  /** 日轨全局状态（供 Canvas 发光渲染读取） */
  var orbitState = {
    month: 0,           // 0=未选
    day: 0,             // 0=未选
    activeSignIndex: -1, // 当前高亮的星座索引（-1=无）
    confirmed: false     // 是否已确认
  };

  /** 月份 → 星座映射（月份可能跨两个星座，取该月大部分所属） */
  var MONTH_TO_SIGNS = [
    [],           // 0 — 占位
    ['水瓶座'],    // 1 月（1.20前摩羯，之后水瓶；取水瓶简化）
    ['双鱼座'],    // 2 月
    ['白羊座'],    // 3 月
    ['金牛座'],    // 4 月
    ['双子座'],    // 5 月
    ['巨蟹座'],    // 6 月
    ['狮子座'],    // 7 月
    ['处女座'],    // 8 月
    ['天秤座'],    // 9 月
    ['天蝎座'],    // 10月
    ['射手座'],    // 11月
    ['摩羯座'],    // 12月
  ];

  /** 根据星座名找到 CONSTELLATIONS 数组中的索引 */
  function findConstellationIndex(nameCN) {
    for (var i = 0; i < CONSTELLATIONS.length; i++) {
      if (CONSTELLATIONS[i].name === nameCN) return i;
    }
    return -1;
  }

  /** 计算该月天数（用 Date 准确判断闰年） */
  function daysInMonth(m) {
    // new Date(year, m, 0) 返回 m 月的最后一天（Date 的 month 参数 0-based）
    var year = new Date().getFullYear();
    return new Date(year, m, 0).getDate();
  }

  function initOrbit() {
    if (_orbitInited) return;
    var orbitRing = document.getElementById('orbit-ring');
    var outerNodes = document.getElementById('orbit-outer-nodes');
    var innerNodes = document.getElementById('orbit-inner-nodes');
    var outerGroup = document.getElementById('orbit-outer-group');
    var innerGroup = document.getElementById('orbit-inner-group');
    var confirmBtn = document.getElementById('orbit-confirm');
    var hintEl = document.getElementById('orbit-hint');
    var resultEl = document.getElementById('orbit-result-ring');
    var centerLabel = document.getElementById('orbit-center-label');
    var sparkOuter = document.getElementById('orbit-spark-outer');
    var sparkInner = document.getElementById('orbit-spark-inner');

    if (!orbitRing || !outerNodes || !innerNodes || !outerGroup || !innerGroup) return;

    var orbitSvg = orbitRing.querySelector('.orbit-svg');
    var svgR = 300; // viewBox 半径
    var outerR = 240;
    var innerR = 140;

    // 内外圈各自独立旋转角度（度）— 持续自转，点击选星不打断
    var outerRot = 0;
    var innerRot = 0;

    function applyRot() {
      orbitSvg.style.setProperty('--outer-rot', outerRot + 'deg');
      orbitSvg.style.setProperty('--inner-rot', innerRot + 'deg');
    }

    // 星环自转 — 外圈顺时针、内圈逆时针，选星/确认均不打断，永不停歇
    var DRIFT_OUTER = 0.02;  // 度/帧 ≈ 1.2°/s，约 5 分钟一圈
    var DRIFT_INNER = -0.03; // 内圈反向略快

    /** 持续自转 — 注册到全局 rAF 调度（main.js _globalLoop） */
    function rotTick() {
      if (orbitRing.style.display === 'none') return;
      outerRot += DRIFT_OUTER;
      innerRot += DRIFT_INNER;
      // 角度防溢出归一（页面长时间挂机）
      if (outerRot > 36000) outerRot -= 36000;
      if (innerRot < -36000) innerRot += 36000;
      applyRot();
    }
    if (typeof window._registerTick === 'function') {
      window._registerTick(rotTick);
    }

    // ---- 渲染外圈 12 个月节点 ----
    var outerFrag = document.createDocumentFragment();
    for (var m = 1; m <= 12; m++) {
      var angle = (m - 1) / 12 * Math.PI * 2 - Math.PI / 2; // 1月从顶部开始
      var cx = svgR + outerR * Math.cos(angle);
      var cy = svgR + outerR * Math.sin(angle);
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', '4');
      circle.setAttribute('class', 'orbit-node');
      circle.dataset.month = m;
      // 呼吸闪烁随机周期/相位（负延迟避免启动同闪）
      circle.style.setProperty('--twinkle-dur', (3 + Math.random() * 3).toFixed(1) + 's');
      circle.style.setProperty('--twinkle-delay', (-Math.random() * 4).toFixed(1) + 's');
      outerFrag.appendChild(circle);
    }
    outerNodes.appendChild(outerFrag);

    // ---- 轨道碎屑粒子（漂浮光点，沿轨道流动） ----
    var debrisG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    debrisG.setAttribute('class', 'orbit-debris');
    // 在外圈和内圈轨道上各散布若干碎屑光点
    var debrisRings = [
      { r: outerR, fill: 'rgba(137, 196, 225, 0.55)', size: 2, count: 8, drift: 48 },
      { r: innerR, fill: 'rgba(137, 196, 225, 0.3)', size: 1.3, count: 6, drift: 64 }
    ];
    for (var dr = 0; dr < debrisRings.length; dr++) {
      var cfg = debrisRings[dr];
      for (var db = 0; db < cfg.count; db++) {
        var debrisAngle = (db / cfg.count) * Math.PI * 2;
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        // 统一放在 0 弧度位（3 点钟方向），由 CSS rotate(--debris-angle) 摆到各自轨道相位
        dot.setAttribute('cx', svgR + cfg.r);
        dot.setAttribute('cy', svgR);
        dot.setAttribute('r', cfg.size);
        dot.setAttribute('class', 'orbit-debris-dot');
        dot.setAttribute('fill', cfg.fill);
        // CSS 变量：起始相位角、绕环漂移周期、闪烁周期；负延迟错开闪烁相位且避免启动跳变
        dot.style.setProperty('--debris-angle', debrisAngle.toFixed(3) + 'rad');
        dot.style.setProperty('--debris-speed', (cfg.drift + db * 5) + 's');
        dot.style.setProperty('--debris-twinkle', (2.5 + db * 0.7).toFixed(1) + 's');
        dot.style.setProperty('--debris-phase', (-db * 0.7).toFixed(2) + 's');
        debrisG.appendChild(dot);
      }
    }
    orbitSvg.appendChild(debrisG);

    // ---- 动效：点击涟漪 / 落定脉冲 / 连珠光束 / 确认爆发 ----

    /** 在星点位置迸发一圈扩散波纹（动画结束自删）
     *  parent 传旋转组时涟漪随星移动；maxR 控制扩散半径；gold 金色版 */
    function spawnRipple(parent, cx, cy, maxR, gold) {
      var rp = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      rp.setAttribute('cx', cx);
      rp.setAttribute('cy', cy);
      rp.setAttribute('r', 5);
      rp.setAttribute('class', 'orbit-ripple');
      if (maxR) rp.style.setProperty('--ripple-max', maxR);
      if (gold) {
        rp.style.stroke = 'rgba(240, 192, 96, 0.85)';
        rp.style.animationDuration = '0.9s';
      }
      parent.appendChild(rp);
      setTimeout(function () { if (rp.parentNode) rp.parentNode.removeChild(rp); }, 1200);
    }

    /** 引导光束 — 月日选齐时从星环射向星图上对应星座（Canvas 绘制，闪烁后消散） */
    function fireStarBeam(gold) {
      if (orbitState.month > 0 && orbitState.day > 0 && typeof window._spawnStarBeam === 'function') {
        window._spawnStarBeam(orbitState.activeSignIndex, gold);
      }
    }

    /** 中心标注脉冲 — 月日汇聚 / 确认时的反馈 */
    function pulseCenterLabel() {
      if (!centerLabel) return;
      centerLabel.classList.remove('pulse');
      void centerLabel.offsetWidth; // 强制回流，确保连续触发时动画重启
      centerLabel.classList.add('pulse');
      setTimeout(function () { centerLabel.classList.remove('pulse'); }, 600);
    }

    /** 四芒星光 — 移到选中星位置并点亮（随所在圈同转） */
    function showSpark(sparkEl, node) {
      if (!sparkEl) return;
      sparkEl.setAttribute('transform', 'translate(' + node.getAttribute('cx') + ' ' + node.getAttribute('cy') + ')');
      sparkEl.classList.add('on');
    }
    function hideSpark(sparkEl) {
      if (sparkEl) sparkEl.classList.remove('on', 'gold');
    }

    /** 确认爆发 — 星环中心金色星屑四散 + 金色大涟漪扩至外圈 */
    function spawnBurst() {
      for (var bi = 0; bi < 14; bi++) {
        var bAng = (bi / 14) * Math.PI * 2 + Math.random() * 0.4;
        var bDist = 60 + Math.random() * 120;
        var bDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bDot.setAttribute('cx', 300);
        bDot.setAttribute('cy', 300);
        bDot.setAttribute('r', (1.6 + Math.random() * 1.8).toFixed(1));
        bDot.setAttribute('class', 'orbit-burst-dot');
        bDot.style.setProperty('--burst-dx', (Math.cos(bAng) * bDist).toFixed(1) + 'px');
        bDot.style.setProperty('--burst-dy', (Math.sin(bAng) * bDist).toFixed(1) + 'px');
        bDot.style.animationDelay = (Math.random() * 0.08).toFixed(2) + 's';
        orbitSvg.appendChild(bDot);
        (function (d) {
          setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1200);
        })(bDot);
      }
      spawnRipple(orbitSvg, 300, 300, '250px', true);
    }

    // ---- 渲染内圈日期节点（初始 31 天，随月份变化） ----
    function renderDayNodes(month) {
      innerNodes.innerHTML = '';
      var count = daysInMonth(month || 1);
      var frag = document.createDocumentFragment();
      for (var d = 1; d <= count; d++) {
        var angle = (d - 1) / count * Math.PI * 2 - Math.PI / 2;
        var cx = svgR + innerR * Math.cos(angle);
        var cy = svgR + innerR * Math.sin(angle);
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', '3');
        circle.setAttribute('class', 'orbit-node');
        circle.dataset.day = d;
        circle.style.setProperty('--twinkle-dur', (3 + Math.random() * 3).toFixed(1) + 's');
        circle.style.setProperty('--twinkle-delay', (-Math.random() * 4).toFixed(1) + 's');
        frag.appendChild(circle);
      }
      innerNodes.appendChild(frag);
    }
    renderDayNodes(1); // 默认显示 31 天

    // 高亮外圈节点
    function highlightOuter(month) {
      var allNodes = outerNodes.querySelectorAll('.orbit-node');
      allNodes.forEach(function (n) {
        n.classList.remove('active', 'matched');
        if (parseInt(n.dataset.month) === month) {
          n.classList.add(orbitState.confirmed ? 'matched' : 'active');
        }
      });
    }

    // 高亮内圈节点（确认后转金色 matched，与外圈一致）
    function highlightInner(day) {
      var allNodes = innerNodes.querySelectorAll('.orbit-node');
      allNodes.forEach(function (n) {
        n.classList.remove('active', 'matched');
        if (parseInt(n.dataset.day) === day) {
          n.classList.add(orbitState.confirmed ? 'matched' : 'active');
        }
      });
    }

    // 清除所有高亮
    function clearHighlight() {
      outerNodes.querySelectorAll('.orbit-node').forEach(function (n) { n.classList.remove('active', 'matched'); });
      innerNodes.querySelectorAll('.orbit-node').forEach(function (n) { n.classList.remove('active', 'matched'); });
    }

    // 更新 Canvas 发光状态（调用共享函数 _updateGlow）

    /** 中心数字标注 — 无参时显示已选月/日；传 previewText 时临时预览（hover 星点） */
    function syncCenterLabel(previewText) {
      if (!centerLabel) return;
      if (previewText) {
        centerLabel.textContent = previewText;
        return;
      }
      var parts = [];
      if (orbitState.month > 0) parts.push(orbitState.month + '月');
      if (orbitState.day > 0) parts.push(orbitState.day + '日');
      centerLabel.textContent = parts.join('');
    }

    // 更新提示文字和确认按钮（月份和日期各自独立后的综合判断）
    function updateHintAndButton() {
      hintEl.style.opacity = ''; // 有操作即恢复提示可见（对冲初始 8s 渐隐）
      var hasMonth = orbitState.month > 0;
      var hasDay = orbitState.day > 0;

      if (hasMonth && hasDay) {
        // 两个都选了 → 精确星座 + 显示确认按钮（updateGlow 幂等，无条件升级到级 2）
        var exactSign = getZodiacSign(orbitState.month, orbitState.day);
        var exactIdx = findConstellationIndex(exactSign.nameCN);
        orbitState.activeSignIndex = exactIdx;
        _updateGlow(exactIdx, 2);
        hintEl.textContent = orbitState.month + '月' + orbitState.day + '日 · ' + exactSign.nameCN;
        confirmBtn.style.display = '';
        pulseCenterLabel(); // 月日汇聚反馈
        fireStarBeam(false); // 射出引导光束点亮星图
      } else if (hasMonth) {
        // 只选了月份 → 月份范围发光
        var signNames = MONTH_TO_SIGNS[orbitState.month];
        var idx = findConstellationIndex(signNames[0]);
        orbitState.activeSignIndex = idx;
        _updateGlow(idx, 1);
        hintEl.textContent = orbitState.month + '月 · ' + (signNames[0] || '—');
        confirmBtn.style.display = 'none';
      } else if (hasDay) {
        // 只选了日期 → 引导补选月份
        orbitState.activeSignIndex = -1;
        _updateGlow(-1, 0);
        hintEl.textContent = orbitState.day + '日 · 再点外圈选月份';
        confirmBtn.style.display = 'none';
      } else {
        // 都没选
        orbitState.activeSignIndex = -1;
        _updateGlow(-1, 0);
        hintEl.textContent = '点外圈选月份 · 点内圈选日期';
        confirmBtn.style.display = 'none';
      }
      syncCenterLabel();
    }

    // 设置确认状态
    function confirmSign() {
      if (orbitState.month <= 0 || orbitState.day <= 0) return;
      clearAutoReset(); // 确认后结果常驻，不再被无操作定时器复位
      orbitState.confirmed = true;

      var sign = getZodiacSign(orbitState.month, orbitState.day);
      // 找到该星座在 CONSTELLATIONS 中的索引（如果存在）
      orbitState.activeSignIndex = findConstellationIndex(sign.nameCN);

      // Canvas 发光等级 3（确认锁定）
      _updateGlow(orbitState.activeSignIndex, 3);

      // 庆祝粒子弧线（Canvas 中爆发金色粒子）
      if (typeof window._spawnCelebrate === 'function') {
        window._spawnCelebrate(orbitState.activeSignIndex);
      }

      // 外圈月星 + 内圈日星均转为金色 matched，四芒星光转金
      highlightOuter(orbitState.month);
      highlightInner(orbitState.day);
      if (sparkOuter) sparkOuter.classList.add('gold');
      if (sparkInner) sparkInner.classList.add('gold');

      // 星环中心金色爆发 + 金色光束射向星座 + 中心脉冲（高潮反馈就在用户视线处）
      spawnBurst();
      fireStarBeam(true);
      pulseCenterLabel();

      // 隐藏确认按钮、提示，显示结果
      confirmBtn.style.display = 'none';
      hintEl.style.opacity = '0';
      resultEl.style.display = '';
      resultEl.innerHTML =
        '<button class="orbit-redo" id="orbit-redo" type="button">重新选择</button>';
      syncCenterLabel();

      // 切换运势为访客星座
      if (typeof setFortuneSign === 'function') {
        setFortuneSign(sign);
      }
    }

    // 重置状态（重新选择）
    function resetState() {
      clearAutoReset();
      orbitState.month = 0;
      orbitState.day = 0;
      orbitState.activeSignIndex = -1;
      orbitState.confirmed = false;
      _updateGlow(-1, 0);
      clearHighlight();
      confirmBtn.style.display = 'none';
      resultEl.style.display = 'none';
      resultEl.innerHTML = '';
      hintEl.style.opacity = '';
      hintEl.textContent = '点外圈选月份 · 点内圈选日期';
      renderDayNodes(1);
      hideSpark(sparkOuter);
      hideSpark(sparkInner);
      syncCenterLabel();
    }

    // 夜间模式覆盖公共重新选择
    window._resetOrbit = resetState;

    // ---- 事件绑定 ----
    var autoResetTimer = null;

    function clearAutoReset() {
      if (autoResetTimer) { clearTimeout(autoResetTimer); autoResetTimer = null; }
    }

    function scheduleAutoReset() {
      clearAutoReset();
      autoResetTimer = setTimeout(resetState, 12000); // 12s 无操作复位
    }

    // ---- 选中外圈月星 ----
    function selectOuter(node) {
      clearAutoReset();
      spawnRipple(outerGroup, node.getAttribute('cx'), node.getAttribute('cy'), '30px');
      var month = parseInt(node.dataset.month);
      orbitState.month = month;
      // 换月重绘内圈（天数可能不同）；已选日期保留，超出新月天数则清除
      renderDayNodes(month);
      if (orbitState.day > daysInMonth(month)) orbitState.day = 0;
      if (orbitState.day > 0) {
        // 恢复日期高亮与四芒（新月份节点角度可能不同，重新定位）
        highlightInner(orbitState.day);
        var dayNode = innerNodes.querySelector('[data-day="' + orbitState.day + '"]');
        if (dayNode) showSpark(sparkInner, dayNode);
      } else {
        hideSpark(sparkInner);
      }
      highlightOuter(month);
      showSpark(sparkOuter, node);
      updateHintAndButton();
      scheduleAutoReset();
    }

    // ---- 选中内圈日星 ----
    function selectInner(node) {
      clearAutoReset();
      spawnRipple(innerGroup, node.getAttribute('cx'), node.getAttribute('cy'), '24px');
      orbitState.day = parseInt(node.dataset.day);
      highlightInner(orbitState.day);
      showSpark(sparkInner, node);
      updateHintAndButton();
      scheduleAutoReset();
    }

    // ---- 节点点击：事件委托绑在容器上，renderDayNodes 重建节点后无需重绑 ----
    // 已确认时点击星环无效（复位入口为结果面板的「重新选择」按钮）
    outerNodes.addEventListener('click', function (e) {
      var n = e.target;
      if (!orbitState.confirmed && n.dataset && n.dataset.month) {
        e.stopPropagation();
        selectOuter(n);
      }
    });
    innerNodes.addEventListener('click', function (e) {
      var n = e.target;
      if (!orbitState.confirmed && n.dataset && n.dataset.day) {
        e.stopPropagation();
        selectInner(n);
      }
    });

    // ---- hover 星点 → 中心预览数字（移动端无 hover，点击后由 syncCenterLabel 反馈） ----
    outerNodes.addEventListener('mouseover', function (e) {
      if (!orbitState.confirmed && e.target.dataset && e.target.dataset.month) {
        syncCenterLabel(e.target.dataset.month + '月');
      }
    });
    outerNodes.addEventListener('mouseout', function () { syncCenterLabel(); });
    innerNodes.addEventListener('mouseover', function (e) {
      if (!orbitState.confirmed && e.target.dataset && e.target.dataset.day) {
        syncCenterLabel(e.target.dataset.day + '日');
      }
    });
    innerNodes.addEventListener('mouseout', function () { syncCenterLabel(); });

    // 确认按钮
    confirmBtn.addEventListener('click', function () {
      confirmSign();
    });
    confirmBtn.addEventListener('touchend', function (e) {
      e.preventDefault(); // 阻止触摸后的模拟 click 造成二次确认
      confirmSign();
    });

    // 结果面板 — 重新选择
    resultEl.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.id === 'orbit-redo') resetState();
    });

    // 初始提示 8s 后渐隐
    setTimeout(function () {
      if (!orbitState.month && !orbitState.confirmed) {
        hintEl.style.opacity = '0.3';
      }
    }, 8000);
    _orbitInited = true;
  }

  // ==================== 3. 星空粒子网络 ====================

  // 12 黄道星座 — 星点/折线取自经典星座绘图数据（0~1 等比画布坐标，lines 为折线笔画）
  // generate() 时按真实屏幕尺寸等比缩放到各自锚点块内，任何屏幕形状不变形
  var CONSTELLATION_SHAPES = {
    '白羊座': {
      pts: [[0.30,0.78],[0.34,0.66],[0.28,0.48],[0.60,0.26],[0.65,0.20],[0.71,0.23],[0.70,0.32],[0.72,0.36]],
      lines: [[0,1,2,3,4,5],[3,6,7]] },
    '金牛座': {
      pts: [[0.29,0.21],[0.39,0.36],[0.50,0.51],[0.50,0.57],[0.61,0.63],[0.77,0.71],[0.79,0.79],[0.22,0.43],[0.39,0.57],[0.60,0.71],[0.67,0.76]],
      lines: [[0,1,2,3,4,5,6],[7,8,3],[4,9,10]] },
    '双子座': {
      pts: [[0.18,0.37],[0.25,0.45],[0.35,0.55],[0.39,0.68],[0.49,0.77],[0.51,0.63],[0.57,0.78],[0.28,0.29],[0.42,0.32],[0.61,0.49],[0.72,0.60],[0.83,0.59],[0.69,0.75],[0.22,0.54],[0.35,0.43],[0.48,0.21]],
      lines: [[0,1,2,3,4],[2,5,6],[7,8,9,10,11],[9,12],[13,1,14,8,15]] },
    '巨蟹座': {
      pts: [[0.16,0.39],[0.27,0.36],[0.52,0.49],[0.57,0.65],[0.83,0.78],[0.44,0.21]],
      lines: [[0,1,2,3,4],[2,5]] },
    '狮子座': {
      pts: [[0.16,0.75],[0.23,0.67],[0.39,0.77],[0.71,0.53],[0.64,0.39],[0.55,0.37],[0.47,0.27],[0.54,0.24],[0.60,0.27],[0.85,0.56]],
      lines: [[0,1,2,3,4,5,6,7,8],[3,9]] },
    '处女座': {
      pts: [[0.16,0.59],[0.35,0.63],[0.44,0.70],[0.62,0.51],[0.77,0.46],[0.84,0.37],[0.60,0.42],[0.65,0.26],[0.34,0.75]],
      lines: [[0,1,2,3,4,5],[3,6,7],[2,8]] },
    '天秤座': {
      pts: [[0.16,0.67],[0.34,0.60],[0.60,0.27],[0.75,0.23],[0.84,0.47],[0.63,0.74],[0.51,0.78]],
      lines: [[0,1,2,3,4,5,6]] },
    '天蝎座': {
      pts: [[0.17,0.50],[0.28,0.63],[0.19,0.70],[0.28,0.78],[0.41,0.77],[0.49,0.72],[0.57,0.55],[0.59,0.44],[0.69,0.31],[0.74,0.21],[0.82,0.29],[0.79,0.44],[0.73,0.50],[0.38,0.47]],
      lines: [[0,1,2,3,4,5,6,7,8,9,10,11,12],[1,13],[8,11]] },
    '射手座': {
      pts: [[0.22,0.66],[0.24,0.51],[0.45,0.40],[0.54,0.37],[0.59,0.43],[0.66,0.50],[0.63,0.60],[0.66,0.67],[0.74,0.53],[0.77,0.39],[0.49,0.47],[0.29,0.68],[0.30,0.78],[0.48,0.21],[0.52,0.27],[0.59,0.29]],
      lines: [[0,1,2,3,4,5,6,7,8,9],[2,10,11,12],[10,4],[13,14,15,3],[14,3]] },
    '摩羯座': {
      pts: [[0.78,0.21],[0.78,0.34],[0.75,0.45],[0.75,0.70],[0.69,0.78],[0.31,0.66],[0.22,0.49],[0.30,0.53],[0.53,0.54]],
      lines: [[0,1,2,3,4,5,6,7,8,1]] },
    '水瓶座': {
      pts: [[0.45,0.21],[0.37,0.35],[0.27,0.51],[0.30,0.58],[0.29,0.64],[0.48,0.79],[0.51,0.71],[0.58,0.68],[0.73,0.74],[0.43,0.53],[0.53,0.47]],
      lines: [[0,1,2,3,4,5,6,7,8],[2,9,10]] },
    '双鱼座': {
      pts: [[0.28,0.43],[0.28,0.53],[0.36,0.73],[0.43,0.78],[0.50,0.70],[0.53,0.62],[0.57,0.58],[0.63,0.43],[0.67,0.39],[0.74,0.39],[0.77,0.34],[0.72,0.30],[0.75,0.22],[0.23,0.50],[0.66,0.33]],
      lines: [[0,1,2,3,4,5,6,7,8,9,10,11,12],[0,13,1],[8,14,11]] }
  };

  /** 生成星座锚点 — 动态计算以支持 resize 时切换布局 */
  function getAnchors() {
    return window.innerWidth > 768
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
      out.push({
        name: order[i], pts: shape.pts, edges: edges, bright: [],
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

    /** 在指定星座节点位置生成绚丽庆祝粒子（手机端从确认按钮位置爆发） */
    function spawnCelebrate(constIndex) {
      if (constIndex < 0) return;
      var srcX, srcY;

      if (window.innerWidth <= 768) {
        // 手机端：优先以星环中心为爆发源，星环隐藏时回退到确认按钮
        var ring = document.getElementById('orbit-ring');
        var sRect = section.getBoundingClientRect();
        if (ring && ring.style.display !== 'none') {
          var rRect = ring.getBoundingClientRect();
          srcX = rRect.left + rRect.width / 2 - sRect.left;
          srcY = rRect.top + rRect.height / 2 - sRect.top;
        } else {
          var btn = document.getElementById('tarot-confirm') || document.getElementById('orbit-confirm');
          if (!btn) return;
          var bRect = btn.getBoundingClientRect();
          srcX = bRect.left + bRect.width / 2 - sRect.left;
          srcY = bRect.top + bRect.height / 2 - sRect.top;
        }
      } else {
        // 桌面端：以星座中心为爆发源
        var nodes = [];
        for (var i = 0; i < cNodes.length; i++) {
          if (cNodes[i].constIndex === constIndex) nodes.push(cNodes[i]);
        }
        if (!nodes.length) return;
        srcX = 0; srcY = 0;
        for (var n = 0; n < nodes.length; n++) { srcX += nodes[n].cx; srcY += nodes[n].cy; }
        srcX /= nodes.length; srcY /= nodes.length;
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
    // 暴露给 initOrbit 调用
    window._spawnCelebrate = spawnCelebrate;

    // 星环 → 星座 引导光束（月日选齐/确认时闪现一次后消散）
    var starBeams = []; // [{x1,y1,x2,y2, life, maxLife, gold}]

    /** 从星环双星对齐位（6 点方向）射向对应星座中心的光束（手机端不生成） */
    function spawnStarBeam(constIndex, gold) {
      if (window.innerWidth <= 768) return; // 手机端无引导光束
      if (constIndex < 0 || constIndex >= CONSTELLATIONS.length) return;
      var nodes = [];
      for (var i = 0; i < cNodes.length; i++) {
        if (cNodes[i].constIndex === constIndex) nodes.push(cNodes[i]);
      }
      if (!nodes.length) return;
      var tx = 0, ty = 0;
      for (var n = 0; n < nodes.length; n++) { tx += nodes[n].cx; ty += nodes[n].cy; }
      tx /= nodes.length; ty /= nodes.length;
      // 起点：星环中心，DOM 矩形换算到 Canvas 坐标
      var ring = document.getElementById('orbit-ring');
      if (!ring) return;
      var sRect = section.getBoundingClientRect();
      var rRect = ring.getBoundingClientRect();
      var sx = rRect.left + rRect.width / 2 - sRect.left;
      var sy = rRect.top + rRect.height / 2 - sRect.top;
      starBeams.push({ x1: sx, y1: sy, x2: tx, y2: ty, life: 1300, maxLife: 1300, gold: !!gold });
    }
    // 暴露给 initOrbit 调用
    window._spawnStarBeam = spawnStarBeam;
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
      // 清除 _revealHold
      if (typeof CONSTELLATIONS !== 'undefined') {
        for (var conj = 0; conj < CONSTELLATIONS.length; conj++) {
          CONSTELLATIONS[conj]._revealHold = null;
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
      var freeCount = window.innerWidth <= 768 ? 100 : 200;
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
          cNodes.push({
            rx: (ox + (pts[p][0] - co.minU) * k) / W,
            ry: (oy + (pts[p][1] - co.minV) * k) / H,
            cx: 0, cy: 0,
            constIndex: c,
            vx: 0, vy: 0,
            r: isBright ? 1.5 + Math.random() * 0.7 : 0.8 + Math.random() * 1.0,
            baseAlpha: isBright ? 0.5 + Math.random() * 0.2 : 0.3 + Math.random() * 0.3,
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

    /** 定时调度流星 — 每 2.5~7s 生成一颗，页面隐藏或白天模式跳过 */
    function scheduleMeteor() {
      var delay = 2500 + Math.random() * 4500;
      setTimeout(function () {
        if (!document.hidden && W > 0 && _canvasVisible) spawnMeteor();
        scheduleMeteor();
      }, delay);
    }

    function update(timestamp) {
      // 自由粒子：布朗漂移 + 弹簧回归
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.cx === 0 && p.cy === 0) { p.cx = p.rx * W; p.cy = p.ry * H; }

        var rx = p.rx * W, ry = p.ry * H;

        // 自主微微晃动（布朗漂移）
        var brX = Math.sin(timestamp * 0.0004 + i * 1.7) * 0.08;
        var brY = Math.cos(timestamp * 0.0005 + i * 2.3) * 0.08;

        // 弹簧力 → 初始位 + 漂移偏移
        var fx = (rx - p.cx) * 0.003;
        var fy = (ry - p.cy) * 0.003;

        p.vx += fx; p.vy += fy;
        p.vx *= 0.93; p.vy *= 0.93;
        p.cx += p.vx; p.cy += p.vy;

        // 边界回弹
        if (p.cx < -10) p.vx += 0.3;
        if (p.cx > W + 10) p.vx -= 0.3;
        if (p.cy < -10) p.vy += 0.3;
        if (p.cy > H + 10) p.vy -= 0.3;
      }

      // 星座节点：弹簧回归（无自主晃动，保持形状）+ 发光平滑插值
      // 手机端跳过星座节点更新（连线/光束/节点均不绘制，仅保留庆祝粒子和流星）
      if (window.innerWidth > 768) {
        for (var j = 0; j < cNodes.length; j++) {
          var n = cNodes[j];
          if (n.cx === 0 && n.cy === 0) { n.cx = n.rx * W; n.cy = n.ry * H; }

          var nrx = n.rx * W, nry = n.ry * H;
          var nfx = (nrx - n.cx) * 0.0025;
          var nfy = (nry - n.cy) * 0.0025;

          n.vx += nfx; n.vy += nfy;
          n.vx *= 0.90; n.vy *= 0.90;
          n.cx += n.vx; n.cy += n.vy;

          // 发光等级平滑趋近 — 激活时星点从星空中缓缓浮现，取消时缓缓隐没
          var tg = CONSTELLATIONS[n.constIndex].glowLevel || 0;
          n.glowSmooth += (tg - n.glowSmooth) * 0.06;
        }
      }

      // 星座连线描画：确认后延迟片刻（等引导光束到达）开始逐笔勾勒；取消后渐隐
      // 手机端跳过连线描画状态更新（连线/光束/节点均不绘制）
      if (window.innerWidth > 768) {
        for (var ch = 0; ch < CONSTELLATIONS.length; ch++) {
          var co = CONSTELLATIONS[ch];
          if ((co.glowLevel || 0) >= 3) {
            if (co._revealHold == null) co._revealHold = 26; // ~430ms
            else if (co._revealHold > 0) co._revealHold--;
          } else {
            co._revealHold = null;
          }
        }
        for (var lr = 0; lr < constellationLines.length; lr++) {
          var ln = constellationLines[lr];
          var lco = CONSTELLATIONS[ln.constIndex];
          if ((lco.glowLevel || 0) >= 3 && lco._revealHold === 0) {
            // 链式描画：同星座内前一条线画过 65% 后，本条才动笔（加微小随机延迟，增加手绘感）
            var prevLn = lr > 0 && constellationLines[lr - 1].constIndex === ln.constIndex
              ? constellationLines[lr - 1] : null;
            if (!prevLn || prevLn.reveal > 0.65 + (Math.random() * 0.04)) {
              ln.reveal = Math.min(1, ln.reveal + 0.055);
            }
          } else {
            ln.reveal = Math.max(0, ln.reveal - 0.08);
          }
        }
      }

      // 庆祝粒子衰减 — 位移 + 重力 + 空气阻力 + 闪烁相位
      for (var cp = celebrateParticles.length - 1; cp >= 0; cp--) {
        var cpItem = celebrateParticles[cp];
        cpItem.cx += cpItem.vx;
        cpItem.cy += cpItem.vy;
        cpItem.vy += 0.018; // 重力
        cpItem.vx *= 0.985; // 空气阻力 → 末段渐缓飘落
        cpItem.vy *= 0.985;
        cpItem.spin += cpItem.twinkleSpeed; // 闪烁相位推进
        cpItem.life -= 16;
        if (cpItem.life <= 0) celebrateParticles.splice(cp, 1);
      }

      // 引导光束衰减
      for (var sbu = starBeams.length - 1; sbu >= 0; sbu--) {
        starBeams[sbu].life -= 16;
        if (starBeams[sbu].life <= 0) starBeams.splice(sbu, 1);
      }

      // 流星位移衰减
      for (var mf = meteors.length - 1; mf >= 0; mf--) {
        var mt = meteors[mf];
        mt.x += mt.vx;
        mt.y += mt.vy;
        mt.life -= mt.decay;
        if (mt.life <= 0 || mt.x < -100 || mt.y > H + 100) meteors.splice(mf, 1);
      }
    }

    function draw(timestamp) {
      if (W <= 0 || H <= 0) return;
      // 0. 透明清屏 — 透出全站纯色背景（白天浅蓝 / 夜间深蓝），星座区与页面同色
      ctx.clearRect(0, 0, W, H);

      // 星座连线 — 未激活星座隐藏；手机端完全不画连线
      if (window.innerWidth > 768) {
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        for (var li = 0; li < constellationLines.length; li++) {
          var line = constellationLines[li];
          if (line.reveal <= 0) continue;
          // 未激活星座的连线跳过
          if (!CONSTELLATIONS[line.constIndex] || (CONSTELLATIONS[line.constIndex].glowLevel || 0) === 0) continue;
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
        // 描画笔尖光点
        if (line.reveal < 1) {
          ctx.beginPath();
          ctx.arc(lex, ley, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(250, 225, 170, 0.9)';
          ctx.fill();
        }
      }
      } // end if 桌面端画连线

      // 星环 → 星座 引导光束：延伸（前 28%）→ 闪烁 ~2.5 次 → 淡出（手机端不画）
      if (window.innerWidth > 768) {
      for (var sbd = 0; sbd < starBeams.length; sbd++) {
        var bm = starBeams[sbd];
        var bt = 1 - bm.life / bm.maxLife;
        var reach = Math.min(1, bt / 0.28);
        reach = 1 - (1 - reach) * (1 - reach); // ease-out 延伸
        var bAlpha;
        if (bt < 0.28) {
          bAlpha = 0.75;
        } else if (bt < 0.7) {
          bAlpha = 0.35 + 0.45 * Math.abs(Math.sin((bt - 0.28) / 0.42 * Math.PI * 2.5));
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

        // 外层柔光晕 — 大范围径向辉光
        var glowR = curR * 4.5;
        var glow = ctx.createRadialGradient(cp.cx, cp.cy, 0, cp.cx, cp.cy, glowR);
        glow.addColorStop(0, 'rgba(' + col + ',' + (drawA * 0.55) + ')');
        glow.addColorStop(0.4, 'rgba(' + col + ',' + (drawA * 0.18) + ')');
        glow.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.beginPath();
        ctx.arc(cp.cx, cp.cy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

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

      // 2. 自由粒子
      for (var k = 0; k < particles.length; k++) {
        var p = particles[k];
        var tw = 1 + Math.sin(timestamp * p.twinkleSpeed + p.twinkleOffset) * 0.2;
        var alpha = Math.max(0.05, Math.min(0.85, p.baseAlpha * tw));

        ctx.beginPath();
        ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + theme.rgb + ',' + alpha + ')';
        ctx.fill();
      }

      // 3. 星座节点 — 仅显示 glowLevel > 0 的激活星座；手机端完全不画星座
      for (var m = 0; m < cNodes.length; m++) {
        var nd = cNodes[m];
        // 手机端：跳过星座节点绘制（坐标仍保留供庆祝粒子/光束使用）
        if (window.innerWidth <= 768) continue;
        // glowLevel === 0 → 完全跳过，不留痕迹
        var constGlow = CONSTELLATIONS[nd.constIndex] ? (CONSTELLATIONS[nd.constIndex].glowLevel || 0) : 0;
        if (constGlow === 0) continue;
        var g = nd.glowSmooth; // 0~3 连续插值
        var ntw = 1 + Math.sin(timestamp * nd.twinkleSpeed + nd.twinkleOffset) * 0.2;
        var nAlpha = Math.max(0.05, Math.min(0.85, nd.baseAlpha * ntw));

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
        var glowA = Math.min(0.9, 0.15 + g * 0.24);
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

    }

    // ---- 主循环（注册到全局 rAF 调度） ----

    function tick(ts) {
      if (!_canvasVisible || W <= 0 || H <= 0) return;
      lerpTheme();
      update(ts);
      draw(ts);
    }

    function resize() {
      var dpr = window.devicePixelRatio || 1;
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
    window.addEventListener('resize', resize);
  }

  // ==================== 4. 滚动渐进浮现（IntersectionObserver 驱动） ====================

  function initScrollBehavior() {
    // ---- IntersectionObserver 驱动浮现（替代 scroll + rAF） ----
    var revealEls = document.querySelectorAll('.reveal-up');
    if (!revealEls.length) return;

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
    initStars();   // 必须先初始化星空（CONSTELLATIONS），供日轨查询

    // 日夜双模：白天用塔罗符卡，夜间用星环
    var isNight = document.documentElement.classList.contains('night-mode');
    if (isNight) {
      var deck = document.getElementById('tarot-deck');
      var orbitRing = document.getElementById('orbit-ring');
      if (deck) deck.style.display = 'none';
      if (orbitRing) orbitRing.style.display = '';
      initOrbit();
    } else {
      initTarot();
    }

    // 暴露全局切换函数供 main.js 中日夜切换调用（切换仅做状态重置和显隐控制，不再重新初始化）
    window._onThemeSwitch = function (toNight) {
      // 模式未实际变化时跳过（防止自动定时器每分钟触发重置）
      if (toNight === window._lastNightMode) return;
      window._lastNightMode = toNight;

      // 切换模式时清空共享状态，避免白天/夜间互相影响
      orbitState.month = 0;
      orbitState.day = 0;
      orbitState.activeSignIndex = -1;
      orbitState.confirmed = false;
      _updateGlow(-1, 0);
      // 清空 Canvas 残留粒子/光束，防止白天确认的庆祝粒子在夜间突现
      if (typeof window._clearCanvasEffects === 'function') window._clearCanvasEffects();
      _canvasVisible = toNight;
      var deck = document.getElementById('tarot-deck');
      var orbitRing = document.getElementById('orbit-ring');
      if (toNight) {
        if (deck) deck.style.display = 'none';
        if (orbitRing) orbitRing.style.display = '';
        if (!_orbitInited) { initOrbit(); } else { if (typeof window._resetOrbit === 'function') window._resetOrbit(); }
      } else {
        if (orbitRing) orbitRing.style.display = 'none';
        if (deck) deck.style.display = '';
        if (!_tarotInited) { initTarot(); } else { if (typeof window._resetTarot === 'function') window._resetTarot(); }
      }
    };
    // 记录当前模式，防止下次自动检测时误触发重置
    window._lastNightMode = isNight;

    initScrollBehavior();
  }

  // DOM 加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
