<?php
/**
 * Ramon Site: eventos de medicion para GA4 (G-1MRT7NG09T) + Consent Mode basico.
 *
 * GA4 y la funcion gtag los carga Complianz solo tras aceptar las cookies de
 * estadisticas. Antes de eso, este plugin declara el estado de consentimiento
 * por defecto (wp_head): analytics_storage sigue la cookie cmplz_statistics y
 * las tres senales de publicidad quedan siempre en denied (este sitio no usa
 * Ads). Mientras no haya consentimiento no se carga gtag.js ni se envia nada:
 * es Consent Mode en modo basico (bloqueo total hasta aceptar), no avanzado.
 * Si el visitante acepta durante la visita, un listener en fase de captura
 * encola el update ANTES de que Complianz cargue gtag.js y dispare el primer
 * hit (evita que ese primer hit salga en estado denied). Los cambios
 * posteriores (revocar, guardar preferencias) se cubren con el mismo listener
 * y con cmplz_status_change en el script de eventos, que usa el valor real
 * que trae el evento (detail.category/detail.value) y no la cookie.
 * El script de eventos comprueba ademas en cada evento que gtag existe y que
 * la cookie cmplz_statistics sigue en allow. Solo envia nombres de evento y
 * etiquetas fijas (idioma, zona de la pagina, red social); nunca texto
 * escrito por el visitante.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Estado de consentimiento por defecto, antes de que Complianz cargue gtag.js.
 * Se encola en dataLayer y gtag.js lo aplica al cargar (asi funciona la API
 * de consentimiento). Solo analitica sigue al visitante; publicidad siempre
 * denied porque el sitio no usa Ads.
 */
add_action( 'wp_head', function () {
	if ( is_admin() || is_feed() || is_robots() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) { return; }
	?>
<script id="rsite-consent-default">
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{
  'analytics_storage':/(?:^|;\s*)cmplz_statistics=allow(?:;|$)/.test(document.cookie)?'granted':'denied',
  'ad_storage':'denied',
  'ad_user_data':'denied',
  'ad_personalization':'denied'
});
/* Al aceptar en caliente, Complianz carga gtag.js y dispara el primer hit de
   inmediato. Este listener en fase de captura se ejecuta antes que el propio
   manejador de Complianz y encola el update ANTES del config, para que el
   primer hit ya salga con la senal correcta. Con "Aceptar" todo queda
   granted; con "Guardar preferencias" se lee la casilla de estadisticas. */
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.cmplz-accept,.cmplz-save-preferences'):null;
  if(!b){return;}
  var s='granted';
  if(b.classList.contains('cmplz-save-preferences')){
    var t=document.querySelector('input.cmplz-consent-checkbox[data-category="cmplz_statistics"]');
    s=(t&&t.checked)?'granted':'denied';
  }
  /* Kill switch reconciliado ANTES del update: granted lo limpia (por si
     una recarga de retirada fallo y la vista sigue viva) y denied lo activa
     si gtag esta cargado (retirada en caliente), para que la reaccion de la
     libreria al propio update quede suprimida. Propiedad de window: muere
     con la vista. */
  var ld=!!document.querySelector('script[src*="googletagmanager.com/gtag"]');
  try{window['ga-disable-G-1MRT7NG09T']=(s==='denied'&&ld);}catch(x){}
  try{window.gtag('consent','update',{'analytics_storage':s});}catch(x){}
},true);
</script>
	<?php
}, 1 );

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
  /* Complianz dispara cmplz_status_change UNA VEZ POR CATEGORIA y en
     "Aceptar todo" procesa functional/preferences ANTES que statistics:
     leer aqui la cookie cmplz_statistics mezclaba estados (empujaba un
     denied obsoleto despues del granted del clic, y el primer page_view
     salia con gcs=G100). El evento trae el valor real y nuevo de cada
     categoria en detail (complianz.min.js: cmplz_set_consent escribe la
     cookie y despacha {category, value, region, categories}), asi que solo
     se escucha la categoria statistics y se usa detail.value. Cubre
     aceptar (granted), guardar marcada (granted), guardar desmarcada y
     revocar (denied, incluida retirada desde preferencias sin recarga),
     sin flags persistentes ni lecturas de cookie que puedan quedar
     obsoletas. Si el evento no trae detail (otro emisor), se ignora: el
     listener en fase de captura y el default del head ya cubren esas rutas.
     Ademas, una retirada en caliente (denied con gtag cargado) fuerza
     recarga: GA4 ya cargado seguiria emitiendo pings automaticos. */
  document.addEventListener('cmplz_status_change',function(e){
    var d=e&&e.detail;
    if(!d||d.category!=='statistics'){return;}
    var s=d.value==='allow'?'granted':'denied';
    /* Kill switch reconciliado ANTES del update, igual que en el listener
       en fase de captura: granted lo limpia (una recarga de retirada pudo
       fallar y la vista seguir viva; sin esto un flag obsoleto dejaria GA
       apagado pese al consentimiento) y denied lo activa si gtag esta
       cargado. La libreria comprueba ga-disable-<id> en cada envio,
       incluido el flush por sendBeacon al descargar la pagina. */
    var ld=!!document.querySelector('script[src*="googletagmanager.com/gtag"]');
    try{window['ga-disable-G-1MRT7NG09T']=(s==='denied'&&ld);}catch(x){}
    try{window.gtag('consent','update',{'analytics_storage':s});}catch(x){}
    /* Retirada en caliente (denied con gtag cargado): Complianz NO recarga
       al retirar statistics (solo con marketing) y GA4 ya cargado sigue
       emitiendo pings automaticos sin cookie tras el denied (observado:
       collect gcs=G100). Se fuerza recarga con la misma logica que
       Complianz (parametro anti-cache en Firefox). Con el kill switch ya
       activo, ni siquiera el unload puede emitir. Si gtag no esta cargado
       no hay nada que parar y no se recarga. */
    if(s==='denied'&&ld){
      try{
        if(navigator.userAgent.toLowerCase().indexOf('firefox')>=0){
          var u=new URL(window.location.href);
          u.searchParams.set('cmplz-force-reload',Date.now().toString());
          window.location.href=u.toString();
        }else{window.location.reload();}
      }catch(x){}
    }
  });
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
      if(/^(\/en)?\/(curriculum-ramon-de-moya|cv-delivery-manager)$/.test(path)){send('cv_click',{link_zone:zone(a)});return;}
      if(/^(\/en)?\/(contacto-consultor-digital|contact-digital-consultant)$/.test(path)){send('contact_click',{link_zone:zone(a)});return;}
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
