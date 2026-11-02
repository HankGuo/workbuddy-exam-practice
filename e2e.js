// End-to-end test driven by real Chrome (puppeteer-core).
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = "http://127.0.0.1:8080/index.html";
const SHOTS = "/tmp/shots";
fs.mkdirSync(SHOTS, { recursive: true });

// load QUESTIONS for answer matching
const dataSrc = fs.readFileSync("data.js", "utf8");
const QUESTIONS = eval(dataSrc + "; QUESTIONS");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--force-color-profile=srgb"]
  });
  const page = await browser.newPage();
  const errors = [];
  const bad = [];
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/i.test(m.text())) errors.push("console: " + m.text()); });
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("response", r => { if (r.status() >= 400) bad.push(r.status() + " " + r.url()); });

  const results = [];
  const assert = (c, m) => { results.push([c, m]); console.log((c ? "PASS " : "FAIL ") + m); };

  async function shot(name, vp) {
    if (vp) await page.setViewport(vp);
    await new Promise(r => setTimeout(r, 250));
    await page.screenshot({ path: `${SHOTS}/${name}.png` });
  }

  // ---- HOME (mobile) ----
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(URL, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  const modeCount = await page.$$eval(".mode-row", els => els.length);
  assert(modeCount === 4, `home shows 4 modes (got ${modeCount})`);
  await shot("m_home", null);

  // ---- MEMORIZE ----
  await page.click('.mode-row[data-go="memorize"]');
  await page.waitForSelector("#mReveal");
  await shot("m_memorize", null);
  await page.click("#mReveal");
  await page.waitForSelector(".ex-ans");
  const ansText = await page.$eval(".ex-ans", e => e.textContent);
  assert(/正确答案/.test(ansText), "memorize reveals correct answer");
  await shot("m_memorize_reveal", null);
  // add to wrong book
  await page.click("#mSave");
  await new Promise(r => setTimeout(r, 200));

  // ---- EXAM sim50 (answer all correct) ----
  await page.click("#backBtn");
  await page.click('.mode-row[data-go="exam"]');
  await page.waitForSelector("#startExam");
  await shot("m_exam_cfg", null);
  // pick 模拟50
  await page.click('[data-seg="qty"] button[data-v="sim50"]');
  await page.click('[data-seg="timer"] button[data-v="90"]');
  await page.click("#startExam");
  await page.waitForSelector("#exOpts");
  const exNum = await page.$eval("#exNum", e => e.textContent);
  assert(/50/.test(exNum), `sim50 shows /50 in status (got "${exNum}")`);
  await shot("m_exam_q", null);

  // answer all correct
  await answerAll(page, "correct");
  await page.waitForFunction(() => document.getElementById("topTitle").textContent === "答题结果", { timeout: 8000 });
  const verdict = await page.$eval(".score-card", e => e.textContent);
  const pageText = await page.evaluate(() => document.body.innerText);
  const wrongCount = await page.$$eval(".wrong-item", els => els.length).catch(() => 0);
  console.log("  [diag] correct-run verdict:", JSON.stringify(verdict.replace(/\s+/g, " ")), "| wrong items:", wrongCount);
  assert(wrongCount === 0 && /全部答对/.test(pageText), "all-correct -> 0 wrong + 全部答对");
  assert(/100/.test(verdict), "score 100 shown");
  await shot("m_results_ok", null);

  // ---- EXAM all wrong (re-run) ----
  await page.click("#rRetry");
  await page.waitForSelector("#exOpts");
  console.log("  [wrong-run] restarted, answering...");
  const t0 = Date.now();
  await answerAll(page, "wrong");
  console.log("  [wrong-run] answered in", Date.now() - t0, "ms");
  try {
    await page.waitForFunction(() => document.getElementById("topTitle").textContent === "答题结果", { timeout: 25000 });
  } catch (e) {
    const diag = await page.evaluate(() => ({
      top: document.getElementById("topTitle").textContent,
      hasOpts: !!document.getElementById("exOpts"),
      exNum: (document.getElementById("exNum") || {}).textContent || null,
      hasScore: !!document.querySelector(".score-card"),
      q: (document.querySelector(".qtext") || {}).textContent ? document.querySelector(".qtext").textContent.slice(0, 30) : null
    }));
    console.log("  [wrong-run STUCK]", JSON.stringify(diag));
    await page.screenshot({ path: `${SHOTS}/wrong_stuck.png` });
    throw e;
  }
  const wrongItems = await page.$$eval(".wrong-item", els => els.length);
  assert(wrongItems === 50, `all-wrong -> 50 wrong items (got ${wrongItems})`);
  await shot("m_results_wrong", null);

  // ---- WRONG BOOK + persistence ----
  await page.click("#backBtn");
  await page.click('.mode-row[data-go="wrong"]');
  await page.waitForSelector(".wrong-item");
  const wbItems = await page.$$eval(".wrong-item", els => els.length);
  assert(wbItems >= 1, `wrong book lists items (got ${wbItems})`);
  await shot("m_wrong", null);
  // persistence: reload and re-check
  await page.reload({ waitUntil: "networkidle0" });
  await page.click('.mode-row[data-go="wrong"]');
  await page.waitForSelector(".wrong-item");
  const wbItems2 = await page.$$eval(".wrong-item", els => els.length);
  assert(wbItems2 >= 1, `wrong book persists after reload (got ${wbItems2})`);

  // ---- NOTES ----
  await page.click("#backBtn");
  await page.click('.mode-row[data-go="notes"]');
  await page.waitForSelector(".num-list");
  const numItems = await page.$$eval(".num-list li", els => els.length);
  assert(numItems === 8, `notes has 8 number anchors (got ${numItems})`);
  await shot("m_notes", null);

  // ---- DESKTOP visual ----
  await page.click("#backBtn");
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await shot("d_home", null);
  await page.click('.mode-row[data-go="memorize"]');
  await page.waitForSelector("#mReveal");
  await page.click("#mReveal");
  await page.waitForSelector(".ex-ans");
  await shot("d_memorize_reveal", null);
  // jump to an anchored question (s14) to verify 锚点 + 错坑 notes styling
  await page.evaluate(() => { memo.filter = "single"; memo.idx = 13; memo.revealed = false; renderMemoBody(); });
  await page.waitForSelector("#mReveal");
  await page.click("#mReveal");
  await page.waitForSelector(".ex-anchor");
  const anc = await page.$eval(".ex-anchor", e => e.textContent);
  assert(/锚点/.test(anc) && /show out/.test(anc), "s14 anchor text renders (锚点 + show out)");
  await shot("d_memorize_anchor", null);

  // ---- no horizontal scroll on mobile ----
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(URL, { waitUntil: "networkidle0" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `no horizontal scroll on 375px (overflow=${overflow})`);

  await browser.close();

  const realBad = bad.filter(u => !/favicon/i.test(u));
  assert(realBad.length === 0, `no 4xx except favicon (got ${bad.length}: ${bad.join("; ")})`);
  assert(errors.length === 0, `no console/page errors (got ${errors.length})`);
  if (errors.length) errors.forEach(e => console.log("  " + e));

  const failed = results.filter(r => !r[0]).length;
  console.log("\n==== " + (failed === 0 ? "ALL PASS" : failed + " FAILURES") + " ====");
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error("THREW", e); process.exit(2); });

