import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.HOME + '/ramonmr-web/wp-content/plugins/ramon-touring';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const server = createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/harness.html'; const f=join(ROOT,p); if(!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(readFileSync(f)); });
await new Promise(r=>server.listen(8890,r));
const browser = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--mute-audio'] });
for (const [name,w,h] of [['390x844',390,844],['360x640',360,640],['landscape-844x390',844,390]]) {
  const page = await browser.newPage();
  await page.setViewport({ width:w, height:h, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await page.goto('http://127.0.0.1:8890/harness.html?rmdebug=1', { waitUntil:'networkidle0' });
  await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
  await page.click('.start-play');
  await page.waitForFunction(() => window.__rm.s().time > 6 && window.__rm.s().inv <= 0, { timeout: 120000, polling: 500 });
  await page.screenshot({ path: `/tmp/shots/v10-${name}.png` });
  console.log('shot', name);
  await page.close();
}
await browser.close(); server.close();
