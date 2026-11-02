// Headless smoke test: stub DOM, run app logic, assert no throws + key outputs.
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const appCode = scripts[scripts.length - 1];

function makeEl(id) {
  const el = {
    id, _html: "", textContent: "", disabled: false, onclick: null, style: {},
    addEventListener(){},
    dataset: {}, classList: {
      _s: new Set(),
      add(c){this._s.add(c);}, remove(c){this._s.delete(c);},
      contains(c){return this._s.has(c);},
      toggle(c,f){ if(f===undefined) f=!this._s.has(c); f?this._s.add(c):this._s.delete(c); return f; }
    }
  };
  Object.defineProperty(el, "innerHTML", { get(){return this._html;}, set(v){this._html = String(v);} });
  return el;
}
const registry = {};
const document = {
  getElementById(id){ return registry[id] || (registry[id] = makeEl(id)); },
  querySelectorAll(){ return []; },
  addEventListener(){},
  createElement(){ return makeEl("x"); }
};
const localStore = new Map();
const localStorage = {
  getItem(k){ return localStore.has(k)?localStore.get(k):null; },
  setItem(k,v){ localStore.set(k,String(v)); },
  removeItem(k){ localStore.delete(k); }
};
const window = {
  matchMedia(){ return { matches:false }; },
  scrollTo(){}, addEventListener(){}
};

const tests = `
;(function(){
  const log = (m)=>console.log(m);
  let fail=0;
  const assert=(c,m)=>{ if(!c){fail++;console.log("FAIL: "+m);} else console.log("ok: "+m); };

  render();
  assert(document.getElementById("view").innerHTML.includes("题库自测"), "home renders title");
  assert(document.getElementById("view").innerHTML.includes("背题模式"), "home has modes");

  go("memorize");
  assert(document.getElementById("memoBody").innerHTML.includes("显示解析"), "memorize shows reveal btn");

  memo.revealed=true; renderMemoBody();
  assert(document.getElementById("memoBody").innerHTML.includes("正确答案"), "memorize reveal shows answer");

  clearWrong();
  toggleWrong("s1");
  assert(loadWrong().includes("s1"), "toggleWrong adds s1");
  toggleWrong("s1");
  assert(!loadWrong().includes("s1"), "toggleWrong removes s1 (no dup)");

  // exam full
  examCfg.range="all"; examCfg.qty="all"; examCfg.timer=false;
  startExam();
  assert(exam && exam.list.length===93, "exam full list=93 got "+(exam&&exam.list.length));
  // answer everything correctly
  exam.list.forEach(q=>{ exam.answers[q.id]=q.answer.slice(); });
  submitExam();
  assert(document.getElementById("topTitle").textContent==="答题结果", "results bar title");
  assert(document.getElementById("view").innerHTML.includes("全部答对"), "results all-correct verdict");

  // exam sim50
  clearWrong();
  examCfg.range="all"; examCfg.qty="sim50"; examCfg.timer=true;
  startExam();
  assert(exam.list.length===50, "sim50 list=50 got "+exam.list.length);
  const cnt={single:0,multiple:0,bool:0}; exam.list.forEach(q=>cnt[q.type]++);
  assert(cnt.single===30&&cnt.multiple===10&&cnt.bool===10, "sim50 distribution 30/10/10 got "+JSON.stringify(cnt));
  // wrong all
  exam.list.forEach(q=>{ exam.answers[q.id]=[]; });
  submitExam();
  assert(document.getElementById("view").innerHTML.includes("错题解析"), "wrong-all shows wrong list");
  assert(loadWrong().length===50, "all 50 wrong saved (distinct) got "+loadWrong().length);

  // wrong book render
  go("wrong");
  assert(document.getElementById("topTitle").textContent==="错题本", "wrong book bar title");
  assert(document.getElementById("view").innerHTML.includes("待复习"), "wrong book lists items");

  // review
  openReview(QUESTIONS[0], true);
  assert(document.getElementById("view").innerHTML.includes("显示解析"), "review shows reveal");

  // notes
  go("notes");
  assert(document.getElementById("view").innerHTML.includes("关键数字锚点"), "notes render");

  // isCorrect logic
  assert(isCorrect(QUESTIONS[0], QUESTIONS[0].answer.slice())===true, "isCorrect true");
  assert(isCorrect(QUESTIONS[0], ["Z"])===false, "isCorrect false");

  // buildExplanation returns string for all
  let exOk=true; QUESTIONS.forEach(q=>{ if(typeof buildExplanation(q)!=="string") exOk=false; });
  assert(exOk, "buildExplanation works for all 93");

  console.log(fail===0? "ALL PASS":"HAS FAILURES:"+fail);
})();
`;

const vm = require("vm");
const ctx = { document, window, localStorage, console, setInterval:()=>0, clearInterval:()=>{}, setTimeout:()=>0, clearTimeout:()=>{}, Math, JSON, RegExp, Array, Object, String, Number, parseInt };
ctx.globalThis = ctx;
vm.createContext(ctx);
try {
  vm.runInContext(scripts[0] + "\n" + appCode + tests, ctx, { filename: "app.js" });
} catch (e) {
  console.log("THREW:", e.message, "\n", e.stack.split("\n").slice(0,4).join("\n"));
}