async function clickOpt(page, key) {
  for (let t = 0; t < 5; t++) {
    await page.$eval(`#exOpts .opt[data-k="${key}"]`, e => e.click()).catch(() => {});
    await new Promise(r => setTimeout(r, 30));
    const sel = await page.$eval(`#exOpts .opt[data-k="${key}"]`, e => e.classList.contains("sel")).catch(() => false);
    if (sel) return;
  }
}
async function clickNext(page, prevNum) {
  for (let t = 0; t < 5; t++) {
    await page.$eval("#exNext", e => e.click()).catch(() => {});
    await new Promise(r => setTimeout(r, 40));
    const ok = await page.evaluate(pn =>
      document.getElementById("topTitle").textContent === "答题结果" ||
      (document.getElementById("exNum") && document.getElementById("exNum").textContent !== pn), prevNum);
    if (ok) return;
  }
}
async function answerAll(page, mode) {
  for (let i = 0; i < 55; i++) {
    const onResults = await page.evaluate(() => document.getElementById("topTitle").textContent === "答题结果");
    if (onResults) return;
    const text = await page.$eval(".qtext", e => e.textContent.trim()).catch(() => null);
    if (!text) return;
    const q = QUESTIONS.find(x => x.text.trim() === text);
    if (!q) { console.log("  [unmatched text]", JSON.stringify(text.slice(0, 40))); await clickNext(page, await page.$eval("#exNum", e => e.textContent).catch(() => null)); continue; }
    const keys = await page.$$eval("#exOpts .opt", els => els.map(e => e.dataset.k));
    let pick = mode === "correct" ? q.answer.slice() : keys.filter(k => !q.answer.includes(k));
    if (q.type === "bool" && mode !== "correct") pick = [pick[0]];
    for (const k of pick) await clickOpt(page, k);
    const prevNum = await page.$eval("#exNum", e => e.textContent).catch(() => null);
    await clickNext(page, prevNum);
  }
}
