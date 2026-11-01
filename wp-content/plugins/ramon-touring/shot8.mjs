import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.HOME + '/ramonmr-web/wp-content/plugins/ramon-touring';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const server = createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/harness.html'; const f=join(ROOT,p); if(!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(readFileSync(f)); });
await new Promise(r=>server.listen(8888,r));
const browser = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width:1280, height:713, deviceScaleFactor:1 });
const dump = () => page.evaluate(() => {
  const s = window.__rm.s();
  const cam = window.__rm.roadGL.road.camera;
  const rc = document.querySelector('.race-screen canvas') || document.querySelector('canvas');
  return { time:+s.time.toFixed(2), speed:Math.round(s.speed), d:Math.round(s.d), ended:s.ended,
    camY:+s.camY.toFixed(2), camZ:+s.camZ.toFixed(2),
    camPosY:+cam.position.y.toFixed(2), camPosZ:+cam.position.z.toFixed(2), camFov:cam.fov,
    drawMs: rc ? rc.dataset.drawMs : 'nocanvas' };
});
await page.goto('http://127.0.0.1:8888/harness.html?rmdebug=1', { waitUntil:'networkidle0' });
await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
await page.click('.start-play');
await page.waitForFunction(() => window.__rm.s().time > 2.5, { timeout: 90000, polling: 300 });
console.log('FRESH   :', JSON.stringify(await dump()));
await page.reload({ waitUntil:'networkidle0' });
await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
await page.click('.start-play');
await new Promise(r=>setTimeout(r,1500));
console.log('REST t+1:', JSON.stringify(await dump()));
await new Promise(r=>setTimeout(r,2500));
console.log('REST t+4:', JSON.stringify(await dump()));
await page.screenshot({ path: '/tmp/shots/v8-restored.png' });
// and a fresh run in the SAME page (no reload) for contrast: force game over? just reload+localStorage.clear
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil:'networkidle0' });
await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
await page.click('.start-play');
await new Promise(r=>setTimeout(r,2500));
console.log('FRESH2  :', JSON.stringify(await dump()));
await page.screenshot({ path: '/tmp/shots/v8-fresh2.png' });
await browser.close(); server.close();
