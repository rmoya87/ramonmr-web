import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.HOME + '/ramonmr-web/wp-content/plugins/ramon-touring';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const server = createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/harness.html'; const f=join(ROOT,p); if(!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(readFileSync(f)); });
await new Promise(r=>server.listen(8891,r));
const browser = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--mute-audio'] });
for (const [env,w,h] of [["auto",390,844],["auto",360,640]]) {
  const page = await browser.newPage();
  await page.setViewport({ width:w, height:h, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await page.goto('http://127.0.0.1:8891/harness.html?rmdebug=1', { waitUntil:'networkidle0' });
  await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
  await page.evaluate((e) => { window.__rm.setEnv(e); window.__rm.setQuality('high'); }, env);
  await page.click('.start-play');
  await page.waitForFunction(() => { const s = window.__rm.s(); return s.time > 6 && s.inv <= 0; }, { timeout: 90000, polling: 500 });
  await page.screenshot({ path: `/tmp/shots/v4-auto-${w}x${h}.png` });
  console.log('shot auto', w, h);
  await page.close();
}
await browser.close(); server.close();
