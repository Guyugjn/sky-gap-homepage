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
      "text": ["孤鱼GY，一个在天空之隙游弋的灵魂~", "这里是孤鱼的小小世界", "名字里的「鱼」可不是随便取的哦"]
    },
    {
      "selector": ".intro",
      "text": ["在像素与星空间，编织属于自己的小小世界。", "这句话很美，对吧？", "短短一行字，藏了好多温柔"]
    },
    {
      "selector": "#avatar",
      "text": ["这是这片天空的主人哦", "嘘——别打扰他发呆", "头像背后是一片星辰大海"]
    },
    {
      "selector": ".social-link",
      "text": ["要一起去外面的世界看看吗？", "话说，你关注孤鱼了吗？", "外面的世界很大，但这里永远是你的港湾"]
    },
    {
      "selector": "#github-btn",
      "text": ["代码是另一种魔法呢", "这里藏着很多小秘密哦", "绿色的格子，是最美的色块"]
    },
    {
      "selector": "#bilibili-btn",
      "text": ["B站是个温暖的地方~", "你投币了吗？", "一键三连，懂的都懂"]
    },
    {
      "selector": "#email-btn",
      "text": ["想写信给孤鱼吗？", "点击就能复制邮箱哦", "写信是一件很浪漫的事呢"]
    },
    {
      "selector": "#theme-toggle",
      "text": ["白天和夜晚，天空的颜色完全不同呢", "你喜欢白天的天空还是夜晚的星空？"]
    },
    {
      "selector": ".music-label",
      "text": ["点击曲名可以复制哦", "音乐是天空之隙里流淌的风", "这首歌是我的最爱之一"]
    },
    {
      "selector": "#music-btn",
      "text": ["这首歌好听吗？", "闭上眼睛，让音乐带你飞翔", "播放、暂停、切歌——都由你掌控"]
    },
    {
      "selector": ".scroll-hint",
      "text": ["往下滑，星辰在等你", "下面还有更多精彩哦", "飞鱼会陪你一起探索的"]
    },
    {
      "selector": ".zodiac-card",
      "text": ["星辰絮语，聆听宇宙的低语", "你也相信星星的指引吗？", "十二星座各有各的魅力呢"]
    },
    {
      "selector": ".countdown-card",
      "text": ["孤鱼的生日是3月22日，记得来祝福哦", "白羊座的热情，就像初春的阳光", "距离生日还有多久呢？"]
    },
    {
      "selector": ".fortune-card",
      "text": ["今天的运势如何？", "星星会告诉你答案 ✨", "运势只是参考，真正的运气在自己手里"]
    },
    {
      "selector": ".query-card",
      "text": ["想知道你的星座秘密吗？", "选择生日，发现属于你的星辰", "不管什么星座，在这里都是好朋友"]
    },
    {
      "selector": ".site-footer",
      "text": ["谢谢你游到这里，我的朋友", "天空之隙，永远为你敞开", "愿你无论去到哪里，都记得这片天空"]
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
      "text": ["新年快乐！愿新的一年，星光伴你前行 ✨", "元旦快乐～新的一年也要元气满满！", "新年新气象，天空之隙也换上了新云彩"]
    },
    {
      "date": "03/22",
      "text": ["生日快乐！孤鱼又长大了一岁呢 🎂", "今天是特别的日子～愿星光永远照耀着你！", "生日快乐！天空之隙为你点亮了蜡烛 🕯️", "孤鱼的生日！快送上祝福吧～"]
    },
    {
      "date": "10/01",
      "text": ["国庆快乐！愿你在这片天空下自由翱翔 🇨🇳", "为祖国庆生，也为你的梦想加油！"]
    }
  ],
  "time": [
    { "hour": "6-7",   "text": ["早安～晨光穿透云层，飞鱼已经开始游弋了", "太阳刚起床，你也醒了吗？新的一天要加油哦"] },
    { "hour": "8-11",  "text": ["上午好！今天的天空格外清澈，适合写代码呢", "早上最适合听一首轻快的歌了～"] },
    { "hour": "12-13", "text": ["午安～记得按时吃饭，飞鱼也需要补充能量哦", "中午了！补充能量，下午才能继续飞翔"] },
    { "hour": "14-17", "text": ["午后阳光正好，云朵懒洋洋地飘着～你也在犯困吗？", "下午茶时间！来杯咖啡，和飞鱼一起打起精神"] },
    { "hour": "18-19", "text": ["傍晚了！天空被染成暖金色，正是最美的时刻", "黄昏是天空之隙最美的滤镜，快抬头看看"] },
    { "hour": "20-21", "text": ["晚上好～星空已经悄悄亮起来了，今天过得怎样？", "夜色渐浓，星星们开始值班了 ✨"] },
    { "hour": "22-23", "text": ["夜深了，星星在说晚安", "该休息啦，明天还要和飞鱼一起翱翔呢～", "如果睡不着，我陪你聊一会儿天？"] },
    { "hour": "0-5",   "text": ["这么晚还没睡？你是夜空中最亮的那颗星呢 🌙", "凌晨的天空之隙特别安静，飞鱼都睡着了", "熬夜对身体不好，不过偶尔一次也没关系啦"] }
  ],
  "message": {
    "default": [
      "嗨～欢迎来到天空之隙！",
      "飞鱼刚刚游过去了，你看到了吗？",
      "在这里，每一朵云都藏着一个故事",
      "孤鱼说：简单的东西最有力量",
      "你听，唱片正在旋转……",
      "星辰从不说话，但它们一直在那里看着你",
      "要不要一起数星星？",
      "今天的云朵软软的，像棉花糖一样",
      "你知道吗？天空之隙的每一颗星星都有名字",
      "飞鱼今天飞了很远呢，有点累了",
      "嘘——云层后面好像藏着什么",
      "你相信星座吗？我觉得星星会偷偷聊天",
      "有时候什么都不做，只是看着天空，也很幸福",
      "这里的时间过得很慢，慢到可以听完一整首歌",
      "流星划过的时候，记得许愿哦",
      "你也是被风吹到这里来的吗？",
      "每天都有新的云朵飘过，但它们从不重复",
      "音乐和星空，大概是世界上最好的两样东西",
      "如果困了，就在云朵上躺一会儿吧",
      "孤鱼的代码里藏着很多小彩蛋，你发现了吗？",
      "天空的颜色每一秒都在变，好神奇",
      "偶尔停下来，听听风的声音也不错",
      "有人说，在天空之隙待久了会不想离开",
      "今晚的月色很美，适合听一首慢歌",
      "你好呀，新朋友～飞鱼很欢迎你",
      "这里没有 deadline，只有云和星星",
      "偷偷告诉你，唱片的下一首更好听",
      "你的星座是什么？说不定我们能聊很久",
      "天空之隙的门永远不关，想回来随时都可以",
      "一阵风吹过，带来了远方的花香",
      "你看那朵云，像不像一条鱼？",
      "最美好的事情，就是和你一起发呆",
      "星辰会在每天傍晚准时亮起，从不迟到",
      "要是下雨了，云会帮你挡着的",
      "许个愿吧，说不定飞鱼会帮你实现"
    ],
    "console": "嘘——你发现了开发者的小秘密！控制台是魔法师的咒语书，请谨慎使用～",
    "copy": "复制成功！如果引用了内容，记得注明出处哦～",
    "visibilitychange": "你回来啦！飞鱼一直在等你呢",
    "changeSuccess": "换装成功！怎么样，喜欢吗？",
    "changeFail": "暂时只有这一套衣服呢，以后会有更多吗？",
    "photo": "咔嚓～要不要和飞鱼合个影？",
    "about": "孤鱼GY 的天空之隙 — 一条在代码与星辰之间游弋的飞鱼。简单至上，保持好奇。",
    "goodbye": "愿你在这片天空之外，也能自由翱翔。飞鱼会想你的～",
    "welcome": "欢迎来到<span>「$1」</span>，这里是天空之隙 — 愿你在这里找到片刻宁静",
    "referrer": "来自 <span>$1</span> 的朋友，欢迎游到这里～飞鱼已经飞过去迎接你了",
    "hoverBody": [
      "呀！被发现了！",
      "别闹，痒痒的～",
      "你也要摸摸飞鱼吗？",
      "这里是我的小角落啦",
      "呜…被抓住了",
      "快看！有流星！——骗你的",
      "你手好暖（但请不要摸头）",
      "小心我召唤云朵来挡你哦",
      "诶嘿～被逮到了",
      "这位访客，请不要随便戳看板娘",
      "要不然我给你唱首歌？不，还是算了",
      "你摸到的是云，不是我哦",
      "我只是个看板娘，不要为难我啦",
      "头顶上有飞鱼在看你哦"
    ],
    "tapBody": [
      "啊，被点了！",
      "有什么事吗？我在听",
      "叮～你成功引起了我的注意",
      "再点一下，我就要飘走了哦",
      "你是想和我聊天吗？",
      "嗯？有什么可以帮你的？",
      "喂喂，再戳我就要叫飞鱼来咬你了",
      "刚才是不是有什么东西碰了我一下",
      "你是第几万个戳我的人了？记不清了",
      "戳戳戳，就知道戳——好吧，你继续",
      "其实被点久了也会有点开心的",
      "我怀疑你在练习点击速度"
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

  // ============================================================
  // Live2D 延迟初始化：等页面核心内容加载完毕后再启动，
  // 避免 Live2D 的 127K JS + 2.6MB 纹理与首屏资源抢带宽。
  // 移动端直接跳过，不加载任何 Live2D 资源。
  // ============================================================

  function initLive2D() {
    if (screen.width < 768) { return; }

    // 静默 Live2D 初始化期间的 hitTest 竞态错误（纹理未就绪时鼠标事件触发）
    window.addEventListener('error', function suppressLive2DRace(e) {
      if (e.message && e.message.includes('hitTest')) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
      }
    }, true);

    (async () => {
      try {
        await Promise.all([
          loadExternalResource(live2d_path + 'waifu.css', 'css'),
          loadExternalResource(cdn_js + 'waifu-tips.js', 'js')
        ]);

        initWidget({
          waifuPath: waifuBlobUrl,           // 内联 JSON → Blob URL，绕过 fetch
          cubism2Path: live2d_path + 'live2d.min.js',  // 本地 SDK
          tools: [],
          logLevel: 'warn',
          drag: false,
        });
      } catch (err) {
        console.error('[Live2D] 初始化失败:', err);
      }
    })();
  }

  // requestIdleCallback：浏览器空闲时执行，不阻塞首屏渲染
  // 降级方案：2 秒后执行（保证 Live2D 最终一定会加载）
  if (window.requestIdleCallback) {
    requestIdleCallback(initLive2D, { timeout: 4000 });
  } else {
    setTimeout(initLive2D, 2000);
  }
