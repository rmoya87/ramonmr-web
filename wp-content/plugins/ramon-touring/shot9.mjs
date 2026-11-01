import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.HOME + '/ramonmr-web/wp-content/plugins/ramon-touring';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const server = createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/harness.html'; const f=join(ROOT,p); if(!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(readFileSync(f)); });
await new Promise(r=>server.listen(8889,r));
const browser = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width:1280, height:713, deviceScaleFactor:1 });
await page.goto('http://127.0.0.1:8889/harness.html?rmdebug=1', { waitUntil:'networkidle0' });
await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
await page.evaluate(() => { window.__rm.setQuality('high'); });
await page.click('.start-play');
// capture a passing sequence: 8 frames ~700ms apart while traffic is being overtaken
for (let i=0;i<8;i++) {
  await new Promise(r=>setTimeout(r,700));
  const info = await page.evaluate(() => { const s=window.__rm.s(); const near=s.traffic.map(t=>({z:+(t.d-s.d).toFixed(1),x:t.x})).filter(t=>t.z>-16&&t.z<8); return {speed:Math.round(s.speed), near}; });
  await page.screenshot({ path: `/tmp/shots/v9-pass-${i}.png` });
  console.log(i, JSON.stringify(info));
}
await browser.close(); server.close();
