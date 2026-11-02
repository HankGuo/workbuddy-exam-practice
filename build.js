// 把 data.js 重新内联进 index.html 的第一个数据 <script> 块（保持单文件、无外部依赖）
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const data = fs.readFileSync("data.js", "utf8");
const re = /<script>\s*\/\/ 自动生成[\s\S]*?<\/script>/;
if (!re.test(html)) { console.error("未找到数据脚本块"); process.exit(1); }
const newHtml = html.replace(re, "<script>\n" + data + "\n</script>");
fs.writeFileSync("index.html", newHtml);
console.log("已重新内联数据到 index.html，length =", newHtml.length);
