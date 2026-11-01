import { stepTraffic } from '../../wp-content/plugins/ramon-touring/assets/game/TrafficManager.js';
import { createRun } from '../../wp-content/plugins/ramon-touring/assets/game/GameManager.js';
let seed=1; Math.random=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296;};
const [k0,k1,lvl]=[+process.argv[2]||0,+process.argv[3]||1,process.argv[4]];
const levels=[[0,160],[200,220],[400,250]].filter((_,i)=>lvl===undefined||+lvl===i);
const HW=0.92+0.1, HL=2.15+0.1, VLAT=6, DT=0.1, H=5, XS=-6, XE=6, DX=0.25, NX=Math.round((XE-XS)/DX)+1;
const out=[];
for (let k=k0;k<k1;k++){ seed=77+k*104729; const sd=seed;
 for (const [t0,spd] of levels){
  const s=createRun('arcade'); s.time=t0; s.speed=spd; const snaps=[]; const oldFlags=[]; const S=14;
  for (let i=0;i<3600*5;i++){ stepTraffic(s,1/60); s.d+=spd/3.6/60; s.time+=1/60;
    if(i%6===0){ snaps.push({d:s.d, cars:s.traffic.filter(c=>Math.abs(c.d-s.d)<200).map(c=>({d:c.d,x:c.x,w:c.width,l:c.length}))}); }
    if(i%6===0){ const cars=s.traffic.filter(c=>c.d-s.d>8&&c.d-s.d<160); let wall=false; for(const p of cars){ const lanes=new Set(); for(const c of cars) if(c.d>=p.d&&c.d<=p.d+S) for(let q=0;q<3;q++) if(Math.abs(c.x-[-4,0,4][q])<c.width/2+0.85) lanes.add(q); if(lanes.size===3){wall=true;break;} } oldFlags.push(wall);} }
  let dead=0, tests=0, oldWallTests=0, oldWallDead=0; const deadAt=[];
  for (let a=0; a+H*10<snaps.length; a+=10){ // every 1 s
    const base=snaps[a];
    let anyOK=false;
    for (const f of [1,0.7,0.45]){ // keep speed, ease off, brake hard
      const vp=spd/3.6*f; let alive=new Array(NX).fill(false);
      for (const lc of [-4,0,4]) alive[Math.round((lc-XS)/DX)]=true; // start from a lane centre
      for (let st=1; st<=H*10 && alive.some(Boolean); st++){
        const sn=snaps[a+st]; const dp=base.d+vp*st*DT; const nxt=new Array(NX).fill(false);
        const near=sn.cars.filter(c=>Math.abs(c.d-dp)<c.l/2+HL+0.5);
        const free=(i)=>{ const x=XS+i*DX; for(const c of near){ if(Math.abs(c.x-x)<c.w/2+HW && Math.abs(c.d-dp)<c.l/2+HL) return false;} return true; };
        const fr=new Array(NX); for(let i=0;i<NX;i++) fr[i]=free(i);
        const r=Math.round(VLAT*DT/DX);
        for(let i=0;i<NX;i++) if(alive[i]) for(let j=Math.max(0,i-r);j<=Math.min(NX-1,i+r);j++) if(fr[j]) nxt[j]=true;
        alive=nxt;
      }
      if(alive.some(Boolean)){anyOK=true;break;}
    }
    tests++; if(!anyOK){dead++; deadAt.push(a/10);}
    // old flag near this window
    const wnd=oldFlags.slice(a,a+10); if(wnd.some(Boolean)){oldWallTests++; if(!anyOK) oldWallDead++;}
  }
  out.push({sd,t0,tests,dead,oldWallTests,oldWallDead,deadAt:deadAt.slice(0,6)});
  console.log(JSON.stringify(out[out.length-1]));
 }}
