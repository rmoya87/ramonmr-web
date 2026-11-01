import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.HOME + '/ramonmr-web/wp-content/plugins/ramon-touring';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const server = createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/harness.html'; const f=join(ROOT,p); if(!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(readFileSync(f)); });
await new Promise(r=>server.listen(8887,r));
const browser = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width:1280, height:713, deviceScaleFactor:1 });
const dump = () => page.evaluate(() => {
  const s = window.__rm.s();
  const cam = window.__rm.roadGL.road.camera;
  return { time:s.time.toFixed(1), speed:Math.round(s.speed), camY:s.camY, camZ:s.camZ, fovBoost:s.fovBoost, shake:s.shake, x:s.x, camX:s.camX, steer:s.steer, branch:s.branch, fork:s.fork, d:Math.round(s.d), ended:s.ended,
    camPos:[cam.position.x,cam.position.y,cam.position.z].map(v=>+v.toFixed(2)), camFov:+cam.fov.toFixed(1), camAspect:+cam.aspect.toFixed(2) };
});
await page.goto('http://127.0.0.1:8887/harness.html?rmdebug=1', { waitUntil:'networkidle0' });
await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
await page.click('.start-play');
await page.waitForFunction(() => window.__rm.s().time > 2.5, { timeout: 90000, polling: 300 });
console.log('FRESH:', JSON.stringify(await dump()));
await page.screenshot({ path: '/tmp/shots/v7-fresh.png' });
await page.reload({ waitUntil:'networkidle0' });
await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'));
const snap = await page.evaluate(() => localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith('_run'))||'none'));
console.log('SNAPSHOT SAVED:', snap ? snap.slice(0,120) : 'NONE');
await page.click('.start-play');
await page.waitForFunction(() => window.__rm.s().time > 2.5, { timeout: 90000, polling: 300 });
console.log('RESTORED:', JSON.stringify(await dump()));
await page.screenshot({ path: '/tmp/shots/v7-restored.png' });
await browser.close(); server.close();
