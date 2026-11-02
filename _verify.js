const puppeteer=require('puppeteer-core');
const path=require('path');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url=process.argv[2]||('file://'+path.resolve('index.html'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:390,height:844,isMobile:true});
  const errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text());});
  page.on('pageerror',e=>errors.push('pageerror:'+e.message));
  await page.goto(url,{waitUntil:'networkidle0'});
  const out={};

  // home
  out.modeRows=await page.$$eval('.mode-row',els=>els.length);
  out.hasRand=await page.$('#randBtn')?true:false;

  // 背题 two-step
  await page.evaluate(()=>document.querySelector('[data-go="memorize"]').click());
  await sleep(150);
  await page.evaluate(()=>document.getElementById('mReveal').click());
  await sleep(120);
  out.revealHasAnswer=await page.evaluate(()=>!!document.querySelector('.ex-ans'));
  out.revealHasExplainBtn=await page.evaluate(()=>!!document.getElementById('mExplain'));
  await page.evaluate(()=>document.getElementById('mExplain').click());
  await sleep(120);
  out.explainHasPlain=await page.evaluate(()=>!!document.querySelector('.ex-plain p'));
  out.explainConcepts=await page.$$eval('.cc-card',e=>e.length);

  // 概念白话
  await page.evaluate(()=>{document.getElementById('backBtn').click();});
  await sleep(100);
  await page.evaluate(()=>document.querySelector('[data-go="concepts"]').click());
  await sleep(150);
  out.conceptCards=await page.$$eval('.cc-card',e=>e.length);
  out.conceptTitle=await page.$eval('.cc-t',e=>e.textContent).catch(()=>null);

  // 真实答题 sim50
  await page.evaluate(()=>{document.getElementById('backBtn').click();});
  await sleep(100);
  await page.evaluate(()=>document.querySelector('[data-go="exam"]').click());
  await sleep(120);
  // 选 sim50
  await page.evaluate(()=>{const b=[...document.querySelectorAll('[data-seg="qty"] button')].find(x=>x.dataset.v==='sim50');b&&b.click();});
  await sleep(100);
  await page.evaluate(()=>document.getElementById('startExam').click());
  await sleep(150);
  // 答 50 题：每题点第一个选项，再下一题/提交
  for(let i=0;i<50;i++){
    await page.evaluate(()=>{const o=document.querySelector('#exOpts .opt');if(o)o.click();});
    await sleep(40);
    const last=await page.evaluate(()=>{const b=document.getElementById('exNext');if(!b)return true;return b.textContent.includes('提交');});
    await page.evaluate(()=>{const b=document.getElementById('exNext');if(b)b.click();});
    await sleep(60);
    if(last)break;
  }
  await sleep(200);
  out.resultScore=await page.$eval('.score-num',e=>e.textContent.trim()).catch(()=>null);
  out.resultStreak=await page.$eval('.score-streak',e=>e.textContent.trim()).catch(()=>null);
  out.resultMsg=await page.$eval('.score-msg',e=>e.textContent.trim()).catch(()=>null);
  out.wrongList=await page.$$eval('#wlist .wrong-item',e=>e.length).catch(()=>0);
  // 复习第一步
  if(out.wrongList>0){
    await page.evaluate(()=>document.querySelector('#wlist .wrong-item').click());
    await sleep(150);
    out.reviewRevealBtn=await page.evaluate(()=>!!document.getElementById('rvReveal'));
    await page.evaluate(()=>document.getElementById('rvReveal').click());
    await sleep(120);
    out.reviewAnswer=await page.evaluate(()=>!!document.querySelector('.ex-ans'));
    out.reviewExplainBtn=await page.evaluate(()=>!!document.getElementById('rvExplain'));
    await page.evaluate(()=>document.getElementById('rvExplain').click());
    await sleep(120);
    out.reviewPlain=await page.evaluate(()=>!!document.querySelector('.ex-plain p'));
  }

  // 横向滚动
  out.hScroll=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);

  out.errors=errors;
  console.log(JSON.stringify(out,null,2));
  await browser.close();
  // 判定
  const ok = out.modeRows===5 && out.hasRand && out.revealHasAnswer && out.revealHasExplainBtn &&
    out.explainHasPlain && out.conceptCards===20 && out.resultScore && out.errors.length===0 && out.hScroll===0;
  console.log(ok?'==== ALL PASS ====':'==== FAIL ====');
  process.exit(ok?0:1);
})().catch(e=>{console.error(e);process.exit(2);});
