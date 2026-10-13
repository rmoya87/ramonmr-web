<?php
/** Modulo de Ramon Site. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function ramon_el_is_target( $href, $home_host ) {
	$href = trim( (string) $href );
	if ( '' === $href || '#' === $href[0] ) { return false; }
	if ( preg_match( '~^(mailto:|tel:|sms:|javascript:|data:|whatsapp:)~i', $href ) ) { return false; }
	$parts = wp_parse_url( $href );
	if ( false === $parts ) { return false; }
	$path = isset( $parts['path'] ) ? $parts['path'] : '';
	$is_file = (bool) preg_match( '~\.(pdf|zip|rar|7z|docx?|xlsx?|pptx?|csv)$~i', $path );
	$host = isset( $parts['host'] ) ? strtolower( $parts['host'] ) : '';
	if ( '' === $host ) { return $is_file; }
	$host = preg_replace( '~^www\.~', '', $host );
	$internal = ( $host === $home_host || substr( $host, -strlen( '.' . $home_host ) ) === '.' . $home_host );
	return $internal ? $is_file : true;
}

function ramon_el_filter_html( $html ) {
	if ( '' === $html || false === stripos( $html, '<a ' ) ) { return $html; }
	if ( false === stripos( $html, '<html' ) && false === stripos( $html, '<body' ) ) { return $html; }
	$home_host = preg_replace( '~^www\.~', '', strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) ) );
	$p = new WP_HTML_Tag_Processor( $html );
	while ( $p->next_tag( 'A' ) ) {
		$href = $p->get_attribute( 'href' );
		if ( ! is_string( $href ) || ! ramon_el_is_target( $href, $home_host ) ) { continue; }
		if ( $p->get_attribute( 'data-ramon-keep-target' ) ) { continue; }
		$p->set_attribute( 'target', '_blank' );
		$rel = strtolower( (string) $p->get_attribute( 'rel' ) );
		$tokens = array_filter( preg_split( '/\s+/', $rel ) );
		foreach ( array( 'noopener', 'noreferrer' ) as $t ) {
			if ( ! in_array( $t, $tokens, true ) ) { $tokens[] = $t; }
		}
		$p->set_attribute( 'rel', implode( ' ', $tokens ) );
		$al = $p->get_attribute( 'aria-label' );
		if ( is_string( $al ) && '' !== $al && false === stripos( $al, 'pesta' ) && false === stripos( $al, 'new tab' ) ) {
			$en = function_exists( 'pll_current_language' ) && 'en' === pll_current_language();
			$p->set_attribute( 'aria-label', $al . ( $en ? ' (opens in a new tab)' : ' (se abre en una pestaña nueva)' ) );
		}
		if ( preg_match( '~\.pdf($|[?#])~i', $href ) ) { $p->remove_attribute( 'download' ); }
	}
	return $p->get_updated_html();
}

add_action( 'template_redirect', function () {
	if ( is_admin() || is_feed() || is_robots() || is_trackback() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) { return; }
	if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) { return; }
	ob_start( 'ramon_el_filter_html' );
}, 0 );

// Contenido inyectado por JS (banner, widgets): mismo criterio en el navegador.
add_action( 'wp_footer', function () {
	?>
<script id="ramon-external-links-js">
(function(){
  var home=location.hostname.replace(/^www\./,'');
  function fix(a){
    var h=a.getAttribute('href'); if(!h||/^(#|mailto:|tel:|sms:|javascript:|data:|whatsapp:)/i.test(h)||a.hasAttribute('data-ramon-keep-target')) return;
    var u; try{u=new URL(h,location.href);}catch(e){return;}
    var host=u.hostname.replace(/^www\./,'');
    var file=/\.(pdf|zip|rar|7z|docx?|xlsx?|pptx?|csv)$/i.test(u.pathname);
    var internal=(host===home||host.slice(-(home.length+1))==='.'+home);
    if(internal&&!file) return;
    a.setAttribute('target','_blank');
    var r=(a.getAttribute('rel')||'').toLowerCase().split(/\s+/).filter(Boolean);
    ['noopener','noreferrer'].forEach(function(t){if(r.indexOf(t)<0) r.push(t);});
    a.setAttribute('rel',r.join(' '));
    if(/\.pdf$/i.test(u.pathname)) a.removeAttribute('download');
  }
  function run(root){(root.querySelectorAll?root:document).querySelectorAll('a[href]').forEach(fix);}
  run(document);
  if(window.MutationObserver){new MutationObserver(function(m){m.forEach(function(x){x.addedNodes.forEach(function(n){if(n.nodeType===1){if(n.tagName==='A')fix(n);else run(n);}});});}).observe(document.body,{childList:true,subtree:true});}
})();
</script>
	<?php
}, 99 );


