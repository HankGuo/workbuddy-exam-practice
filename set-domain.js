// 一键把 GitHub Pages 绑定到任意自定义域名。
// 用法：node set-domain.js <完整域名>   例如：node set-domain.js workbuddy.fkbg.tech
//
// 正确顺序（踩过坑）：
//   1. 写仓库根目录 CNAME 文件并推送 —— 对 legacy 模式，这一步就是 GitHub 的触发器
//   2. 等 GitHub 为该域名签好 Let's Encrypt 证书（CNAME 文件推上去后自动开始）
//   3. 证书就位后再调 API 设置 cname + https_enforced
//      （顺序反了会报 "The certificate does not exist yet"）
//
// 前置条件：域名 DNS 已解析到 hankguo.github.io（子域用 CNAME，根域用 4 条 A 记录）
const { execSync } = require("child_process");
const fs = require("fs");

const DOMAIN = (process.argv[2] || "").trim().toLowerCase();
if (!DOMAIN) {
  console.error("用法：node set-domain.js <完整域名>");
  console.error("例如：node set-domain.js workbuddy.fkbg.tech");
  process.exit(1);
}
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(DOMAIN)) {
  console.error("域名格式不对：" + DOMAIN);
  process.exit(1);
}
const REPO = "HankGuo/workbuddy-exam-practice";
const sh = (cmd) => execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
const pagesState = () => {
  try { return JSON.parse(sh("gh api repos/" + REPO + "/pages")); } catch (e) { return {}; }
};

console.log("目标域名：" + DOMAIN);

// 1. CNAME 文件 -> commit -> push
fs.writeFileSync("CNAME", DOMAIN + "\n");
try { sh("git add CNAME"); } catch (e) {}
try {
  sh('git commit -m "chore: 绑定自定义域名 ' + DOMAIN + '"');
  console.log("[1/4] 已提交 CNAME");
} catch (e) {
  console.log("[1/4] CNAME 内容未变，跳过提交");
}
sh("git push origin main");
console.log("[2/4] 已推送 main（触发 GitHub 签证书）");

// 2. 轮询：等证书签发 + Pages 认领该域名
console.log("[3/4] 等待证书签发（最长 10 分钟）…");
let certReady = false;
for (let i = 0; i < 40; i++) {
  const st = pagesState();
  const cname = st.cname || "";
  const https = st.https_enforced;
  process.stdout.write(
    "      cname=" + (cname || "null") + " https=" + https + " status=" + (st.status || "?") + "\n"
  );
  if (cname === DOMAIN && https === true) { certReady = true; break; }
  // 证书就位后才允许改 https_enforced
  if (cname === DOMAIN && !https) {
    try {
      sh('gh api -X PUT repos/' + REPO + '/pages -F "cname=' + DOMAIN + '" -F "https_enforced=true"');
    } catch (e) { /* 证书还没签完，下一轮再试 */ }
  }
  execSync("sleep 15");
}

// 3. 收尾：确保 https_enforced 打开
if (!pagesState().https_enforced) {
  try {
    sh('gh api -X PUT repos/' + REPO + '/pages -F "cname=' + DOMAIN + '" -F "https_enforced=true"');
  } catch (e) {}
}
const fin = pagesState();
console.log("[4/4] cname=" + fin.cname + " | https_enforced=" + fin.https_enforced + " | " + fin.html_url);

if (certReady || (fin.cname === DOMAIN && fin.https_enforced)) {
  console.log("\n✔ 完成。访问：https://" + DOMAIN + "/");
  console.log("  （DNS 刚改完的话，个别地方可能还要等几分钟缓存过期）");
} else {
  console.log("\n证书还没就位。DNS 生效通常几分钟，证书签发一般 5–30 分钟，过一会儿重跑本命令即可。");
}
