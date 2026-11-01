import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.env.HOME + '/ramonmr-web/wp-content/plugins/ramon-touring';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png' };
const server = createServer((req,res)=>{
  let p = req.url.split('?')[0]; if (p==='/') p='/harness.html';
  const f = join(ROOT,p);
  if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'});
  res.end(readFileSync(f));
});
await new Promise(r=>server.listen(8877,r));

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--mute-audio','--force-device-scale-factor=2'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.on('console', m => { const t=m.text(); if(!/Download the React|three/i.test(t)) console.log('[con]', t.slice(0,200)); });
page.on('pageerror', e => console.log('[err]', String(e).slice(0,300)));
await page.goto('http://127.0.0.1:8877/harness.html?rmdebug=1', { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForFunction(() => window.__rm && document.querySelector('.start-play'), { timeout: 20000 });
console.log('loaded, webgl ok');
await page.screenshot({ path: '/tmp/shots/00-start.png' });

// force low quality to exaggerate the cap bug (cap 16 vs pool 26)
await page.evaluate(() => window.__rm.setQuality('low'));
await page.click('.start-play');
await new Promise(r=>setTimeout(r,4000));

// Report: cars in the visible band vs drawn meshes
const report = await page.evaluate(() => {
  const s = window.__rm.s();
  const road = window.__rm.roadGL; // GameView; reach RoadWorld
  const rw = road.road || road['road'];
  const drawn = new Set(); const vis = new Set();
  for (const [id, mesh] of rw.traffic) { drawn.add(id); if (mesh.visible) vis.add(id); }
  const trafficFar = window.__rm.perf.settings().drawDistance * 0.72;
  const band = s.traffic.map(t => ({ id: t.id, z: +(t.d - s.d).toFixed(1), x: +t.x.toFixed(1), lane: t.x }))
    .filter(t => t.z > -14 && t.z < trafficFar);
  const missing = band.filter(t => !vis.has(t.id));
  return { d: +s.d.toFixed(1), x: +s.x.toFixed(2), speed: Math.round(s.speed), pool: s.traffic.length,
    band: band.length, missingCount: missing.length,
    missing: missing.slice(0,12), quality: window.__rm.perf.settings() };
});
console.log(JSON.stringify(report, null, 1));
await page.screenshot({ path: '/tmp/shots/01-driving-low.png' });
await browser.close(); server.close();
