/*!
 * Live2D Widget
 * https://github.com/stevenjoezhang/live2d-widget
 *
 * 策略：核心 JS 走 CDN，模型/纹理走本地（同源无 CORS 问题）
 * - waifu-tips.js  → CDN（ES 模块，HTTPS 无 CORS 问题）
 * - 模型/纹理      → 本地（同源请求，服务器和 file://+CDN 都可用）
 * - waifu-tips.json → 内联 Blob URL（避免 fetch 本地 JSON 失败）
 * - live2d.min.js / waifu.css → 本地
 */

const live2d_path = 'live2d/';
const cdn_js = 'https://fastly.jsdelivr.net/npm/live2d-widgets@1.0.1/dist/';

// ============================================================
// 内联 waifu-tips.json（模型路径指向本地，同源请求）
// 通过 Blob URL 喂给 initWidget，file:// 和服务器两种场景都兼容
// ============================================================
const waifuTipsData = {
  "mouseover": [
    {
      "selector": ".social-link",
      "text": ["要一起探索世界吗？"]
    },
    {
      "selector": ".name",
      "text": ["你好呀，我是这片天空的向导~"]
    },
    {
      "selector": "#music-btn",
      "text": ["这首歌很好听呢", "要一起听吗？"]
    },
    {
      "selector": ".vinyl-wrap",
      "text": ["唱片在旋转，时间在流淌"]
    },
    {
      "selector": ".zodiac-card",
      "text": ["星星会告诉你答案", "今天运势如何？"]
    }
  ],
  "click": [
    {
      "selector": ".scroll-hint",
      "text": ["往下滑，有更多惊喜哦"]
    }
  ],
  "seasons": [
    {
      "date": "01/01",
      "text": ["新年快乐！新的一年也要元气满满哦~"]
    },
    {
      "date": "03/22",
      "text": ["生日快乐！愿星光永远照耀着你 ✨"]
    }
  ],
  "time": [
    { "hour": "6-7",   "text": "早上好！一日之计在于晨，美好的一天就要开始了～" },
    { "hour": "8-11",  "text": "上午好！工作顺利嘛，不要久坐，多起来走动走动哦！" },
    { "hour": "12-13", "text": "中午了，工作了一个上午，现在是午餐时间！" },
    { "hour": "14-17", "text": "午后很容易犯困呢，今天的运动目标完成了吗？" },
    { "hour": "18-19", "text": "傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红～" },
    { "hour": "20-21", "text": "晚上好，今天过得怎么样？" },
    { "hour": "22-23", "text": ["已经这么晚了呀，早点休息吧，晚安～", "深夜时要爱护眼睛呀！"] },
    { "hour": "0-5",   "text": "你是夜猫子呀？这么晚还不睡觉，明天起的来嘛？" }
  ],
  "message": {
    "default": [
      "好久不见，日子过得好快呢……",
      "大坏蛋！你都多久没理人家了呀，嘤嘤嘤～",
      "嗨～快来逗我玩吧！",
      "拿小拳拳锤你胸口！",
      "记得把小家加入收藏夹哦！"
    ],
    "console": "哈哈，你打开了控制台，是想要看看我的小秘密吗？",
    "copy": "你都复制了些什么呀，转载要记得加上出处哦！",
    "visibilitychange": "哇，你终于回来了～",
    "changeSuccess": "我的新衣服好看嘛？",
    "changeFail": "我还没有其他衣服呢！",
    "photo": "照好了嘛，是不是很可爱呢？",
    "goodbye": "愿你有一天能与重要的人重逢。",
    "hitokoto": "这句一言来自 <span>「$1」</span>，是 <span>$2</span> 在 hitokoto.cn 投稿的。",
    "welcome": "欢迎阅读<span>「$1」</span>",
    "referrer": "Hello！来自 <span>$1</span> 的朋友",
    "hoverBody": [
      "干嘛呢你，快把手拿开～～",
      "鼠…鼠标放错地方了！",
      "你要干嘛呀？",
      "喵喵喵？",
      "怕怕(ノ≧∇≦)ノ",
      "非礼呀！救命！",
      "这样的话，只能使用武力了！",
      "我要生气了哦",
      "不要动手动脚的！",
      "真…真的是不知羞耻！",
      "Hentai！"
    ],
    "tapBody": [
      "是…是不小心碰到了吧…",
      "萝莉控是什么呀？",
      "你看到我的小熊了吗？",
      "再摸的话我可要报警了！⌇●﹏●⌇",
      "110 吗，这里有个变态一直在摸我(ó﹏ò｡)",
      "不要摸我了，我会告诉老婆来打你的！",
      "干嘛动我呀！小心我咬你！",
      "别摸我，有什么好摸的！"
    ]
  },
  "models": [
    {
      "name": "Izumi (和泉)",
      "paths": [live2d_path + "models/izumi/izumi.model.json"],
      "message": "和泉 Izumi ～"
    }
  ]
};

// 生成 Blob URL（file:// 下 fetch 本地文件会被拦，Blob URL 不受影响）
const waifuBlobUrl = URL.createObjectURL(
  new Blob([JSON.stringify(waifuTipsData)], { type: 'application/json' })
);

// 封装异步加载资源的方法
function loadExternalResource(url, type) {
  return new Promise((resolve, reject) => {
    let tag;

    if (type === 'css') {
      tag = document.createElement('link');
      tag.rel = 'stylesheet';
      tag.href = url;
    }
    else if (type === 'js') {
      tag = document.createElement('script');
      tag.type = 'module';
      tag.src = url;
    }
    if (tag) {
      tag.onload = () => resolve(url);
      tag.onerror = () => reject(url);
      document.head.appendChild(tag);
    }
  });
}

(async () => {
  console.log('[Live2D] 初始化开始...');

  // 移动端跳过加载
  if (screen.width < 768) { console.log('[Live2D] 移动端，跳过加载'); return; }

  try {
    // waifu.css 本地，waifu-tips.js CDN（ES 模块，HTTPS 无 CORS 问题）
    console.log('[Live2D] 加载模块（CDN + 本地）...');
    await Promise.all([
      loadExternalResource(live2d_path + 'waifu.css', 'css'),
      loadExternalResource(cdn_js + 'waifu-tips.js', 'js')
    ]);
    console.log('[Live2D] 模块加载完成，初始化组件...');

    initWidget({
      waifuPath: waifuBlobUrl,           // 内联 JSON → Blob URL，绕过 fetch
      cubism2Path: live2d_path + 'live2d.min.js',  // 本地 SDK
      tools: [],
      logLevel: 'warn',
      drag: true,
    });
    console.log('[Live2D] initWidget 调用完成');
  } catch (err) {
    console.error('[Live2D] 初始化失败:', err);
  }
})();

console.log(
  '\n%cLive2D%cWidget%c\n',
  'padding: 8px; background: #cd3e45; font-weight: bold; font-size: large; color: white;',
  'padding: 8px; background: #ff5450; font-size: large; color: #eee;',
  ''
);
