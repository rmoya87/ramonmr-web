import { stepTraffic } from '../../wp-content/plugins/ramon-touring/assets/game/TrafficManager.js';
import { createRun } from '../../wp-content/plugins/ramon-touring/assets/game/GameManager.js';
let seed=1; Math.random=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296;};
const [k0,k1,lvl]=[+process.argv[2]||0,+process.argv[3]||1,process.argv[4]];
const levels=[[0,160],[200,220],[400,250]].filter((_,i)=>lvl===undefined||+lvl===i);
const HW=0.92+0.1, HL=2.15+0.1, VLAT=6, DT=0.1, H=5, XS=-6, XE=6, DX=0.25, NX=Math.round((XE-XS)/DX)+1;

const spd=220;
function dead(cars){ const snaps=[]; for(let st=0;st<=60;st++) snaps.push({d:1000,cars}); const base=snaps[0]; const a=0; let anyOK=false;
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

  return !anyOK; }
const wall=[-4,0,4].map(x=>({d:1060,x,w:2.55,l:11.5}));
console.log('wall (3 buses, static, 60 m ahead): dead =', dead(wall));
console.log('gap case (bus,bus, 3.5 m free corridor): dead =', dead([{d:1060,x:-4,w:2.55,l:11.5},{d:1060,x:3.5,w:2.55,l:11.5}]));
console.log('wall far (3 buses 400 m ahead, closes in 5 s? no): dead =', dead(wall.map(c=>({...c,d:1400}))));
