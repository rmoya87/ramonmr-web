import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.HOME + '/ramonmr-web/wp-content/plugins/ramon-touring';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const server = createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/harness.html'; const f=join(ROOT,p); if(!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(readFileSync(f)); });
await new Promise(r=>server.listen(8884,r));
const browser = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width:390, height:844, deviceScaleFactor:2, isMobile:true, hasTouch:true });
await page.goto('http://127.0.0.1:8884/harness.html?rmdebug=1', { waitUntil:'networkidle0' });
await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
await page.evaluate(() => { window.__rm.setEnv('snow'); window.__rm.setQuality('high'); });
await page.click('.start-play');
for (let i=0;i<6;i++) {
  await new Promise(r=>setTimeout(r,2500));
  const st = await page.evaluate(() => {
    const s = window.__rm.s();
    const rw = window.__rm.roadGL.road;
    const p = rw.player;
    return { t:+s.time.toFixed(1), inv:+s.inv.toFixed(2), hits:s.hits, x:+s.x.toFixed(2), d:Math.round(s.d),
      visible:p.visible, name:p.name, pos:p.position.toArray().map(v=>+v.toFixed(2)), scale:+p.scale.x.toFixed(2),
      camX:+s.camX.toFixed(2), camY:+s.camY.toFixed(2), camZ:+s.camZ.toFixed(2) };
  });
  console.log(JSON.stringify(st));
  await page.screenshot({ path:`/tmp/shots/dbg-${i}.png` });
}
await browser.close(); server.close();
