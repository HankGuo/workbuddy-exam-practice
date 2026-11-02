const puppeteer = require("puppeteer-core");
const path = require("path");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.argv[2] || ("file://" + path.resolve("index.html"));
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push("console:" + m.text()); });
  page.on("pageerror", e => errors.push("pageerror:" + e.message));
  await page.goto(url, { waitUntil: "networkidle0" });

  const out = {};
  const view = () => page.evaluate(() => state.view);
  const qid = () => page.evaluate(() => {
    const q = QUESTIONS.find(x => x.id === memo.pick?.id);
    return q ? q.id : null;
  });
  const shownQid = () => page.evaluate(() => {
    const list = memoFiltered();
    return list.length ? list[0].id : null;
  });

  // 1. 点随机抽一题
  await page.evaluate(() => document.getElementById("randBtn").click());
  await sleep(250);
  out.viewAfterClick = await view();
  out.randomBarShown = await page.evaluate(() => !!document.querySelector(".random-bar"));
  out.pickSet = await page.evaluate(() => !!memo.pick);
  out.shownQuestion = await shownQid();
  out.questionTextPresent = await page.evaluate(() => !!document.querySelector(".qtext"));
  out.filterBarHidden = await page.evaluate(() => !document.getElementById("memoFilter"));
  out.title = await page.evaluate(() => document.getElementById("topTitle").textContent);

  // 2. 换一题
  const before = await qid();
  await page.evaluate(() => document.getElementById("mShuffleTop").click());
  await sleep(250);
  const after = await qid();
  out.shuffleChanged = before !== after && !!after;
  out.shuffleStillRendered = await page.evaluate(() => !!document.querySelector(".qtext"));

  // 3. 翻面 → 讲解
  await page.evaluate(() => document.getElementById("mReveal").click());
  await sleep(150);
  out.answerShown = await page.evaluate(() => !!document.querySelector(".ex-ans"));
  await page.evaluate(() => document.getElementById("mExplain").click());
  await sleep(200);
  out.plainShown = await page.evaluate(() => !!document.querySelector(".ex-plain p"));
  out.shuffleBtnAfterAnswer = await page.evaluate(() => !!document.getElementById("mShuffle"));

  // 4. 返回首页 → 从首页进背题模式 = 退出随机模式
  await page.evaluate(() => document.getElementById("backBtn").click());
  await sleep(200);
  out.backToHome = await view();
  await page.evaluate(() => document.querySelector('[data-go="memorize"]').click());
  await sleep(250);
  out.exitedRandom = await page.evaluate(() => !memo.pick && !!document.getElementById("memoFilter"));
  out.filterCount = await page.evaluate(() => document.getElementById("mCount").textContent);
  out.fullListLen = await page.evaluate(() => memoFiltered().length);

  // 5. 首页随机按钮再次可用
  await page.evaluate(() => document.getElementById("backBtn").click());
  await sleep(150);
  await page.evaluate(() => document.getElementById("randBtn").click());
  await sleep(250);
  out.secondRandomWorks = await view() === "memorize" && await page.evaluate(() => !!document.querySelector(".qtext"));

  out.errors = errors;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();

  const ok = out.viewAfterClick === "memorize" && out.randomBarShown && out.pickSet &&
    !!out.shownQuestion && out.questionTextPresent && out.filterBarHidden &&
    out.title === "随机一题" && out.shuffleChanged && out.shuffleStillRendered &&
    out.answerShown && out.plainShown && out.shuffleBtnAfterAnswer &&
    out.backToHome === "home" && out.exitedRandom && out.fullListLen === 133 &&
    out.secondRandomWorks && errors.length === 0;
  console.log(ok ? "==== RANDOM PASS ====" : "==== RANDOM FAIL ====");
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
