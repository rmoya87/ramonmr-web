<?php
/** Modulo de Ramon Site: ficha de proyecto. Titulo sobre la imagen principal, datos en una fila justo despues, primera imagen de Cafesito completa. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Devuelve [inicio, fin) del bloque HTML que empieza en $start (una etiqueta div), o null. */
function rsite_proj_block( $c, $start ) {
	$sub = substr( $c, $start );
	if ( ! preg_match_all( '#<(/?)div\b#', $sub, $m, PREG_OFFSET_CAPTURE ) ) { return null; }
	$depth = 0;
	foreach ( $m[1] as $i => $slash ) {
		$depth += ( '/' === $slash[0] ) ? -1 : 1;
		if ( 0 === $depth ) {
			$gt = strpos( $sub, '>', $m[0][ $i ][1] );
			return array( $start, $start + $gt + 1 );
		}
	}
	return null;
}

add_filter( 'the_content', function ( $c ) {
	if ( is_admin() || is_feed() || ! is_singular() || ! in_the_loop() || ! is_main_query() ) { return $c; }
	if ( false !== strpos( $c, 'rs-project-hero' ) ) { return $c; }
	$cs = strpos( $c, '<div class="wp-block-columns project-detail-columns' );
	$fs = strpos( $c, '<figure class="wp-block-image size-full project-hero-image' );
	if ( false === $cs || false === $fs || $fs > $cs ) { return $c; }
	$fe = strpos( $c, '</figure>', $fs );
	if ( false === $fe ) { return $c; }
	$fe  += 9;
	$cb   = rsite_proj_block( $c, $cs );
	if ( ! $cb ) { return $c; }
	$cols = substr( $c, $cb[0], $cb[1] - $cb[0] );
	if ( ! preg_match( '#<h1 class="wp-block-heading project-headline">.*?</h1>#s', $cols, $h ) ) { return $c; }
	$ms = strpos( $cols, '<div class="wp-block-group project-meta-grid' );
	if ( false === $ms ) { return $c; }
	$mb = rsite_proj_block( $cols, $ms );
	if ( ! $mb ) { return $c; }
	$meta = substr( $cols, $mb[0], $mb[1] - $mb[0] );
	$fig  = substr( $c, $fs, $fe - $fs );
	$full = ( false !== strpos( $fig, 'cafesito' ) ) ? ' rs-hero-full' : '';
	$new  = '<div class="rs-project-hero' . $full . '">' . $fig . '<div class="rs-project-title content-width">' . $h[0] . '</div></div>' . "\n"
		. '<div class="wp-block-group project-main rs-project-meta content-width is-layout-flow wp-block-group-is-layout-flow">' . $meta . '</div>' . "\n";
	$out = substr( $c, 0, $fs ) . $new . substr( $c, $fe, $cb[0] - $fe ) . substr( $c, $cb[1] );
	return $out;
}, 99 );

/** Primera imagen de Cafesito: captura completa de cafesitoapp.com (composicion de tramos reales). No toca el contenido guardado. */
add_filter( 'the_content', function ( $c ) {
	if ( is_admin() || is_feed() || ! is_singular() || false === strpos( $c, 'project-gallery-index-0' ) || false === strpos( $c, 'cafesito-web-home' ) ) { return $c; }
	$new = 'https://ramonmr.com/wp-content/uploads/2026/10/78-24-cafesito-home-completa.jpg';
	return preg_replace_callback( '#<(figure|div)([^>]*project-gallery-index-0[^>]*)>(.*?)</\\1>#s', function ( $m ) use ( $new ) {
		if ( false === strpos( $m[3], 'cafesito-web-home' ) ) { return $m[0]; }
		$in = $m[3];
		$in = preg_replace( '#(href|src)="[^"]*cafesito-web-home[^"]*"#', '$1="' . $new . '"', $in );
		$in = preg_replace( '#\s(srcset|sizes)="[^"]*"#', '', $in );
		$in = preg_replace( '#\swidth="\d+"#', ' width="1425"', $in );
		$in = preg_replace( '#\sheight="\d+"#', ' height="10403"', $in );
		$in = preg_replace( '#\swp-image-\d+#', '', $in );
		$in = str_replace( 'Home de la web de Cafesito', 'Captura completa de la home de cafesitoapp.com', $in );
		return '<' . $m[1] . $m[2] . ' data-rs-full="1">' . $in . '</' . $m[1] . '>';
	}, $c, 1 );
}, 100 );

