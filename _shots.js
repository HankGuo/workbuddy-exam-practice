const puppeteer=require('puppeteer-core');
const path=require('path');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url='file://'+path.resolve('index.html');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dir='/tmp/shots';
require('fs').mkdirSync(dir,{recursive:true});
(async()=>{
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
  // 手机
  const m=await browser.newPage();
  await m.setViewport({width:390,height:844,isMobile:true,deviceScaleFactor:2});
  await m.goto(url,{waitUntil:'networkidle0'});
  await m.screenshot({path:dir+'/m_home.png'});
  // 概念白话
  await m.evaluate(()=>document.querySelector('[data-go="concepts"]').click());
  await sleep(200);
  await m.screenshot({path:dir+'/m_concepts.png'});
  // 背题两步：进入沙箱题 s37（带概念卡）
  await m.evaluate(()=>{document.getElementById('backBtn').click();});
  await sleep(100);
  await m.evaluate(()=>document.querySelector('[data-go="memorize"]').click());
  await sleep(120);
  // 翻到 s37：通过过滤+前进，或直接定位。简单点：循环 next 直到 text 含 沙箱
  for(let i=0;i<60;i++){
    const hit=await m.evaluate(()=>document.querySelector('.qtext')?.textContent.includes('Bash 命令沙箱'));
    if(hit)break;
    await m.evaluate(()=>document.getElementById('mNext')?.click());
    await sleep(40);
  }
  await m.evaluate(()=>document.getElementById('mReveal')?.click());
  await sleep(120);
  await m.evaluate(()=>document.getElementById('mExplain')?.click());
  await sleep(150);
  await m.screenshot({path:dir+'/m_memo_explain.png'});
  // 结算
  await m.evaluate(()=>{document.getElementById('backBtn').click();});
  await sleep(100);
  await m.evaluate(()=>document.querySelector('[data-go="exam"]').click());
  await sleep(120);
  await m.evaluate(()=>{const b=[...document.querySelectorAll('[data-seg="qty"] button')].find(x=>x.dataset.v==='sim50');b&&b.click();});
  await sleep(80);
  await m.evaluate(()=>document.getElementById('startExam').click());
  await sleep(150);
  for(let i=0;i<50;i++){
    await m.evaluate(()=>{const o=document.querySelector('#exOpts .opt');if(o)o.click();});
    await sleep(30);
    const last=await m.evaluate(()=>{const b=document.getElementById('exNext');return b&&b.textContent.includes('提交');});
    await m.evaluate(()=>{const b=document.getElementById('exNext');if(b)b.click();});
    await sleep(45);
    if(last)break;
  }
  await sleep(200);
  await m.screenshot({path:dir+'/m_result.png'});

  // 桌面
  const d=await browser.newPage();
  await d.setViewport({width:1100,height:800,deviceScaleFactor:1});
  await d.goto(url,{waitUntil:'networkidle0'});
  await d.screenshot({path:dir+'/d_home.png'});
  await d.evaluate(()=>document.querySelector('[data-go="concepts"]').click());
  await sleep(200);
  await d.screenshot({path:dir+'/d_concepts.png',fullPage:true});
  await browser.close();
  console.log('shots saved to',dir);
})().catch(e=>{console.error(e);process.exit(1);});
