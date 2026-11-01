import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.HOME + '/ramonmr-web/wp-content/plugins/ramon-touring';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const server = createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/harness.html'; const f=join(ROOT,p); if(!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(readFileSync(f)); });
await new Promise(r=>server.listen(8885,r));
const browser = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--mute-audio'] });
const views = JSON.parse(process.env.VIEWS || '[["snow",390,844],["auto",390,844]]');
for (const [env, w, h] of views) {
  const page = await browser.newPage();
  await page.setViewport({ width:w, height:h, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await page.goto('http://127.0.0.1:8885/harness.html?rmdebug=1', { waitUntil:'networkidle0' });
  await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
  await page.evaluate((e) => { window.__rm.setEnv(e); window.__rm.setQuality('high'); }, env);
  await page.click('.start-play');
  // wait for SIM time > 6s (headless renders slowly) and blink off
  await page.waitForFunction(() => { const s = window.__rm.s(); return s.time > 6 && s.inv <= 0; }, { timeout: 90000, polling: 500 });
  await page.screenshot({ path: `/tmp/shots/v3-${env}-${w}x${h}.png` });
  console.log('shot', env, w, h);
  await page.close();
}
await browser.close(); server.close();