/** Galerias de proyecto: quita del srcset los recortes cuadrados 150x150 y 300x300 para ver cada imagen con su proporcion real. */
add_filter( 'the_content', function ( $c ) {
	if ( is_admin() || is_feed() || ! is_singular() || false === strpos( $c, 'project-native-gallery' ) ) { return $c; }
	return preg_replace_callback( '#<img\b[^>]*>#', function ( $m ) {
		$t = $m[0];
		if ( false === strpos( $t, 'srcset="' ) ) { return $t; }
		$t = preg_replace( '#\ssizes="[^"]*"#', ' sizes="(min-width:782px) 30vw, 80vw"', $t );
		return preg_replace_callback( '#\ssrcset="([^"]*)"#', function ( $x ) {
			$parts = array_filter( array_map( 'trim', explode( ',', $x[1] ) ), function ( $p ) { return ! preg_match( '#-(150x150|300x300)\.\w+\s#', $p . ' ' ); } );
			return $parts ? ' srcset="' . implode( ', ', $parts ) . '"' : '';
		}, $t );
	}, $c );
}, 101 );

/** Cierre del detalle de proyecto: usa el mismo modulo "HABLEMOS DE TU PROYECTO" (.native-cta) de la home. Conserva el enlace del bloque original. */
add_filter( 'render_block', function ( $html, $block ) {
	if ( is_admin() || ! is_singular() || empty( $block['blockName'] ) || 'core/group' !== $block['blockName'] ) { return $html; }
	if ( false === strpos( $html, 'project-cta' ) || false === strpos( $html, 'wp-block-button__link' ) ) { return $html; }
	if ( ! preg_match( '#<a[^>]*wp-block-button__link[^>]*href="([^"]+)"#', $html, $m ) ) { return $html; }
	$href = esc_url( $m[1] );
	$en   = ( false !== strpos( $href, '/en/' ) );
	if ( $en ) {
		return '<section class="native-cta"><div class="native-width"><h2>LET&#8217;S TALK ABOUT<br>YOUR PROJECT</h2><p>Tell me what you need and where you are.</p><a class="native-button" href="' . $href . '">Contact me</a></div></section>';
	}
	return '<section class="native-cta"><div class="native-width"><h2>HABLEMOS DE<br>TU PROYECTO</h2><p>Cu&eacute;ntame qu&eacute; necesitas y en qu&eacute; punto est&aacute;s.</p><a class="native-button" href="' . $href . '">Contactar</a></div></section>';
}, 10, 2 );

add_action( 'wp_head', function () {
	if ( ! is_singular() ) { return; }
	echo '<style id="rsite-projects-css">' . <<<'CSS'
html body .rs-project-hero{position:relative;overflow:hidden}
html body .rs-project-hero .project-hero-image{margin:0!important}
html body .rs-project-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.45) 100%);pointer-events:none}
html body .rs-project-hero .rs-project-title{position:absolute;z-index:2;left:0;right:0;bottom:44px;margin:0 auto!important;pointer-events:none}
html body .rs-project-hero .rs-project-title .project-headline{max-width:min(42%,640px)!important;margin:0!important;color:#fff!important;text-shadow:0 2px 18px rgba(0,0,0,.45);text-wrap:balance}
html body .rs-project-hero .rs-project-title .project-headline::before{display:none!important}
html body .rs-project-hero.rs-hero-full .project-hero-image.project-hero-image{height:auto!important}
html body .rs-project-hero.rs-hero-full .project-hero-image.project-hero-image img{height:auto!important;max-height:none!important;object-fit:contain!important;display:block;width:100%}
html body .rs-project-meta.rs-project-meta{display:block!important;padding:36px 0 0!important}
html body .rs-project-meta .project-meta-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:20px 28px!important;width:100%!important;margin:0!important}
html body .project-main.content-width>.project-native-gallery{grid-row:1/span 20!important}
html body .native-project-single .project-native-gallery figure a{align-items:flex-start!important}
html body .native-project-single .project-native-gallery figure:not(.rn-contain) img{width:100%!important;height:auto!important;max-height:none!important;flex:none!important;object-fit:initial!important;padding:0!important}
html body .project-main.content-width>.eyebrow:first-child{margin-top:-5px!important}
@media (max-width:781px){
html body .rs-project-hero .rs-project-title{bottom:20px}
html body .rs-project-hero .rs-project-title .project-headline{max-width:100%!important;font-size:clamp(1.7rem,7vw,2.2rem)!important;line-height:1.1!important}
html body .rs-project-hero.rs-hero-full{background:linear-gradient(135deg,#6a4f3d,#1e1510);padding-top:0}
html body .rs-project-hero.rs-hero-full .project-hero-image.project-hero-image{height:min(78vw,340px)!important;overflow:hidden}
html body .rs-project-hero.rs-hero-full .project-hero-image.project-hero-image img{height:100%!important;width:100%!important;object-fit:cover!important;object-position:72% 20%!important}
html body .rs-project-hero.rs-hero-full .rs-project-title{position:absolute;left:0;right:0;bottom:0;padding:70px 0 18px!important;z-index:2}
html body .rs-project-hero.rs-hero-full::after{display:block!important;background:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.65) 100%)}
html body .rs-project-meta .project-meta-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media (min-width:782px) and (max-width:1180px){
html body:has(.native-project-single) .native-cta .native-width{margin-right:84px!important;margin-left:16px!important}
}
CSS
	. '</style>' . "\n";
}, 999 );


