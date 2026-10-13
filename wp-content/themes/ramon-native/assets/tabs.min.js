var __rnEn=(document.documentElement.lang||'').slice(0,2)==='en';
/* Core Group + Button blocks, progressively enhanced. All content stays readable without JS. */
document.querySelectorAll('.native-tabs').forEach((set,groupIndex)=>{
 const nav=set.querySelector('.tab-nav');if(!nav)return;const links=[...nav.querySelectorAll('a,button')];const panels=[...set.querySelectorAll(':scope > .tab-panel')];
 if(!links.length||links.length!==panels.length)return;nav.setAttribute('role','tablist');
 var cur=0;var reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 function select(index,focus=false){links.forEach((link,i)=>{link.setAttribute('aria-selected',String(i===index));link.tabIndex=i===index?0:-1});if(focus)links[index].focus();
 if(index===cur||reducedMotion.matches){panels.forEach((p,i)=>{p.hidden=i!==index});cur=index;return}
 var oldP=panels[cur],newP=panels[index];cur=index;
 var host=oldP.parentElement;host.style.position='relative';host.style.minHeight=oldP.offsetHeight+'px';host.style.overflowX='clip';
 var ot=oldP.offsetTop,ol=oldP.offsetLeft,ow=oldP.offsetWidth;
 oldP.style.position='absolute';oldP.style.top=ot+'px';oldP.style.left=ol+'px';oldP.style.width=ow+'px';
 newP.hidden=false;
 oldP.classList.add('tab-slide-exit');newP.classList.add('tab-slide-enter');
 requestAnimationFrame(function(){requestAnimationFrame(function(){oldP.classList.add('tab-slide-go');newP.classList.add('tab-slide-go')})});
 setTimeout(function(){oldP.hidden=true;oldP.classList.remove('tab-slide-exit','tab-slide-go');newP.classList.remove('tab-slide-enter','tab-slide-go');oldP.style.position='';oldP.style.top='';oldP.style.left='';oldP.style.width='';host.style.minHeight='';host.style.position='';host.style.overflowX=''},320)}
 links.forEach((link,i)=>{link.setAttribute('role','tab');link.id=`ramon-tab-${groupIndex}-${i}`;link.setAttribute('aria-controls',panels[i].id);panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',link.id);link.addEventListener('click',e=>{e.preventDefault();select(i)});link.addEventListener('keydown',e=>{let j=i;if(e.key==='ArrowRight')j=(i+1)%links.length;else if(e.key==='ArrowLeft')j=(i+links.length-1)%links.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=links.length-1;else return;e.preventDefault();select(j,true)})});select(0);
});

/* Carrusel CV: si una pestaña de Formación/Herramientas tiene más de 6 tarjetas, se activa scroll con flechas y puntos. */
document.querySelectorAll('.native-tabs .tab-panel > .certificate-grid, .native-tabs .tab-panel > .tool-grid').forEach(grid=>{
 const items=[...grid.children];if(items.length<=6)return;
 grid.classList.add('re-carousel-on');
 const nav=document.createElement('div');nav.className='re-carousel-nav';
 const prev=document.createElement('button');prev.type='button';prev.setAttribute('aria-label',__rnEn?'Previous':'Anterior');prev.textContent='←';
 const next=document.createElement('button');next.type='button';next.setAttribute('aria-label',__rnEn?'Next':'Siguiente');next.textContent='→';
 const pages=Math.ceil(items.length/6);
 const dots=document.createElement('div');dots.className='re-carousel-dots';dots.setAttribute('role','group');dots.setAttribute('aria-label',__rnEn?'Pages':'Páginas');
 let page=0;
 function go(i){page=(i+pages)%pages;const item=items[page*6];grid.scrollTo({left:item.offsetLeft-grid.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});[...dots.children].forEach((d,n)=>d.setAttribute('aria-current',String(n===page)))}
 for(let n=0;n<pages;n++){const d=document.createElement('button');d.type='button';d.setAttribute('aria-label',(__rnEn?`Page ${n+1} of ${pages}`:`Página ${n+1} de ${pages}`));d.setAttribute('aria-current',String(n===0));d.addEventListener('click',()=>go(n));dots.appendChild(d)}
 prev.addEventListener('click',()=>go(page-1));next.addEventListener('click',()=>go(page+1));
 nav.append(prev,dots,next);grid.after(nav);
});

/* Lightbox nativo para galerías de proyecto (1.4.5); marcos de dispositivo solo en modo carrusel (1.6.40) */
(function(){
  var gal=document.querySelector('.project-native-gallery');
  if(!gal)return;
  var links=[].slice.call(gal.querySelectorAll('figure a'));
  if(!links.length)return;
  var imgs=links.map(function(a){return a.querySelector('img');});
  links.forEach(function(a,i){
    var img=imgs[i];
    if(img){var n=new Image();n.onload=function(){if(n.naturalWidth<=300){var f=a.closest('figure');if(f)f.classList.add('rn-contain');}};n.src=img.currentSrc||img.src;}
  });
  var lb=document.createElement('div');lb.className='rn-lightbox';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label',__rnEn?'Image gallery':'Galería de imágenes');
  lb.innerHTML='<div class="rn-lb-frame"><div class="rn-lb-chrome"><i></i><i></i><i></i><span class="rn-lb-url"></span></div><div class="rn-lb-scroll" tabindex="0"><img alt=""></div></div><span class="rn-lb-count"></span><button type="button" class="rn-lb-btn rn-lb-close" aria-label="'+(__rnEn?'Close':'Cerrar')+'">✕</button><button type="button" class="rn-lb-btn rn-lb-prev" aria-label="'+(__rnEn?'Previous image':'Imagen anterior')+'">‹</button><button type="button" class="rn-lb-btn rn-lb-next" aria-label="'+(__rnEn?'Next image':'Imagen siguiente')+'">›</button>';
  document.body.appendChild(lb);
  var frame=lb.querySelector('.rn-lb-frame'),scroller=lb.querySelector('.rn-lb-scroll'),pic=lb.querySelector('img'),cnt=lb.querySelector('.rn-lb-count'),cur=0,lastFocus=null;
  function applyFrame(){
    var img=imgs[cur],w=img?img.naturalWidth:0,h=img?img.naturalHeight:0,cls='rn-lb-frame';
    var fig=imgs[cur]?imgs[cur].closest('.wp-block-image'):null;
    if(w&&h){var r=h/w,dev=(Math.abs(r-1.7778)<0.01||Math.abs(r-2.1667)<0.022||Math.abs(r-2)<0.02);
      if(fig&&fig.classList.contains('rn-force-browser'))cls+=' rn-lb-browser';
      else if(fig&&fig.classList.contains('rn-force-phone'))cls+=' rn-lb-phone';
      else if(dev&&w<=1500)cls+=' rn-lb-phone';
      else if(w<=300&&r>=1.6)cls+=' rn-lb-phone';
      else if(r<=0.83||r>=1.5||w>=1300)cls+=' rn-lb-browser';
    }
    if(frame.className!==cls)frame.className=cls;
  }
  function show(i){
    cur=(i+links.length)%links.length;var big=links[cur].getAttribute('href');
    pic.src=big||imgs[cur].src;pic.alt=imgs[cur]?(imgs[cur].alt||''):'';cnt.textContent=(cur+1)+' / '+links.length;
    scroller.scrollTop=0;applyFrame();
    var probe=new Image();probe.onload=function(){applyFrame();};probe.src=pic.src;
  }
  function open(i){lastFocus=document.activeElement;show(i);lb.classList.add('rn-open');document.body.style.overflow='hidden';lb.querySelector('.rn-lb-close').focus();}
  function close(){lb.classList.remove('rn-open');document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus();}
  links.forEach(function(a,i){a.addEventListener('click',function(e){e.preventDefault();open(i);});});
  lb.querySelector('.rn-lb-close').addEventListener('click',close);
  lb.querySelector('.rn-lb-prev').addEventListener('click',function(){show(cur-1);});
  lb.querySelector('.rn-lb-next').addEventListener('click',function(){show(cur+1);});
  lb.addEventListener('click',function(e){if(e.target===lb)close();});
  lb.addEventListener('keydown',function(e){
    if(e.key==='Escape'){close();return;}
    if(e.key==='ArrowLeft'){show(cur-1);return;}
    if(e.key==='ArrowRight'){show(cur+1);return;}
    if(e.key==='Tab'){var f=[].slice.call(lb.querySelectorAll('button'));var first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  var scT;scroller.addEventListener('scroll',function(){frame.classList.add('rn-scrolling');clearTimeout(scT);scT=setTimeout(function(){frame.classList.remove('rn-scrolling');},700);},{passive:true});
  var tx=0,ty=0;lb.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
  lb.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.4)show(cur+(dx<0?1:-1));},{passive:true});
})();
