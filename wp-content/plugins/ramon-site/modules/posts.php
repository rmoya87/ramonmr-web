<?php
/** Modulo de Ramon Site: entradas del blog (lectura, relacionadas, comentarios ocultos). */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* Comentarios ocultos en entradas (reversible: desactiva el modulo). */
add_filter( 'comments_open', '__return_false', 99 );
add_filter( 'pings_open', '__return_false', 99 );
add_filter( 'comments_array', '__return_empty_array', 99 );
add_filter( 'get_comments_number', '__return_zero', 99 );

add_action( 'wp_head', function () {
	if ( ! is_singular( 'post' ) ) { return; }
	$css = '
body.single-post .wp-block-comments,body.single-post #comments,body.single-post .comments-area,body.single-post .comment-respond,body.single-post .wp-block-post-comments-form{display:none!important}
body.single-post .entry-content{padding-top:48px!important;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif}
body.single-post .entry-content>:is(p,h2,h3,h4,h5,ul,ol,blockquote,pre,hr,.wp-block-heading,.rank-math-block){max-width:720px;margin-left:auto!important;margin-right:auto!important}
body.single-post .entry-content .rank-math-list-item{margin:0 0 1.5em}
body.single-post .entry-content .rank-math-list-item .rank-math-question{font-weight:600;margin:0 0 .35em}
body.single-post .entry-content>p:not([class*="native-"]){font-size:19px!important;line-height:1.75!important;color:#1d1d1f;margin-top:0!important;margin-bottom:1.35em!important;letter-spacing:-.003em}
body.single-post .entry-content>:is(ul,ol){font-size:19px;line-height:1.7;padding-left:1.4em;margin-bottom:1.35em!important}
body.single-post .entry-content>:is(ul,ol) li{margin-bottom:.45em}
body.single-post .entry-content>h2{font-size:clamp(1.65rem,2.8vw,2.1rem)!important;line-height:1.2!important;letter-spacing:-.02em;font-weight:700;margin-top:2.2em!important;margin-bottom:.6em!important;color:#111}
body.single-post .entry-content>h3{font-size:clamp(1.35rem,2.2vw,1.6rem)!important;line-height:1.25!important;letter-spacing:-.015em;font-weight:700;margin-top:1.9em!important;margin-bottom:.5em!important;color:#111}
body.single-post .entry-content>:is(h4,h5){font-size:1.15rem!important;line-height:1.3!important;font-weight:700;margin-top:1.6em!important;margin-bottom:.4em!important}
body.single-post .entry-content>p a,body.single-post .entry-content>:is(ul,ol) a{color:var(--wp--preset--color--blue,#004eff);text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
body.single-post .entry-content>blockquote{border-left:3px solid var(--wp--preset--color--blue,#004eff);padding:4px 0 4px 20px;font-size:1.15rem;line-height:1.6;color:#333}
body.single-post .entry-content>:is(figure,.wp-block-image,.wp-block-table,.wp-block-embed){max-width:960px;margin:2.2em auto!important}
body.single-post .entry-content figure img{border-radius:20px;height:auto;max-width:100%}
@media (max-width:781px){
body.single-post .entry-content{padding-top:32px!important}
body.single-post .entry-content>p:not([class*="native-"]),body.single-post .entry-content>:is(ul,ol){font-size:17px!important;line-height:1.7!important}
body.single-post .entry-content>h2{margin-top:1.9em!important}
}
/* Hero: titulo, luego fecha y lectura en una linea, luego autor */
body.single-post .article-headline{display:flex!important;flex-direction:column}
body.single-post .article-headline>.wp-block-post-title{order:1}
body.single-post .article-headline>.article-meta-top{order:2;justify-content:flex-start!important;gap:10px 14px!important;flex-wrap:wrap;margin:14px 0 0!important}
body.single-post .article-headline>.wp-block-post-author{order:3;margin-top:18px!important}
body.single-post .article-headline>:not(.wp-block-post-title):not(.article-meta-top):not(.wp-block-post-author){order:4}
body.single-post .article-headline>.article-meta-top :is(p,time,.article-reading-time){color:#eef2ff!important;opacity:1!important}
body.single-post .article-headline :is(.article-meta-top,.wp-block-post-author) :is(p,time,span){text-shadow:0 1px 3px rgba(0,0,0,.6)}
body.single-post .article-hero>.wp-block-post-featured-image::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,10,20,.28),rgba(8,10,20,.62));pointer-events:none}
/* Hero: avatar y bloque Autor + nombre con la misma altura */
body.single-post .wp-block-post-author{align-items:center!important;gap:12px!important}
body.single-post .wp-block-post-author__avatar,body.single-post .wp-block-post-author__avatar img{width:40px!important;height:40px!important;display:block;margin:0!important}
body.single-post .wp-block-post-author__avatar img{border-radius:50%;object-fit:cover}
body.single-post .wp-block-post-author__content{display:flex;flex-direction:column;justify-content:center;height:40px;width:auto!important}
body.single-post .wp-block-post-author__byline{color:#eef2ff!important;font-size:14px!important;line-height:18px!important;margin:0 0 2px!important}
body.single-post .wp-block-post-author__name{font-size:16px!important;line-height:20px!important;margin:0!important}
/* Para seguir tirando del hilo */
body.single-post .native-related-posts{max-width:1112px;margin:72px auto 24px!important;padding:0 16px!important}
body.single-post .entry-content{padding-bottom:40px!important}
body.single-post .native-related-posts{margin-top:32px!important}
body.single-post .native-related-posts>h4{font-size:clamp(1.5rem,3vw,2rem)!important;letter-spacing:-.02em;margin:0 0 24px!important}
body.single-post .native-related-posts .wp-block-post-template{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:20px!important;padding:0!important;margin:0!important;list-style:none}
body.single-post .native-related-posts .wp-block-post-template>li{position:relative;aspect-ratio:1/1;border-radius:24px;overflow:hidden;margin:0!important;background:#0b101e}
body.single-post .native-related-posts .wp-block-post-featured-image{position:absolute;inset:0;margin:0!important}
body.single-post .native-related-posts .wp-block-post-featured-image a,body.single-post .native-related-posts .wp-block-post-featured-image img{display:block;width:100%!important;height:100%!important;object-fit:cover;aspect-ratio:auto!important;border-radius:0!important}
body.single-post .native-related-posts .related-card-details{position:absolute!important;inset:0;display:flex!important;flex-direction:column;justify-content:flex-end;gap:8px;padding:20px!important;background:linear-gradient(180deg,rgba(11,16,30,.25),rgba(11,16,30,.55) 45%,rgba(11,16,30,.9))!important;color:#fff!important;border-radius:0!important}
body.single-post .native-related-posts .related-card-meta{order:0;display:flex;gap:8px;font-size:13px;color:#eef2ff!important}
body.single-post .native-related-posts .related-card-meta *{color:#eef2ff!important;margin:0!important;font-size:13px}
body.single-post .native-related-posts .wp-block-post-title{order:1;margin:0!important;font-size:19px!important;line-height:1.25!important;color:#fff!important;text-wrap:balance}
body.single-post .native-related-posts .wp-block-post-title a{color:#fff!important;text-decoration:none}
body.single-post .native-related-posts .taxonomy-category{order:2;align-self:flex-start;background:rgba(255,255,255,.18)!important;border-radius:999px;padding:3px 12px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
body.single-post .native-related-posts .taxonomy-category a{font-size:13px;color:#fff!important;text-decoration:none;background:transparent!important;padding:0!important}
body.single-post .native-related-posts .wp-block-post-title a::after{content:"";position:absolute;inset:0;z-index:1}
body.single-post .native-related-posts .wp-block-read-more{display:none}
@media (max-width:781px){
body.single-post .native-related-posts{margin-top:48px!important}
body.single-post .native-related-posts .wp-block-post-template{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
body.single-post .native-related-posts .wp-block-post-template>li:nth-child(n+3){display:none}
body.single-post .native-related-posts>h4{margin-left:-11px!important}
body.single-post .native-related-posts .related-card-details{padding:14px!important}
body.single-post .native-related-posts .wp-block-post-title{font-size:15px!important}
body.single-post .native-related-posts .related-card-meta{font-size:11px;flex-wrap:wrap;gap:2px 6px}
body.single-post .native-related-posts .related-card-meta *{font-size:11px}
body.single-post .native-related-posts .taxonomy-category{display:none}
}
';
	echo '<style id="rsite-posts-css">' . $css . '</style>' . "\n";
}, 112 );

add_action( 'template_redirect', function () {
	if ( ! is_singular( 'post' ) || is_feed() ) { return; }
	ob_start( function ( $html ) {
		$en = function_exists( 'pll_current_language' ) && 'en' === pll_current_language();
		$t  = $en ? 'Keep pulling the thread' : 'Para seguir tirando del hilo';
		$html = preg_replace( '/(<div class="[^"]*native-related-posts[^"]*"[^>]*>\s*<h4[^>]*>).*?(<\/h4>)/s', '$1' . $t . '$2', $html, 1 );
		/* Orden del DOM = orden visual del hero: titulo, fecha/lectura, autor. */
		$html = preg_replace( '/(<div class="[^"]*article-meta-top[^"]*"[^>]*>.*?article-reading-time[^>]*>[^<]*<\/p><\/div>)(<h1 class="wp-block-post-title"[^>]*>.*?<\/h1>)/s', '$2$1', $html, 1 );
		/* Imagen del hero decorativa: sin texto alternativo (el titulo ya esta al lado). */
		$html = preg_replace( '/(<div class="[^"]*article-hero[^"]*"[^>]*><figure class="wp-block-post-featured-image">\s*<img[^>]*?) alt="[^"]*"/s', '$1 alt=""', $html, 1 );
		/* Nombres accesibles de los botones de compartir. */
		$tab = $en ? ' (opens in a new tab)' : ' (se abre en una pestaña nueva)';
		$names = array(
			'linkedin.com/sharing' => ( $en ? 'Share on LinkedIn' : 'Compartir en LinkedIn' ) . $tab,
			'x.com/intent/tweet'   => ( $en ? 'Share on X' : 'Compartir en X' ) . $tab,
			'facebook.com/sharer'  => ( $en ? 'Share on Facebook' : 'Compartir en Facebook' ) . $tab,
		);
		foreach ( $names as $needle => $label ) {
			$html = preg_replace( '/<a ((?:(?!aria-label)[^>])*href="https:\/\/(?:www\.)?' . preg_quote( $needle, '/' ) . '[^"]*"[^>]*)>/', '<a aria-label="' . esc_attr( $label ) . '" $1>', $html );
		}
		return $html;
	} );
}, 1 );

/* Plantillas 404 y busqueda: textos en espanol en la version ES. */
add_filter( 'render_block', function ( $html, $block ) {
	if ( ! is_404() && ! is_search() ) { return $html; }
	if ( ! function_exists( 'pll_current_language' ) || 'es' !== pll_current_language() ) { return $html; }
	return strtr( $html, array(
		'404. Nothing here' => '404. Aquí no hay nada',
		'Sorry, but the page you are looking for does not exist.' => 'Lo siento, la página que buscas no existe.',
		'Maybe try a search?' => '¿Quizá quieras probar con una búsqueda?',
		'Results for:' => 'Resultados para:',
		'placeholder="Search..."' => 'placeholder="Buscar..."',
	) );
}, 20, 2 );

/* Relacionados automaticos: siempre automatico (ignora la lista manual native_related_ids del tema, que no se borra): muestra
   las 3 ultimas publicadas de la misma categoria e idioma, sin la actual; si faltan, completa con las ultimas del idioma. */
add_filter( 'query_loop_block_query_vars', function ( $query, $block ) {
	if ( 44 !== (int) ( $block->context['queryId'] ?? 0 ) || ! is_singular( 'post' ) ) { return $query; }
	$cur    = get_queried_object_id();
	$lang = function_exists( 'pll_get_post_language' ) ? pll_get_post_language( $cur ) : '';
	$base = array( 'post_type' => 'post', 'post_status' => 'publish', 'post__not_in' => array( $cur ), 'posts_per_page' => 3,
		'orderby' => 'date', 'order' => 'DESC', 'fields' => 'ids', 'no_found_rows' => true, 'ignore_sticky_posts' => true );
	if ( $lang ) { $base['lang'] = $lang; }
	$cats = wp_get_post_categories( $cur );
	$ids  = $cats ? get_posts( $base + array( 'category__in' => $cats ) ) : array();
	if ( count( $ids ) < 3 ) {
		$more = get_posts( array_merge( $base, array( 'post__not_in' => array_merge( array( $cur ), $ids ), 'posts_per_page' => 3 - count( $ids ) ) ) );
		$ids  = array_merge( $ids, $more );
	}
	$query['post__in'] = $ids ? $ids : array( 0 );
	$query['orderby']  = 'post__in';
	return $query;
}, 20, 2 );

