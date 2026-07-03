/*!
 * Live2D Widget
 * https://github.com/stevenjoezhang/live2d-widget
 *
 * 策略：
 * - waifu-tips.js → CDN（ES 模块，HTTPS 无 CORS 问题）
 * - waifu-tips.json → 内联 Blob URL（避免 fetch 本地 JSON 失败）
 * - live2d.min.js / waifu.css → 本地
 * - 模型文件：
 *   · file:// 协议 → CDN（Chrome 禁止 file:// 下的 fetch，CDN 有 CORS 头）
 *   · HTTP 服务器  → 本地（同源请求，无 CORS 问题）
 */

const live2d_path = 'live2d/';
const cdn_js = 'https://fastly.jsdelivr.net/npm/live2d-widgets@1.0.1/dist/';
const isFileProtocol = window.location.protocol === 'file:';
const cdn_model = 'https://cdn.jsdelivr.net/npm/live2d-widget-model-izumi@1.0.5/assets/';

// ============================================================
// 内联 waifu-tips.json（模型路径指向本地，同源请求）
// 通过 Blob URL 喂给 initWidget，file:// 和服务器两种场景都兼容
// ============================================================
const waifuTipsData = {
  "mouseover": [
    {
      "selector": ".name",
      "text": ["孤鱼GY，一个在天空之隙游弋的灵魂~", "这里是孤鱼的小小世界"]
    },
    {
      "selector": ".intro",
      "text": ["在像素与星空间，编织属于自己的小小世界。", "这句话很美，对吧？"]
    },
    {
      "selector": "#avatar",
      "text": ["这是这片天空的主人哦", "嘘——别打扰他发呆"]
    },
    {
      "selector": ".social-link",
      "text": ["要一起去外面的世界看看吗？", "话说，你关注孤鱼了吗？"]
    },
    {
      "selector": "#github-btn",
      "text": ["代码是另一种魔法呢", "这里藏着很多小秘密哦"]
    },
    {
      "selector": "#bilibili-btn",
      "text": ["B站是个温暖的地方~", "你投币了吗？"]
    },
    {
      "selector": "#email-btn",
      "text": ["想写信给孤鱼吗？", "点击就能复制邮箱哦"]
    },
    {
      "selector": ".vinyl-wrap",
      "text": ["唱片旋转着，像时间的涟漪", "音乐是天空之隙里流淌的风"]
    },
    {
      "selector": "#music-btn",
      "text": ["这首歌好听吗？", "闭上眼睛，让音乐带你飞翔"]
    },
    {
      "selector": ".scroll-hint",
      "text": ["往下滑，星辰在等你", "下面还有更多精彩哦"]
    },
    {
      "selector": ".zodiac-card",
      "text": ["星辰絮语，聆听宇宙的低语", "你也相信星星的指引吗？"]
    },
    {
      "selector": ".countdown-card",
      "text": ["孤鱼的生日是3月22日，记得来祝福哦", "白羊座的热情，就像初春的阳光"]
    },
    {
      "selector": ".fortune-card",
      "text": ["今天的运势如何？", "星星会告诉你答案 ✨"]
    },
    {
      "selector": ".query-card",
      "text": ["想知道你的星座秘密吗？", "选择生日，发现属于你的星辰"]
    },
    {
      "selector": ".site-footer",
      "text": ["谢谢你游到这里，我的朋友", "天空之隙，永远为你敞开"]
    }
  ],
  "click": [
    {
      "selector": ".scroll-hint",
      "text": ["走吧，一起潜入星辰大海！"]
    }
  ],
  "seasons": [
    {
      "date": "01/01",
      "text": ["新年快乐！愿新的一年，星光伴你前行 ✨", "元旦快乐～新的一年也要元气满满！"]
    },
    {
      "date": "03/22",
      "text": ["生日快乐！孤鱼又长大了一岁呢 🎂", "今天是特别的日子～愿星光永远照耀着你！", "生日快乐！天空之隙为你点亮了蜡烛 🕯️"]
    },
    {
      "date": "10/01",
      "text": ["国庆快乐！愿你在这片天空下自由翱翔 🇨🇳"]
    }
  ],
  "time": [
    { "hour": "6-7",   "text": "早安～晨光穿透云层，飞鱼已经开始游弋了" },
    { "hour": "8-11",  "text": "上午好！今天的天空格外清澈，适合写代码呢" },
    { "hour": "12-13", "text": "午安～记得按时吃饭，飞鱼也需要补充能量哦" },
    { "hour": "14-17", "text": "午后阳光正好，云朵懒洋洋地飘着～你也在犯困吗？" },
    { "hour": "18-19", "text": "傍晚了！天空被染成暖金色，正是最美的时刻" },
    { "hour": "20-21", "text": "晚上好～星空已经悄悄亮起来了，今天过得怎样？" },
    { "hour": "22-23", "text": ["夜深了，星星在说晚安", "该休息啦，明天还要和飞鱼一起翱翔呢～"] },
    { "hour": "0-5",   "text": "这么晚还没睡？你是夜空中最亮的那颗星呢 🌙" }
  ],
  "message": {
    "default": [
      "嗨～欢迎来到天空之隙！",
      "飞鱼刚刚游过去了，你看到了吗？",
      "在这里，每一朵云都藏着一个故事",
      "孤鱼说：简单的东西最有力量",
      "你听，唱片正在旋转……",
      "星辰从不说话，但它们一直在那里看着你",
      "要不要一起数星星？"
    ],
    "console": "嘘——你发现了开发者的小秘密！控制台是魔法师的咒语书，请谨慎使用～",
    "copy": "复制成功！如果引用了内容，记得注明出处哦～",
    "visibilitychange": "你回来啦！飞鱼一直在等你呢",
    "changeSuccess": "换装成功！怎么样，喜欢吗？",
    "changeFail": "暂时只有这一套衣服呢，以后会有更多吗？",
    "photo": "咔嚓～要不要和飞鱼合个影？",
    "goodbye": "愿你在这片天空之外，也能自由翱翔。",
    "welcome": "欢迎来到<span>「$1」</span>，这里是天空之隙",
    "referrer": "来自 <span>$1</span> 的朋友，欢迎游到这里～",
    "hoverBody": [
      "呀！被发现了！",
      "别闹，痒痒的～",
      "你也要摸摸飞鱼吗？",
      "这里是我的小角落啦",
      "呜…被抓住了",
      "快看！有流星！——骗你的",
      "你手好暖（但请不要摸头）",
      "小心我召唤云朵来挡你哦"
    ],
    "tapBody": [
      "啊，被点了！",
      "有什么事吗？我在听",
      "叮～你成功引起了我的注意",
      "再点一下，我就要飘走了哦",
      "你是想和我聊天吗？",
      "嗯？有什么可以帮你的？"
    ]
  },
  "models": [
    {
      "name": "Pio (默认)",
      "paths": [isFileProtocol ? "https://fastly.jsdelivr.net/gh/fghrsh/live2d_api/model/Potion-Maker/Pio/index.json" : live2d_path + "models/pio/index.json"],
      "message": "Pio 来啦～一起在这片天空下玩耍吧 ✨"
    },
    {
      "name": "Izumi (和泉)",
      "paths": [isFileProtocol ? cdn_model + "izumi.model.json" : live2d_path + "models/izumi/izumi.model.json"],
      "message": "和泉 Izumi 驾到～今天也要元气满满哦"
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
  console.log('[Live2D] 初始化开始…');

  // 移动端跳过加载
  if (screen.width < 768) { console.log('[Live2D] 移动端，跳过加载'); return; }

  try {
    // waifu.css 本地，waifu-tips.js CDN（ES 模块，HTTPS 无 CORS 问题）
    console.log('[Live2D] 加载模块（CDN + 本地）…');
    await Promise.all([
      loadExternalResource(live2d_path + 'waifu.css', 'css'),
      loadExternalResource(cdn_js + 'waifu-tips.js', 'js')
    ]);
    console.log('[Live2D] 模块加载完成，初始化组件…');

    initWidget({
      waifuPath: waifuBlobUrl,           // 内联 JSON → Blob URL，绕过 fetch
      cubism2Path: live2d_path + 'live2d.min.js',  // 本地 SDK
      tools: [],
      logLevel: 'warn',
      drag: false,
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
