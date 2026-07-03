/* ============================================
   GY · 天空之隙 — 星座星空模块
   生日倒计时 · 星座信息 · 每日运势 · 访客查询
   ============================================ */

(function () {
  'use strict';

  // ==================== 星座数据 ====================

  const ZODIAC = [
    { name: 'aries',       nameCN: '白羊座', emoji: '♈', element: '火', planet: '火星',
      start: [3,21], end: [4,19],
      desc: '热情勇敢、直率坦诚，永远冲在最前面。白羊座是天生的开拓者，行动力爆棚，想到就去做。' },
    { name: 'taurus',      nameCN: '金牛座', emoji: '♉', element: '土', planet: '金星',
      start: [4,20], end: [5,20],
      desc: '稳重踏实、耐心坚韧，对美好事物有天然的感知力。金牛座慢热但长情，值得信赖依靠。' },
    { name: 'gemini',      nameCN: '双子座', emoji: '♊', element: '风', planet: '水星',
      start: [5,21], end: [6,21],
      desc: '聪明灵动、好奇心旺盛，能言善道又幽默风趣。双子座像一阵自由的风，永远活力满满。' },
    { name: 'cancer',      nameCN: '巨蟹座', emoji: '♋', element: '水', planet: '月亮',
      start: [6,22], end: [7,22],
      desc: '温柔细腻、情感丰富，像月光般润物无声。巨蟹座是十二星座中最会照顾人的温暖存在。' },
    { name: 'leo',         nameCN: '狮子座', emoji: '♌', element: '火', planet: '太阳',
      start: [7,23], end: [8,22],
      desc: '自信耀眼、慷慨大方，天生自带聚光灯。狮子座的舞台永远光芒四射，热情感染身边每个人。' },
    { name: 'virgo',       nameCN: '处女座', emoji: '♍', element: '土', planet: '水星',
      start: [8,23], end: [9,22],
      desc: '细致周全、逻辑清晰，追求完美的细节控。处女座的认真和可靠，让所有事情都井井有条。' },
    { name: 'libra',       nameCN: '天秤座', emoji: '♎', element: '风', planet: '金星',
      start: [9,23], end: [10,23],
      desc: '优雅平和、善于沟通，追求平衡与和谐。天秤座是天生社交家，审美在线，风度翩翩。' },
    { name: 'scorpio',     nameCN: '天蝎座', emoji: '♏', element: '水', planet: '冥王星',
      start: [10,24], end: [11,22],
      desc: '深邃敏锐、意志坚定，洞察力极强。天蝎座情感浓烈，一旦认定了就不会轻易放手。' },
    { name: 'sagittarius', nameCN: '射手座', emoji: '♐', element: '火', planet: '木星',
      start: [11,23], end: [12,21],
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

  // ==================== 1. 生日倒计时 ====================

  function initCountdown() {
    var cdDays = document.getElementById('cd-days');
    var cdHours = document.getElementById('cd-hours');
    var cdMins = document.getElementById('cd-mins');
    var cdSecs = document.getElementById('cd-secs');
    var birthdayMsg = document.getElementById('birthday-msg');
    var countdownCard = document.getElementById('countdown-card');
    var birthdayDateEl = document.getElementById('birthday-date');

    // 显示生日和星座
    var mySign = getZodiacSign(BIRTHDAY.month, BIRTHDAY.day);
    birthdayDateEl.textContent = BIRTHDAY.month + '月' + BIRTHDAY.day + '日 · ' + mySign.nameCN;

    function getNextBirthday() {
      var now = new Date();
      var bday = new Date(now.getFullYear(), BIRTHDAY.month - 1, BIRTHDAY.day, 0, 0, 0);
      if (bday <= now) {
        bday.setFullYear(bday.getFullYear() + 1);
      }
      return bday;
    }

    function isBirthdayToday() {
      var now = new Date();
      return now.getMonth() === BIRTHDAY.month - 1 && now.getDate() === BIRTHDAY.day;
    }

    function pad(n, len) {
      return String(n).padStart(len || 2, '0');
    }

    function update() {
      var now = new Date();
      var next = getNextBirthday();
      var diff = next - now;

      if (diff <= 0) {
        // 刚好到生日
        cdDays.textContent = '000';
        cdHours.textContent = '00';
        cdMins.textContent = '00';
        cdSecs.textContent = '00';
        return;
      }

      var totalSec = Math.floor(diff / 1000);
      var days = Math.floor(totalSec / 86400);
      var hours = Math.floor((totalSec % 86400) / 3600);
      var mins = Math.floor((totalSec % 3600) / 60);
      var secs = totalSec % 60;

      cdDays.textContent = pad(days, 3);
      cdHours.textContent = pad(hours);
      cdMins.textContent = pad(mins);
      cdSecs.textContent = pad(secs);
    }

    // 生日当天显示祝贺 + 彩带
    if (isBirthdayToday()) {
      birthdayMsg.style.display = 'block';
      countdownCard.classList.add('birthday-today');
      spawnConfetti();
      // 每 30 秒再放一波彩带
      setInterval(spawnConfetti, 30000);
    }

    update();
    setInterval(update, 1000);
  }

  // ==================== 2. 彩带庆祝特效 ====================

  function spawnConfetti() {
    var container = document.getElementById('confetti-container');
    if (!container) return;

    var colors = [
      '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
      '#FF8FAB', '#FFC93C', '#A66CFF', '#FF6FB7',
      '#89C4E1', '#B3DDF2', '#FFB830', '#FF5D5D'
    ];

    var frag = document.createDocumentFragment();

    for (var i = 0; i < 80; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (2 + Math.random() * 3) + 's';
      piece.style.animationDelay = Math.random() * 1.5 + 's';
      piece.style.width = (6 + Math.random() * 10) + 'px';
      piece.style.height = (8 + Math.random() * 14) + 'px';
      frag.appendChild(piece);
    }

    container.appendChild(frag);

    // 动画结束后清理
    setTimeout(function () {
      if (container.children.length > 200) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
    }, 5000);
  }

  // ==================== 3. 我的星座信息 ====================

  function initMySign() {
    var mySign = getZodiacSign(BIRTHDAY.month, BIRTHDAY.day);

    document.getElementById('my-sign-emoji').textContent = mySign.emoji;
    /* Twemoji 重新解析 — 星座符号跨平台统一渲染 */
    if (window.twemoji) window.twemoji.parse(document.getElementById('my-sign-emoji'));
    document.getElementById('my-sign-name').textContent = mySign.nameCN;
    document.getElementById('my-sign-date').textContent = formatDateRange(mySign);
    document.getElementById('my-sign-element').textContent = mySign.element + '象';
    document.getElementById('my-sign-planet').textContent = mySign.planet;
    document.getElementById('my-sign-desc').textContent = mySign.desc;
  }

  // ==================== 4. 每日运势（调用 API） ====================

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

    // 概述
    var summary = (data.fortunetext && data.fortunetext.all) || data.shortcomment || '';
    document.getElementById('fortune-summary').textContent = summary;

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
    if (ft.health && ft.health.length > 2) detailParts.push('<p><strong>🩺 健康：</strong>' + ft.health + '</p>');
    if (ft.love && ft.love.length > 2) detailParts.push('<p><strong>💕 爱情：</strong>' + ft.love + '</p>');
    if (ft.work && ft.work.length > 2) detailParts.push('<p><strong>💼 工作：</strong>' + ft.work + '</p>');
    if (ft.money && ft.money.length > 2) detailParts.push('<p><strong>💰 财富：</strong>' + ft.money + '</p>');
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

  /** 加载运势 */
  function loadFortune() {
    showFortuneLoading();

    var url = FORTUNE_API + '?type=' + encodeURIComponent(currentFortuneSign.name)
      + '&time=' + encodeURIComponent(currentFortuneTime);

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        document.getElementById('fortune-loading').style.display = 'none';
        if (json.code === 200 && json.data) {
          renderFortune(json.data);
        } else {
          showFortuneError();
        }
      })
      .catch(function () {
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

  // ==================== 5. 访客星座查询 ====================

  function initQuery() {
    var monthSelect = document.getElementById('query-month');
    var daySelect = document.getElementById('query-day');
    var queryBtn = document.getElementById('query-btn');
    var resultDiv = document.getElementById('query-result');

    // 填充月份
    var monthFrag = document.createDocumentFragment();
    var optM = document.createElement('option');
    optM.value = '';
    optM.textContent = '月';
    monthFrag.appendChild(optM);
    for (var m = 1; m <= 12; m++) {
      var opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m + '月';
      monthFrag.appendChild(opt);
    }
    monthSelect.appendChild(monthFrag);

    // 月份变化时更新日期选项
    monthSelect.addEventListener('change', function () {
      var month = parseInt(monthSelect.value, 10);
      daySelect.innerHTML = '';

      var dayFrag = document.createDocumentFragment();
      var optD = document.createElement('option');
      optD.value = '';
      optD.textContent = '日';
      dayFrag.appendChild(optD);

      if (month >= 1 && month <= 12) {
        var maxDay = new Date(2024, month, 0).getDate(); // 2024 是闰年，处理 2 月
        for (var d = 1; d <= maxDay; d++) {
          var od = document.createElement('option');
          od.value = d;
          od.textContent = d + '日';
          dayFrag.appendChild(od);
        }
      }
      daySelect.appendChild(dayFrag);
    });

    var placeholderDiv = document.getElementById('query-placeholder');

    // 查询按钮
    queryBtn.addEventListener('click', function () {
      var month = parseInt(monthSelect.value, 10);
      var day = parseInt(daySelect.value, 10);

      if (!month || !day) {
        queryBtn.textContent = '请选择';
        setTimeout(function () { queryBtn.textContent = '查询'; }, 1500);
        return;
      }

      var sign = getZodiacSign(month, day);

      document.getElementById('query-sign-emoji').textContent = sign.emoji;
      /* Twemoji 重新解析 — 访客查询星座符号 */
      if (window.twemoji) window.twemoji.parse(document.getElementById('query-sign-emoji'));
      document.getElementById('query-sign-name').textContent = sign.nameCN;
      document.getElementById('query-sign-date').textContent = formatDateRange(sign);
      document.getElementById('query-sign-element').textContent = sign.element + '象';
      document.getElementById('query-sign-planet').textContent = sign.planet;
      document.getElementById('query-sign-desc').textContent = sign.desc;

      resultDiv.style.display = 'block';
      if (placeholderDiv) placeholderDiv.style.display = 'none';

      // 运势自动切换为访客的星座
      setFortuneSign(sign);
    });
  }

  // ==================== 6. 星空粒子网络 ====================

  // 7 著名星座：上排 4，下排 3，参考真实星图
  // bright: 标注该星座中最亮的 1-2 颗主星，渲染时更亮更大
  var CONSTELLATIONS = [
    // 白羊座 Aries — 弯曲线条（Hamal 主星）
    { name: '白羊座',
      pts: [[0.10,0.28],[0.14,0.22],[0.18,0.26],[0.22,0.18],[0.26,0.32],[0.16,0.34]],
      edges: [[0,1],[1,2],[2,3],[4,2],[5,0]],
      bright: [0] },
    // 金牛座 Taurus — V 形脸 + 双角（Aldebaran 主星）
    { name: '金牛座',
      pts: [[0.42,0.30],[0.38,0.24],[0.46,0.24],[0.36,0.18],[0.48,0.20],[0.40,0.14],[0.50,0.15]],
      edges: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[1,2]],
      bright: [0] },
    // 双子座 Gemini — 两条平行人形（Castor + Pollux 双主星）
    { name: '双子座',
      pts: [[0.63,0.14],[0.73,0.15],[0.61,0.22],[0.71,0.22],[0.62,0.30],[0.72,0.32],[0.65,0.18],[0.70,0.28]],
      edges: [[0,6],[6,2],[2,4],[1,3],[3,7],[7,5],[0,1]],
      bright: [0,1] },
    // 狮子座 Leo — 镰刀（反问号）+ 尾部三角（Regulus 主星）
    { name: '狮子座',
      pts: [[0.84,0.28],[0.87,0.22],[0.91,0.17],[0.89,0.12],[0.83,0.14],[0.81,0.20],[0.93,0.26],[0.90,0.30]],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,7],[7,6]],
      bright: [0] },
    // 天蝎座 Scorpius — 弯尾 + 三颗头星（Antares 主星）
    { name: '天蝎座',
      pts: [[0.14,0.62],[0.10,0.56],[0.07,0.58],[0.12,0.54],[0.18,0.66],[0.23,0.70],[0.20,0.75]],
      edges: [[2,1],[1,3],[1,0],[0,4],[4,5],[5,6]],
      bright: [0] },
    // 大熊座 Ursa Major — 北斗七星
    { name: '大熊座',
      pts: [[0.37,0.54],[0.41,0.58],[0.47,0.56],[0.50,0.52],[0.56,0.54],[0.57,0.60],[0.55,0.68]],
      edges: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
      bright: [] },
    // 猎户座 Orion — 沙漏形（Betelgeuse + Rigel 双主星）
    { name: '猎户座',
      pts: [[0.68,0.52],[0.77,0.52],[0.70,0.58],[0.72,0.58],[0.74,0.58],[0.67,0.66],[0.78,0.66],[0.72,0.70]],
      edges: [[0,2],[2,3],[3,4],[4,1],[0,1],[2,5],[4,6],[5,7],[7,6]],
      bright: [0,6] },
  ];

  function initStars() {
    var section = document.getElementById('zodiac-section');
    var canvas = document.getElementById('starchart-canvas');
    if (!canvas || !section) return;
    var ctx = canvas.getContext('2d');

    var W, H;
    var particles = [];       // 自由粒子
    var cNodes = [];          // 星座节点
    var ripples = [];         // 点击涟漪 [{x, y, birth, life}]
    var RIPPLE_LIFE = 1500;   // 涟漪生命周期（ms）
    var RIPPLE_RANGE = 250;   // 涟漪推开范围（px）
    var MAX_DIST = 150;       // 连线最大距离

    function hash(seed) {
      var x = Math.sin(seed) * 43758.5453;
      return x - Math.floor(x);
    }

    function generate() {
      particles = [];
      cNodes = [];

      // 自由粒子（星空背景）
      for (var i = 0; i < 200; i++) {
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

      // 星座节点（亮星比普通星更大）
      for (var c = 0; c < CONSTELLATIONS.length; c++) {
        var pts = CONSTELLATIONS[c].pts;
        var brightSet = CONSTELLATIONS[c].bright || [];
        for (var p = 0; p < pts.length; p++) {
          var isBright = false;
          for (var bi = 0; bi < brightSet.length; bi++) {
            if (brightSet[bi] === p) { isBright = true; break; }
          }
          cNodes.push({
            rx: pts[p][0], ry: pts[p][1],
            cx: 0, cy: 0,
            vx: 0, vy: 0,
            r: isBright ? 2.2 + Math.random() * 0.8 : 1.2 + Math.random() * 1.0,
            baseAlpha: isBright ? 0.7 + Math.random() * 0.25 : 0.45 + Math.random() * 0.35,
            bright: isBright,
          });
        }
      }
    }

    function update(timestamp) {
      // 清理过期涟漪
      for (var r = ripples.length - 1; r >= 0; r--) {
        if (timestamp - ripples[r].birth > ripples[r].life) {
          ripples.splice(r, 1);
        }
      }

      // 自由粒子：布朗漂移 + 涟漪推开 + 弹簧回归
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

        // 涟漪推开
        for (var ri = 0; ri < ripples.length; ri++) {
          var rp = ripples[ri];
          var age = timestamp - rp.birth;
          var lifeRatio = 1 - age / rp.life; // 1→0 衰减
          if (lifeRatio <= 0) continue;
          var dx = p.cx - rp.x;
          var dy = p.cy - rp.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var range = RIPPLE_RANGE * lifeRatio;
          if (dist < range && dist > 0.1) {
            var str = (1 - dist / range) * 4 * lifeRatio;
            fx += (dx / dist) * str;
            fy += (dy / dist) * str;
          }
        }

        p.vx += fx; p.vy += fy;
        p.vx *= 0.93; p.vy *= 0.93;
        p.cx += p.vx; p.cy += p.vy;

        // 边界回弹
        if (p.cx < -10) p.vx += 0.3;
        if (p.cx > W + 10) p.vx -= 0.3;
        if (p.cy < -10) p.vy += 0.3;
        if (p.cy > H + 10) p.vy -= 0.3;
      }

      // 星座节点：涟漪推开 + 弹簧回归（无自主晃动，保持形状）
      for (var j = 0; j < cNodes.length; j++) {
        var n = cNodes[j];
        if (n.cx === 0 && n.cy === 0) { n.cx = n.rx * W; n.cy = n.ry * H; }

        var nrx = n.rx * W, nry = n.ry * H;
        var nfx = (nrx - n.cx) * 0.0025;
        var nfy = (nry - n.cy) * 0.0025;

        // 涟漪推开星座节点
        for (var ri = 0; ri < ripples.length; ri++) {
          var rp = ripples[ri];
          var age = timestamp - rp.birth;
          var lifeRatio = 1 - age / rp.life;
          if (lifeRatio <= 0) continue;
          var ndx = n.cx - rp.x;
          var ndy = n.cy - rp.y;
          var ndist = Math.sqrt(ndx * ndx + ndy * ndy);
          var range = (RIPPLE_RANGE + 40) * lifeRatio;
          if (ndist < range && ndist > 0.1) {
            var nstr = (1 - ndist / range) * 3.5 * lifeRatio;
            nfx += (ndx / ndist) * nstr;
            nfy += (ndy / ndist) * nstr;
          }
        }

        n.vx += nfx; n.vy += nfy;
        n.vx *= 0.90; n.vy *= 0.90;
        n.cx += n.vx; n.cy += n.vy;
      }
    }

    function draw(timestamp) {
      if (W <= 0 || H <= 0) return;
      ctx.clearRect(0, 0, W, H);

      // 1. 自由粒子之间的连线（近距离）
      ctx.save();
      for (var i = 0; i < particles.length; i++) {
        var a = particles[i];
        for (var j = i + 1; j < particles.length; j++) {
          var b = particles[j];
          var dx = a.cx - b.cx;
          var dy = a.cy - b.cy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            var lineAlpha = (1 - dist / MAX_DIST) * 0.22;
            ctx.strokeStyle = 'rgba(106, 160, 188, ' + lineAlpha + ')';
            ctx.lineWidth = 0.45;
            ctx.beginPath();
            ctx.moveTo(a.cx, a.cy);
            ctx.lineTo(b.cx, b.cy);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 2. 星座连线
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = 'rgba(106, 160, 188, 0.7)';
      ctx.lineWidth = 0.75;

      for (var c = 0; c < CONSTELLATIONS.length; c++) {
        var con = CONSTELLATIONS[c];
        var edges = con.edges;
        var baseIdx = 0;
        for (var prev = 0; prev < c; prev++) baseIdx += CONSTELLATIONS[prev].pts.length;

        for (var e = 0; e < edges.length; e++) {
          var na = cNodes[baseIdx + edges[e][0]];
          var nb = cNodes[baseIdx + edges[e][1]];
          if (!na || !nb) continue;
          ctx.beginPath();
          ctx.moveTo(na.cx, na.cy);
          ctx.lineTo(nb.cx, nb.cy);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 3. 自由粒子
      for (var k = 0; k < particles.length; k++) {
        var p = particles[k];
        var tw = 1 + Math.sin(timestamp * p.twinkleSpeed + p.twinkleOffset) * 0.2;
        var alpha = Math.max(0.05, Math.min(0.85, p.baseAlpha * tw));

        ctx.beginPath();
        ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(137, 196, 225, ' + alpha + ')';
        ctx.fill();
      }

      // 4. 星座节点（亮星更大光晕更亮）
      for (var m = 0; m < cNodes.length; m++) {
        var nd = cNodes[m];
        var glowScale = nd.bright ? 5 : 4;
        var dotScale = nd.bright ? 0.85 : 0.72;
        var glowAlpha = nd.bright ? 0.55 : 0.4;
        var dotColor = nd.bright ? 'rgba(255, 255, 255, 0.92)' : 'rgba(228, 238, 250, 0.875)';

        // 光晕
        var glow = ctx.createRadialGradient(nd.cx, nd.cy, 0, nd.cx, nd.cy, nd.r * glowScale);
        glow.addColorStop(0, 'rgba(137, 196, 225, ' + glowAlpha + ')');
        glow.addColorStop(1, 'rgba(137, 196, 225, 0)');
        ctx.beginPath();
        ctx.arc(nd.cx, nd.cy, nd.r * glowScale, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // 星点
        ctx.beginPath();
        ctx.arc(nd.cx, nd.cy, nd.r * dotScale, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }

      // 5. 涟漪光晕（点击位置渐隐）
      ctx.save();
      for (var ri = 0; ri < ripples.length; ri++) {
        var rp = ripples[ri];
        var age = timestamp - rp.birth;
        var lifeRatio = 1 - age / rp.life;
        if (lifeRatio <= 0) continue;
        var rGlow = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, RIPPLE_RANGE * lifeRatio);
        rGlow.addColorStop(0, 'rgba(137, 196, 225, ' + (0.08 * lifeRatio) + ')');
        rGlow.addColorStop(1, 'rgba(137, 196, 225, 0)');
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, RIPPLE_RANGE * lifeRatio, 0, Math.PI * 2);
        ctx.fillStyle = rGlow;
        ctx.fill();
      }
      ctx.restore();
    }

    // ---- 主循环（单一路径，不套娃） ----

    function loop(ts) {
      update(ts);
      draw(ts);
      requestAnimationFrame(loop);
    }

    // ---- 点击涟漪推开粒子 ----
    function addRipple(clientX, clientY) {
      var rect = section.getBoundingClientRect();
      ripples.push({
        x: clientX - rect.left,
        y: clientY - rect.top,
        birth: performance.now(),
        life: RIPPLE_LIFE,
      });
    }
    section.addEventListener('click', function (e) {
      addRipple(e.clientX, e.clientY);
    });
    section.addEventListener('touchstart', function (e) {
      if (e.touches.length > 0) {
        addRipple(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    function resize() {
      var dpr = window.devicePixelRatio || 1;
      W = section.offsetWidth;
      H = section.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      generate();
    }

    resize();
    requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
  }

  // ==================== 7. 滚动渐进浮现（滚动位置实时驱动） ====================

  function initScrollBehavior() {
    var scrollHint = document.querySelector('.scroll-hint');
    var zodiacSection = document.getElementById('zodiac-section');

    // 点击滚动箭头 → 滑到星座区域
    if (scrollHint && zodiacSection) {
      scrollHint.addEventListener('click', function () {
        zodiacSection.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // ---- 滚动驱动浮现 ----
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

    // 为每个元素预计算延迟
    var items = [];
    for (var i = 0; i < revealEls.length; i++) {
      items.push({ el: revealEls[i], delay: getDelay(revealEls[i]) });
    }

    var ticking = false;
    function update() {
      var vh = window.innerHeight;

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var rect = item.el.getBoundingClientRect();
        var elTop = rect.top;

        // 延迟量转为像素偏移（每 0.1s ≈ 0.05vh 偏移）
        var staggerPx = item.delay * vh * 0.5;

        // 动画区间：元素底边从视口底部进入 → 元素顶部到视口 30% 处完成
        var start = vh + staggerPx;
        var end = vh * 0.3 + staggerPx;
        var range = start - end;

        // 滚动进度 0→1（elTop 越小 = 越往上 = 进度越大）
        var t = range > 0 ? (start - elTop) / range : 1;
        t = t < 0 ? 0 : t > 1 ? 1 : t;

        // ease-out 曲线让收尾更柔和
        var eased = 1 - Math.pow(1 - t, 3);

        item.el.style.opacity = String(eased);
        item.el.style.transform = 'translateY(' + ((1 - eased) * 35) + 'px)';
      }

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    // 初始调用（处理首屏已可见的元素）
    update();
  }

  // ==================== 启动 ====================

  function init() {
    initCountdown();
    initMySign();
    initFortune();
    initQuery();
    initStars();
    initScrollBehavior();
  }

  // DOM 加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
