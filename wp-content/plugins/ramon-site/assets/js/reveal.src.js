(function(){
if(!('IntersectionObserver' in window))return;
var sel='.service-card,.related-card-details';
function tag(){document.querySelectorAll(sel).forEach(function(el){el.classList.add('native-reveal');});}
function watch(){
var io=new IntersectionObserver(function(entries){
entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('native-reveal-in');io.unobserve(e.target);}});
},{rootMargin:'0px 0px -8% 0px',threshold:0.05});
document.querySelectorAll(sel).forEach(function(el){io.observe(el);});
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){tag();watch();});}else{tag();watch();}
})();
