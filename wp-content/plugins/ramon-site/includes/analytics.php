<?php
/**
 * Ramon Site: eventos de medicion para GA4 (G-1MRT7NG09T).
 *
 * GA4 y la funcion gtag los carga Complianz solo tras aceptar las cookies de
 * estadisticas. Este script no carga nada y comprueba en cada evento que gtag
 * existe y que la cookie cmplz_statistics sigue en allow (si el visitante
 * rechaza o revoca, deja de enviar aunque gtag siga en memoria). Solo envia nombres de evento y etiquetas fijas
 * (idioma, zona de la pagina, red social); nunca texto escrito por el visitante.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Titulo de la pagina de resultados de busqueda: Rank Math lo compone con lo que
 * escribio el visitante ("Busco por el termino ...") y GA4 lo envia como
 * page_title en cada evento (no se puede ocultar en GA). Se neutraliza en origen,
 * en el HTML, antes de que exista cualquier peticion de GA.
 */
function rsite_search_title_neutral() {
	$en = function_exists( 'pll_current_language' ) && 'en' === pll_current_language();
	return $en ? 'Search results' : 'Resultados de búsqueda';
}
function rsite_search_title_filter( $title ) {
	return is_search() ? rsite_search_title_neutral() : $title;
}
function rsite_search_title_parts( $parts ) {
	if ( is_search() && is_array( $parts ) ) {
		$parts['title'] = rsite_search_title_neutral();
	}
	return $parts;
}
add_filter( 'pre_get_document_title', 'rsite_search_title_filter', 99999 );
add_filter( 'document_title_parts', 'rsite_search_title_parts', 99999 );
add_filter( 'rank_math/frontend/title', 'rsite_search_title_filter', 99999 );
add_filter( 'rank_math/opengraph/facebook/og_title', 'rsite_search_title_filter', 99999 );
add_filter( 'rank_math/opengraph/twitter/twitter_title', 'rsite_search_title_filter', 99999 );

add_action( 'wp_footer', function () {
	if ( is_admin() || is_feed() || is_robots() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) { return; }
	?>
<script id="rsite-analytics-js">
(function(){
  function ok(){
    return typeof window.gtag==='function'&&/(?:^|;\s*)cmplz_statistics=allow(?:;|$)/.test(document.cookie);
  }
  function send(n,p){
    if(!ok()){return false;}
    p=p||{};p.page_language=(document.documentElement.lang||'').slice(0,2);
    try{window.gtag('event',n,p);return true;}catch(e){return false;}
  }
  function zone(el){
    var z=el.closest&&el.closest('header,footer,nav,main,section');
    if(!z){return 'page';}
    if(z.tagName==='HEADER'){return 'header';}
    if(z.tagName==='FOOTER'){return 'footer';}
    return 'content';
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a){return;}
    var u;try{u=new URL(a.getAttribute('href'),location.href);}catch(x){return;}
    var path=u.pathname.replace(/\/+$/,'');
    var host=u.hostname.replace(/^www\./,'');
    if(a.classList.contains('lang-switch')){send('language_switch',{to_language:(a.getAttribute('hreflang')||'').slice(0,2)});return;}
    if(host==='linkedin.com'||host==='x.com'||host==='twitter.com'){send('social_click',{network:host==='linkedin.com'?'linkedin':'x',link_zone:zone(a)});return;}
    if(host===location.hostname.replace(/^www\./,'')){
      if(/^(\/en)?\/(curriculum-ramon-de-moya|cv)$/.test(path)){send('cv_click',{link_zone:zone(a)});return;}
      if(/^(\/en)?\/(contactame|contact)$/.test(path)){send('contact_click',{link_zone:zone(a)});return;}
    }
  },true);
  var started=false;
  document.addEventListener('focusin',function(e){
    if(started||!e.target.closest){return;}
    if(e.target.closest('.wpcf7 form')&&send('form_start',{form_name:'contact'})){started=true;}
  });
  document.addEventListener('wpcf7mailsent',function(){send('generate_lead',{form_name:'contact'});});
  document.addEventListener('wpcf7invalid',function(){send('form_error',{form_name:'contact'});});
})();
</script>
	<?php
}, 100 );
