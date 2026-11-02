const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = __dirname;
fs.mkdirSync(OUT, { recursive: true });

const BRAND = "#0891B2";
const INK = "#1a1a1a";

// 白切鸡「斩件」极简线稿：俯视装盘（盘 + 三块斩件 + 蘸料碟 + 一双筷子）
function chickenArt(cx, cy, s) {
  return `
  <svg width="240" height="200" viewBox="-105 -100 210 200" xmlns="http://www.w3.org/2000/svg"
       style="display:block;overflow:visible">
  <g transform="translate(${cx},${cy}) scale(${s})" fill="none" stroke="${BRAND}"
     stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.92">
    <!-- 盘 -->
    <circle cx="0" cy="0" r="74"/>
    <circle cx="0" cy="0" r="63" stroke-width="1.6" opacity="0.45"/>
    <!-- 三块斩件 -->
    <rect x="-42" y="-38" width="36" height="24" rx="6" fill="#ffffff"/>
    <rect x="2" y="-38" width="36" height="24" rx="6" fill="#ffffff"/>
    <rect x="-20" y="-6" width="36" height="24" rx="6" fill="#ffffff"/>
    <!-- 蘸料碟 -->
    <circle cx="0" cy="44" r="17"/>
    <circle cx="0" cy="44" r="7" fill="${BRAND}" stroke="none" opacity="0.35"/>
    <!-- 筷子 -->
    <path d="M52 60 L92 20"/>
    <path d="M60 68 L100 28" stroke-width="2.4" opacity="0.6"/>
  </g></svg>`;
}

const wide = `
<html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:900px;height:383px;overflow:hidden;
       font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
       background:linear-gradient(135deg,#ffffff 0%,#f7fdfc 45%,#e9f9f3 100%);
       position:relative}
  .bar{position:absolute;left:0;top:0;width:8px;height:100%;background:${BRAND}}
  .wrap{position:absolute;left:62px;top:0;height:383px;width:520px;display:flex;flex-direction:column;justify-content:center}
  .kick{font-size:15px;letter-spacing:4px;color:${BRAND};font-weight:bold;margin-bottom:20px}
  h1{font-size:52px;line-height:1.24;font-weight:bold;color:${INK};letter-spacing:-1px}
  h1 em{font-style:normal;color:${BRAND}}
  .sub{margin-top:22px;font-size:16px;color:#555;letter-spacing:.5px}
  .url{position:absolute;right:38px;bottom:26px;font-size:13px;color:#9aa8a4;letter-spacing:.5px}
  .art{position:absolute;right:40px;top:48px}
  .tag{position:absolute;right:38px;bottom:62px;font-size:12px;color:#9aa8a4}
</style></head><body>
  <div class="bar"></div>
  <div class="wrap">
    <div class="kick">算力白肉 · 讲师认证</div>
    <h1>难的不是知识<br>是<em>那串数字</em></h1>
    <div class="sub">133 道原题 ｜ 白话讲解 ｜ 错题本 ｜ 90 分钟模拟</div>
  </div>
  <div class="art">${chickenArt(-8, 6, 1.0)}</div>
  <div class="tag">免费刷题 · 微信直接打开</div>
  <div class="url">workbuddy.fkbg.tech</div>
</body></html>`;

const square = `
<html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:200px;height:200px;overflow:hidden;position:relative;
       font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
       background:linear-gradient(150deg,#ffffff 0%,#f2fdfb 60%,#e4f8f1 100%)}
  .bar{position:absolute;left:0;top:0;width:6px;height:100%;background:${BRAND}}
  .k{position:absolute;left:24px;top:22px;font-size:11px;letter-spacing:2px;color:${BRAND};font-weight:bold}
  .t{position:absolute;left:24px;top:48px;font-size:37px;font-weight:bold;color:${INK};line-height:1.16;letter-spacing:-1px}
  .t em{font-style:normal;color:${BRAND}}
  .s{position:absolute;left:24px;top:136px;font-size:19px;font-weight:bold;color:#556;letter-spacing:1px}
  .u{position:absolute;left:24px;bottom:18px;font-size:10.5px;color:#9aa8a4;letter-spacing:.3px}
</style></head><body>
  <div class="bar"></div>
  <div class="k">算力白肉</div>
  <div class="t">133 道<br><em>原题</em></div>
  <div class="s">免费刷题</div>
  <div class="u">workbuddy.fkbg.tech</div>
</body></html>`;

const banner = `
<html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:900px;height:383px;overflow:hidden;position:relative;
       font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
       background:linear-gradient(120deg,#ffffff 0%,#f7fdfc 40%,#e9f9f3 100%)}
  .bar{position:absolute;left:0;top:0;width:10px;height:100%;background:${BRAND}}
  .w{position:absolute;left:70px;top:0;height:383px;display:flex;flex-direction:column;justify-content:center}
  .logo{font-size:44px;font-weight:bold;color:${INK};letter-spacing:6px;margin-bottom:16px}
  .logo em{font-style:normal;color:${BRAND}}
  .s{font-size:15px;color:#7d8c88;letter-spacing:3px}
  .r{position:absolute;right:60px;top:96px}
  .f{position:absolute;left:70px;bottom:44px;font-size:12.5px;color:#a8b4b1;letter-spacing:2px}
</style></head><body>
  <div class="bar"></div>
  <div class="w">
    <div class="logo">算力<em>白肉</em></div>
    <div class="s">AI 科技科普 × 厨房视角</div>
  </div>
  <div class="r">${chickenArt(0, 0, 1.05)}</div>
  <div class="f">workbuddy.fkbg.tech</div>
</body></html>`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const jobs = [
    { html: banner, w: 900, h: 383, file: "banner.png" },
    { html: wide, w: 900, h: 383, file: "cover-2.35.png" },
    { html: square, w: 200, h: 200, file: "cover-1.png" },
  ];
  for (const j of jobs) {
    const page = await browser.newPage();
    await page.setViewport({ width: j.w, height: j.h, deviceScaleFactor: 2 });
    await page.setContent(j.html, { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(OUT, j.file) });
    console.log("已生成", j.file, j.w + "x" + j.h);
    await page.close();
  }
  await browser.close();
})();
