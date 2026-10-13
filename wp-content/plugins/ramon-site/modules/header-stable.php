<?php
/** Modulo de Ramon Site. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_filter( 'render_block', function ( $content, $block ) {
	if ( is_admin() || empty( $block['blockName'] ) || 'core/group' !== $block['blockName'] ) { return $content; }
	if ( false === strpos( $content, 'site-header' ) || ! class_exists( 'WP_HTML_Tag_Processor' ) ) { return $content; }
	$p = new WP_HTML_Tag_Processor( $content );
	if ( $p->next_tag( 'HEADER' ) && $p->has_class( 'site-header' ) ) {
		$p->add_class( 'is-scrolled' );
		return $p->get_updated_html();
	}
	return $content;
}, 10, 2 );


/* Escritorio: cabecera mas fina (logo mas pequeno). No afecta al movil (<782px). */
add_action( 'wp_head', function () {
	echo '<style id="rsite-header-slim">@media (min-width:782px){body .site-header .header-row.header-row{padding-top:8px!important;padding-bottom:8px!important}body .site-header .site-mark.site-mark,body .site-header .site-mark.site-mark img{width:148px!important}body .site-header .site-mark.site-mark{padding-top:0!important}}</style>' . "\n";
}, 120 );

