<?php
/** Modulo de Ramon Site. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function rm_bh_is_en() {
	$uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '';
	return ( strpos( $uri, '/en/' ) === 0 );
}

function rm_bh_t( $es, $en ) {
	return rm_bh_is_en() ? $en : $es;
}

/* ---------- Reading time (same rule as the theme: words / 130, rounded up) ---------- */
function rm_bh_calc_minutes( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return 1;
	}
	$text  = wp_strip_all_tags( strip_shortcodes( $post->post_content ) );
	$words = preg_split( '/\s+/u', trim( $text ), -1, PREG_SPLIT_NO_EMPTY );
	$count = is_array( $words ) ? count( $words ) : 0;
	return max( 1, (int) ceil( $count / 130 ) );
}

function rm_bh_save_minutes( $post_id ) {
	if ( wp_is_post_revision( $post_id ) || get_post_type( $post_id ) !== 'post' ) {
		return;
	}
	update_post_meta( $post_id, '_rm_read_min', rm_bh_calc_minutes( $post_id ) );
}
add_action( 'save_post', 'rm_bh_save_minutes' );

function rm_bh_backfill() {
	if ( get_option( 'rm_bh_backfill_v1' ) ) {
		return;
	}
	$ids = get_posts( array(
		'post_type'      => 'post',
		'post_status'    => array( 'publish', 'future', 'draft', 'pending', 'private' ),
		'posts_per_page' => 300,
		'fields'         => 'ids',
		'no_found_rows'  => true,
	) );
	foreach ( $ids as $id ) {
		update_post_meta( $id, '_rm_read_min', rm_bh_calc_minutes( $id ) );
	}
	update_option( 'rm_bh_backfill_v1', 1, false );
}
add_action( 'init', 'rm_bh_backfill', 20 );

/* ---------- Reading-time filter on the main category query ---------- */
function rm_bh_range( $n ) {
	if ( 1 === $n ) {
		return array( 1, 5 );
	}
	if ( 2 === $n ) {
		return array( 6, 10 );
	}
	if ( 3 === $n ) {
		return array( 11, 999 );
	}
	return null;
}

function rm_bh_current_filter() {
	$n = isset( $_GET['lectura'] ) ? (int) $_GET['lectura'] : 0;
	return ( $n >= 1 && $n <= 3 ) ? $n : 0;
}

function rm_bh_pre_get_posts( $q ) {
	if ( is_admin() || ! $q->is_main_query() || ! $q->is_category() ) {
		return;
	}
	$n = rm_bh_current_filter();
	if ( ! $n ) {
		return;
	}
	$r = rm_bh_range( $n );
	$q->set( 'meta_query', array(
		array(
			'key'     => '_rm_read_min',
			'value'   => $r,
			'type'    => 'NUMERIC',
			'compare' => 'BETWEEN',
		),
	) );
}
add_action( 'pre_get_posts', 'rm_bh_pre_get_posts' );

function rm_bh_send_headers() {
	if ( ! is_admin() && rm_bh_current_filter() ) {
		header( 'X-Robots-Tag: noindex, follow', true );
	}
}
add_action( 'send_headers', 'rm_bh_send_headers' );

/* ---------- Key ideas: verbatim sentences from published posts ---------- */
function rm_bh_quotes() {
	return array(
		// ES.
		3923  => 'No existe una segunda oportunidad para causar una primera buena impresión.',
		1303  => 'Utiliza estos patrones como punto de partida y a continuación añade la capa con tu propia creatividad.',
		1134  => 'Si el público no puede usar la aplicación, no se usará y habrá sido por tanto una inversión inútil.',
		1402  => 'Puede parecer una tontería, pero las listas funcionan.',
		3786  => 'Este documento no debe ser rígido y puede ir realizando modificaciones según la estrategia seleccionada para poder mejorar.',
		3908  => 'El CRO es un proceso cíclico en constante mejora.',
		3773  => 'La digitalización de una empresa, no tiene que ser traumático.',
		3851  => 'Pero si tenemos vendados los ojos difícilmente podamos llegar a buen puerto.',
		22754 => 'La optimización del motor de búsqueda (SEO) es esencial para que las personas encuentren el sitio y conozcan sus productos.',
		// EN.
		153736 => 'There is no second chance to make a good first impression.',
		153750 => 'If people can\'t use the app, it won\'t be used and it will have been a wasted investment.',
		153726 => 'Cards are popular because they help organize large amounts of content.',
		153746 => 'This document should not be rigid and can be modified according to the chosen strategy so it can improve.',
		153708 => 'Heatmaps are not a simple statistics counter: they tell you exactly where the user clicks when navigating the site.',
		153732 => 'The digitalization of a company does not have to be traumatic.',
		153734 => 'But if we are blindfolded, we will hardly reach a good port.',
		153704 => 'Search engine optimization (SEO) is essential for people to find the site and get to know your products.',
	);
}

function rm_bh_term_ids( $term ) {
	$ids = array( (int) $term->term_id );
	$kids = get_term_children( $term->term_id, 'category' );
	if ( is_array( $kids ) ) {
		foreach ( $kids as $k ) {
			$ids[] = (int) $k;
		}
	}
	return $ids;
}

function rm_bh_ico_cup() {
	return '<svg class="rm-bl-cup" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5ZM16 10h2a2.5 2.5 0 0 1 0 5h-2M8 3v3m4-3v3"/></svg>';
}

function rm_bh_styles() {
	static $done = false;
	if ( $done ) {
		return '';
	}
	$done = true;
	$css = '
body{overflow-x:clip}.rm-bh-band{position:relative;width:100vw;margin-left:calc(50% - 50vw);margin-top:0;background:#004eff;background-image:radial-gradient(900px 420px at 85% 10%,rgba(120,170,255,.38),transparent 70%),linear-gradient(135deg,#0a56ff,#003fd6);border-radius:0;overflow:hidden;color:#fff}
.rm-bh-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.9fr);gap:56px;align-items:center;padding:128px 0 60px!important;margin:0 auto}
.rm-bh-hero .rm-bl-crumbs{display:flex;gap:8px;align-items:center;font-size:14px;color:rgba(255,255,255,.92);margin:0 0 22px;padding:0}
.rm-bh-hero .rm-bl-crumbs a{color:#fff;text-decoration:none}
.rm-bh-hero .rm-bl-crumbs a:hover{text-decoration:underline}
.rm-bh-hero .rm-bl-eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.92);margin:0 0 14px}
.rm-bh-hero h1{font-size:clamp(44px,6.4vw,88px)!important;line-height:.98!important;letter-spacing:-3px!important;margin:0!important;color:#fff!important;font-weight:500;overflow-wrap:anywhere}
.rm-bh-hero h1 .rm-us{color:#b9d0ff}
.rm-bh-hero .rm-bh-sub{font-size:19px;line-height:1.55;color:rgba(255,255,255,.85);max-width:30em;margin:22px 0 0}
.rm-bh-feature{position:relative;padding:26px 30px;border-radius:28px;background:rgba(255,255,255,.13);border:0;box-shadow:0 24px 70px rgba(0,20,110,.28);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);min-width:0}
.rm-bh-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}
.rm-bh-k{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.92)}
.rm-bh-dots{display:flex;gap:7px;align-items:center}
.rm-bh-dots button{appearance:none;border:0;padding:0;width:8px;height:8px;border-radius:99px;background:rgba(255,255,255,.38);cursor:pointer;transition:width .25s,background .25s}
.rm-bh-dots button[aria-current="true"]{width:24px;background:#fff}
.rm-bh-slides{display:grid}
.rm-bh-slide{grid-area:1/1;display:block;color:inherit;text-decoration:none;opacity:0;visibility:hidden;transform:translateX(18px);transition:opacity .55s ease,transform .55s ease,visibility 0s .55s;min-width:0;-webkit-tap-highlight-color:transparent}
.rm-bh-slide.is-on{opacity:1;visibility:visible;transform:none;transition:opacity .55s ease,transform .55s ease,visibility 0s}
.rm-bh-slide,.rm-bh-slide:hover,.rm-bh-slide:focus,.rm-bh-slide *{text-decoration:none!important}
.rm-bh-link{display:inline-block;margin-top:0}
.rm-bh-quote{display:block;margin:0 0 20px;font-size:clamp(22px,2.3vw,31px);line-height:1.28;font-weight:500;letter-spacing:-.6px;color:#fff}
.rm-bh-quote span{background:none}
.rm-bh-from{display:block;font-size:15px;line-height:1.5;color:rgba(255,255,255,.94);margin:0 0 12px}
.rm-bh-link{font-weight:600;color:#fff;text-decoration:none}
.rm-bh-bar{padding:34px 0 30px}
.rm-bh-bar .rm-bh-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;margin:0 0 22px}
.rm-bh-bar .rm-bh-lab{flex:0 0 100%;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#586373;margin:0 0 2px}
.rm-bh-pill{display:inline-block;padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.85);border:1px solid rgba(0,78,255,.16);color:#111;text-decoration:none;font-size:15px;line-height:1.3;transition:background .2s,color .2s,border-color .2s}
.rm-bh-pill:hover{border-color:#004eff}
.rm-bh-pill[aria-current="true"]{background:#004eff;border-color:#004eff;color:#fff}
.rm-bh-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;width:100%}
.rm-bh-card{display:flex;flex-direction:column;justify-content:space-between;gap:16px;min-height:104px;padding:16px;border-radius:20px;background:rgba(255,255,255,.7);border:1px solid rgba(0,78,255,.14);box-shadow:0 8px 24px rgba(16,40,90,.06);color:#111;text-decoration:none;transition:transform .15s,border-color .2s}
.rm-bh-card:hover{transform:translateY(-2px);border-color:#004eff}
.rm-bh-card[aria-current="true"]{background:#004eff;border-color:#004eff;color:#fff;box-shadow:0 14px 34px rgba(0,78,255,.28)}
.rm-bh-cups{display:flex;gap:4px;color:#004eff;min-height:28px}
.rm-bh-card[aria-current="true"] .rm-bh-cups{color:#fff}
.rm-bl-cup{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:.9;stroke-linecap:round;stroke-linejoin:round}
.rm-bh-card b{display:block;font-weight:500;font-size:16px;line-height:1.25}
.rm-bh-card small{display:block;font-size:13px;opacity:.75;margin-top:2px}
.rm-bh-unit{display:inline-flex;align-items:center;gap:12px;padding:5px 6px 5px 16px;border-radius:999px;background:rgba(255,255,255,.85);border:1px solid rgba(0,78,255,.16);box-shadow:0 6px 20px rgba(16,40,90,.06)}
.rm-bh-unit>span{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#586373}
.rm-bh-unit button{appearance:none;border:0;cursor:pointer;font:inherit;font-size:15px;line-height:1;padding:10px 16px;border-radius:999px;background:transparent;color:#111;transition:background .2s,color .2s;-webkit-tap-highlight-color:transparent}
.rm-bh-unit button:hover{background:rgba(0,78,255,.1);color:#004eff}
.rm-bh-unit button[aria-pressed="true"]:hover{background:#004eff;color:#fff}
.rm-bh-unit button[aria-pressed="true"]{background:#004eff;color:#fff}
.rm-rt-cups{display:inline-flex;gap:2px;vertical-align:-4px}
.rm-rt-cups svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
.rm-bh-result{font-size:15px;color:#4a5568;margin:16px 0 0}
@media(max-width:900px){.rm-bh-hero{grid-template-columns:minmax(0,1fr);gap:26px;padding:104px 0 40px!important}.rm-bh-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:781px){.rm-bh-hero h1{letter-spacing:-2px!important}.rm-bh-feature{padding:22px;border-radius:24px}}
@media(prefers-reduced-motion:reduce){.rm-bh-slide,.rm-bh-card{transition:none;transform:none}}
@media(max-width:781px){
.listing-grid.native-news-grid .wp-block-post-template{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
.listing-grid.native-news-grid .wp-block-post{aspect-ratio:1/1!important;min-width:0}
.listing-grid.native-news-grid .news-overlay{padding:13px 12px!important;display:flex!important;flex-direction:row!important;flex-wrap:wrap!important;align-items:center!important;align-content:flex-start!important;column-gap:8px;box-sizing:border-box}
.listing-grid.native-news-grid .news-overlay>.wp-block-post-title,.listing-grid.native-news-grid .news-overlay>.wp-block-post-terms{flex:0 0 100%;width:100%}
.listing-grid.native-news-grid .wp-block-post-title,.listing-grid.native-news-grid .news-overlay .wp-block-post-title{font-size:clamp(14px,4.1vw,16px)!important;line-height:1.16!important;letter-spacing:-.3px!important;margin:2px 0 5px!important;display:-webkit-box!important;-webkit-line-clamp:3!important;-webkit-box-orient:vertical!important;overflow:hidden!important;max-height:3.5em}
.listing-grid.native-news-grid .news-overlay>.wp-block-post-terms{margin:0 0 30px!important;font-size:11px!important}
.listing-grid.native-news-grid .news-overlay{padding-bottom:12px!important}
.listing-grid.native-news-grid .news-overlay>.wp-block-post-date,.listing-grid.native-news-grid .news-overlay>.article-reading-time{margin-left:0!important}
.listing-grid.native-news-grid .wp-block-post-terms{margin-top:4px!important}
.listing-grid.native-news-grid .wp-block-post-terms a{font-size:12px!important;padding:3px 9px!important}
.listing-grid.native-news-grid .wp-block-read-more{font-size:14px!important;margin:0!important;position:absolute!important;left:12px;bottom:10px;width:auto!important;flex:none!important;display:block}
.rm-bh-unit{max-width:100%;padding:4px 5px 4px 12px;gap:6px}
.rm-bh-unit>span{font-size:10px;letter-spacing:.1em}
.rm-bh-unit button{font-size:14px;padding:9px 12px}
}
@media(min-width:782px){
.listing-grid.native-news-grid .wp-block-post-title,.listing-grid.native-news-grid .news-overlay .wp-block-post-title{font-size:24px!important;line-height:1.16!important}
.listing-grid.native-news-grid .wp-block-post-date,.listing-grid.native-news-grid .article-reading-time{font-size:16px!important}
.listing-grid.native-news-grid .wp-block-post-terms a{font-size:15px!important}
.listing-grid.native-news-grid .wp-block-read-more{font-size:17px!important;position:absolute!important;left:0;bottom:14px;margin:0!important}
}
.listing-grid.native-news-grid .wp-block-post-date,.listing-grid.native-news-grid .article-reading-time{display:inline!important;vertical-align:baseline;line-height:1.4!important;white-space:nowrap!important}
.listing-grid.native-news-grid .news-overlay>.wp-block-post-terms{max-width:100%;overflow:hidden}
.listing-grid.native-news-grid .news-overlay>.wp-block-post-terms a{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;display:inline-block;vertical-align:top}
.listing-grid.native-news-grid .wp-block-post-date{font-size:14px}
.listing-grid.native-news-grid .article-reading-time{font-size:14px;margin:0 0 0 8px!important}
.listing-grid.native-news-grid .article-reading-time::before{content:none!important;display:none!important}
.rm-rt-cups{display:inline-flex;align-items:flex-end;vertical-align:baseline;gap:1px;line-height:1}
.rm-rt-cups svg{display:block;width:18px;height:18px}
}
';
	return '<style id="rm-bh-css">' . $css . '</style>';
}

/* ---------- [rm_blog_hero] ---------- */
function rm_bh_auto_quote( $pid ) {
	$m = trim( (string) get_post_meta( $pid, '_rm_hero_quote', true ) );
	if ( '' !== $m ) {
		return $m;
	}
	$p   = get_post( $pid );
	$txt = '' !== trim( (string) $p->post_excerpt ) ? $p->post_excerpt : $p->post_content;
	$txt = trim( preg_replace( '/\s+/u', ' ', wp_strip_all_tags( strip_shortcodes( $txt ) ) ) );
	$parts = preg_split( '/(?<=[.!?])\s+/u', $txt );
	foreach ( (array) $parts as $cand ) {
		$cand = trim( $cand );
		$len  = mb_strlen( $cand );
		if ( $len >= 40 && $len <= 150 && ! preg_match( '/\d\s*\/\s*\d|Puntuaci|http/u', $cand ) && preg_match( '/^[A-ZÁÉÍÓÚÑ¿¡"«“]/u', $cand ) ) {
			return $cand;
		}
	}
	if ( mb_strlen( $txt ) > 125 ) {
		$txt = rtrim( mb_substr( $txt, 0, 125 ), " ,.;:" ) . '…';
	}
	return $txt;
}

function rm_bh_hero_sc() {
	if ( ! is_category() ) {
		return '';
	}
	$term = get_queried_object();
	if ( ! $term || empty( $term->term_id ) ) {
		return '';
	}
	$is_root = ( 0 === (int) $term->parent );
	$ids     = rm_bh_term_ids( $term );

	$cq    = new WP_Query( array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'cat'            => implode( ',', $ids ),
		'posts_per_page' => 1,
		'fields'         => 'ids',
	) );
	$total = (int) $cq->found_posts;
	wp_reset_postdata();

	$home = rm_bh_t( 'Inicio', 'Home' );
	$home_url = rm_bh_is_en() ? home_url( '/en/' ) : home_url( '/' );
	$root = $term;
	if ( ! $is_root ) {
		$anc = get_ancestors( $term->term_id, 'category' );
		if ( ! empty( $anc ) ) {
			$r = get_term( (int) end( $anc ), 'category' );
			if ( $r && ! is_wp_error( $r ) ) {
				$root = $r;
			}
		}
	}
	$root_url = get_term_link( $root );
	if ( is_wp_error( $root_url ) ) {
		$root_url = home_url( '/' );
	}

	$crumbs = '<a href="' . esc_url( $home_url ) . '">' . esc_html( $home ) . '</a><span>/</span>';
	if ( $is_root ) {
		$crumbs .= '<span aria-current="page">Blog</span>';
	} else {
		$crumbs .= '<a href="' . esc_url( $root_url ) . '">Blog</a><span>/</span><span aria-current="page">' . esc_html( $term->name ) . '</span>';
	}

	$n_txt = $total . ' ' . ( 1 === $total ? rm_bh_t( 'artículo', 'article' ) : rm_bh_t( 'artículos', 'articles' ) );
	$eyebrow = ( $is_root ? rm_bh_t( 'El blog', 'The blog' ) : rm_bh_t( 'Categoría', 'Category' ) ) . ' · ' . $n_txt;

	$title = $is_root ? 'Blog' : $term->name;

	if ( $is_root ) {
		$sub = rm_bh_t(
			'Marketing online, diseño de producto y negocio online. Artículos para aplicar, sin humo.',
			'Online marketing, product design and online business. Articles you can apply, no fluff.'
		);
	} else {
		$sub = trim( wp_strip_all_tags( term_description( $term->term_id, 'category' ) ) );
		if ( '' === $sub ) {
			$sub = rm_bh_t( 'Todos los artículos sobre ', 'All articles about ' ) . $term->name . '.';
		}
	}

	// Slides.
	$quotes = rm_bh_quotes();
	$slides = array();
	$latest5 = get_posts( array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'category'       => implode( ',', $ids ),
		'posts_per_page' => (int) rsite_hero( 'slides' ),
		'orderby'        => 'date',
		'order'          => 'DESC',
		'post__not_in'   => array( 20, 21, 72 ),
		'fields'         => 'ids',
	) );
	foreach ( $latest5 as $pid ) {
		$q = isset( $quotes[ $pid ] ) ? $quotes[ $pid ] : rm_bh_auto_quote( $pid );
		if ( '' === trim( (string) $q ) ) {
			$q = get_the_title( $pid );
		}
		$slides[] = array( 'q' => $q, 'title' => get_the_title( $pid ), 'url' => get_permalink( $pid ) );
	}
	$label = rm_bh_t( 'Idea clave', 'Key idea' );
	if ( empty( $slides ) ) {
		$latest = get_posts( array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'category'       => (int) $term->term_id,
			'posts_per_page' => 1,
		) );
		if ( ! empty( $latest ) ) {
			$label    = rm_bh_t( 'Último artículo', 'Latest article' );
			$slides[] = array( 'q' => get_the_title( $latest[0]->ID ), 'title' => '', 'url' => get_permalink( $latest[0]->ID ) );
		}
	}

	$read = rm_bh_t( 'Leer el artículo', 'Read the article' );
	$feature = '';
	if ( ! empty( $slides ) ) {
		$dots = '';
		$html = '';
		foreach ( $slides as $i => $s ) {
			$on    = ( 0 === $i );
			$dots .= '<button type="button" aria-label="' . esc_attr( ( $i + 1 ) ) . '" aria-current="' . ( $on ? 'true' : 'false' ) . '"></button>';
			$html .= '<a class="rm-bh-slide' . ( $on ? ' is-on' : '' ) . '" href="' . esc_url( $s['url'] ) . '"' . ( $on ? '' : ' tabindex="-1"' ) . '><span class="rm-bh-quote"><span>' . esc_html( $s['q'] ) . '</span></span>';
			if ( '' !== $s['title'] ) {
				$html .= '<span class="rm-bh-from">' . esc_html( rm_bh_t( 'De', 'From' ) ) . ' «' . esc_html( $s['title'] ) . '»</span>';
			}
			$html .= '<span class="rm-bh-link">' . esc_html( $read ) . ' →</span></a>';
		}
		$feature = '<aside class="rm-bh-feature" data-rm-bh><div class="rm-bh-top"><span class="rm-bh-k">' . esc_html( $label ) . '</span>' .
			( count( $slides ) > 1 ? '<div class="rm-bh-dots">' . $dots . '</div>' : '' ) . '</div><div class="rm-bh-slides">' . $html . '</div></aside>';
	}

	$js = '<script>(function(){var c=document.querySelector("[data-rm-bh]");if(!c)return;var s=c.querySelectorAll(".rm-bh-slide"),d=c.querySelectorAll(".rm-bh-dots button");if(s.length<2)return;var i=0,t=null,h=false;function go(n){i=(n+s.length)%s.length;for(var k=0;k<s.length;k++){s[k].classList.toggle("is-on",k===i);s[k].setAttribute("tabindex",k===i?"0":"-1");if(d[k])d[k].setAttribute("aria-current",k===i?"true":"false")}}function stop(){if(t){clearInterval(t);t=null}}function start(){stop();if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;t=setInterval(function(){if(!h)go(i+1)},' . (int) rsite_hero( 'ms' ) . ')}d.forEach(function(b,k){b.addEventListener("click",function(e){e.preventDefault();go(k);start()})});c.addEventListener("pointerenter",function(e){if(e.pointerType==="mouse")h=true});c.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse")h=false});start()})();</script>';

	$out  = rm_bh_styles();
	$out .= '<div class="rm-bh-band"><div class="wp-block-group content-width rm-bh-hero"><div class="rm-bl-main"><p class="rm-bl-crumbs">' . $crumbs . '</p>';
	$out .= '<p class="rm-bl-eyebrow">' . esc_html( $eyebrow ) . '</p>';
	$out .= '<h1>' . esc_html( $title ) . '<span class="rm-us">_</span></h1>';
	$out .= '<p class="rm-bh-sub">' . esc_html( $sub ) . '</p></div>' . $feature . '</div></div>';
	if ( $feature ) {
		$GLOBALS['rm_bh_hero_js'] = $js;
	}
	return $out;
}
add_shortcode( 'rm_blog_hero', 'rm_bh_hero_sc' );

/* ---------- [rm_blog_filter] ---------- */
function rm_bh_filter_sc() {
	if ( ! is_category() ) {
		return '';
	}
	global $wp_query;
	$term = get_queried_object();
	if ( ! $term || empty( $term->term_id ) ) {
		return '';
	}
	$root = $term;
	if ( 0 !== (int) $term->parent ) {
		$anc = get_ancestors( $term->term_id, 'category' );
		if ( ! empty( $anc ) ) {
			$r = get_term( (int) end( $anc ), 'category' );
			if ( $r && ! is_wp_error( $r ) ) {
				$root = $r;
			}
		}
	}
	$kids = get_terms( array(
		'taxonomy'   => 'category',
		'parent'     => (int) $root->term_id,
		'hide_empty' => true,
	) );
	$out  = rm_bh_styles();
	$out .= '<div class="content-width rm-bh-bar">';

	$root_url = get_term_link( $root );
	$out .= '<div class="rm-bh-row">';
	if ( ! is_wp_error( $kids ) && ! empty( $kids ) ) {
		$out .= '<div class="rm-bh-seg rm-bh-topics" role="group" aria-label="' . esc_attr( rm_bh_t( 'Temas', 'Topics' ) ) . '"><span class="rm-bh-ul">' . esc_html( rm_bh_t( 'Temas', 'Topics' ) ) . '</span>';
		$out .= '<a class="rm-bh-pill" href="' . esc_url( $root_url ) . '"' . ( (int) $term->term_id === (int) $root->term_id ? ' aria-current="true"' : '' ) . '>' . esc_html( rm_bh_t( 'Todos', 'All' ) ) . '</a>';
		foreach ( $kids as $k ) {
			$out .= '<a class="rm-bh-pill" href="' . esc_url( get_term_link( $k ) ) . '"' . ( (int) $term->term_id === (int) $k->term_id ? ' aria-current="true"' : '' ) . '>' . esc_html( $k->name ) . '</a>';
		}
		$out .= '</div>';
	}

	$base   = get_term_link( $term );
	$active = rm_bh_current_filter();
	$opts   = array(
		0 => array( 'cups' => 0, 'a' => rm_bh_t( 'Todas', 'All' ), 'b' => rm_bh_t( 'Cualquier duración', 'Any length' ) ),
		1 => array( 'cups' => 1, 'a' => rm_bh_t( 'Un café', 'One coffee' ), 'b' => rm_bh_t( 'hasta 5 min', 'up to 5 min' ) ),
		2 => array( 'cups' => 2, 'a' => rm_bh_t( 'Dos cafés', 'Two coffees' ), 'b' => rm_bh_t( '6 a 10 min', '6 to 10 min' ) ),
		3 => array( 'cups' => 3, 'a' => rm_bh_t( 'Tres cafés', 'Three coffees' ), 'b' => rm_bh_t( 'más de 10 min', 'over 10 min' ) ),
	);
	$cup = rm_bh_ico_cup();
	$out .= '<div class="rm-bh-seg rm-bh-readsw" role="group" aria-label="' . esc_attr( rm_bh_t( 'Lectura en', 'Reading in' ) ) . '"><span class="rm-bh-ul">' . esc_html( rm_bh_t( 'Lectura en', 'Reading in' ) ) . '</span><button type="button" data-rm-unit="min" aria-pressed="true">' . esc_html( rm_bh_t( 'Minutos', 'Minutes' ) ) . '</button><button type="button" data-rm-unit="cafe" aria-pressed="false">' . esc_html( rm_bh_t( 'Cafés', 'Coffees' ) ) . '</button></div></div>';
	$GLOBALS['rm_bh_unit_js'] = true;
	$out .= '</div>';
	return $out;
}
add_shortcode( 'rm_blog_filter', 'rm_bh_filter_sc' );


add_action( 'wp_footer', function () {
	if ( ! empty( $GLOBALS['rm_bh_hero_js'] ) ) {
		echo $GLOBALS['rm_bh_hero_js']; // phpcs:ignore
	}
	if ( ! empty( $GLOBALS['rm_bh_unit_js'] ) ) {
		$cup = rm_bh_ico_cup();
		$en  = rm_bh_is_en() ? 'true' : 'false';
		$js  = <<<'JS'
(function(){var pr=document.querySelectorAll('.rm-bl-prog');if(pr.length){if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{threshold:.4});pr.forEach(function(x){io.observe(x)})}else{pr.forEach(function(x){x.classList.add('on')})}}})();
(function(){var cup=__CUP__,en=__EN__,bs=document.querySelectorAll('[data-rm-unit]');
function cups(n){var h='';for(var i=0;i<n;i++)h+=cup;return h}
function apply(u){document.querySelectorAll('.article-reading-time').forEach(function(p){
if(!p.hasAttribute('data-o'))p.setAttribute('data-o',p.innerHTML);
var m=parseInt(p.getAttribute('data-o'),10);
if(u==='cafe'&&m){var n=m<=5?1:(m<=10?2:3);p.innerHTML='<span class="rm-rt-cups" role="img" aria-label="'+n+(en?' coffee':' caf\u00e9')+'">'+cups(n)+'</span>'}
else if(m&&window.matchMedia&&matchMedia('(max-width:781px)').matches){p.textContent=m+' min'}else{p.innerHTML=p.getAttribute('data-o')}});
bs.forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-rm-unit')===u?'true':'false')})}
bs.forEach(function(b){b.addEventListener('click',function(){var u=b.getAttribute('data-rm-unit');try{localStorage.setItem('rmUnit',u)}catch(e){}apply(u)})});
var u='min';try{u=localStorage.getItem('rmUnit')||'min'}catch(e){}apply(u);window.addEventListener('resize',function(){var x='min';try{x=localStorage.getItem('rmUnit')||'min'}catch(e){}apply(x)})})();
JS;
		echo '<script>' . str_replace( array( '__CUP__', '__EN__' ), array( wp_json_encode( $cup ), $en ), $js ) . '</script>'; // phpcs:ignore
	}
}, 99 );


add_action( 'wp_footer', function () {
	if ( is_admin() ) {
		return;
	}
	$css = <<<'CSS'
.native-tabs .re-tabs,.rm-bh-unit,.rm-bh-seg{position:relative}
.rm-bh-seg{display:inline-flex;align-items:center;max-width:100%;box-sizing:border-box;padding:5px;gap:2px;border-radius:999px;background:rgba(255,255,255,.88);border:1px solid rgba(0,78,255,.16);overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.rm-bh-seg::-webkit-scrollbar{display:none}
body .rm-bh-seg .rm-bh-pill{position:relative;z-index:1;flex:0 0 auto;white-space:nowrap;background:transparent!important;border:0!important;border-radius:999px;padding:11px 18px;font-size:15px;line-height:1;color:#111!important;box-shadow:none!important}
body .rm-bh-seg .rm-bh-pill[aria-current="true"]{color:#fff!important}
body .rm-bh-seg button[aria-pressed="false"]:hover,body .rm-bh-seg .rm-bh-pill:not([aria-current="true"]):hover{background:#e3ecff!important;color:#004eff!important}
@media(max-width:781px){body .rm-bh-seg .rm-bh-pill{font-size:14px;padding:10px 14px}}
.rm-pill-ind{position:absolute;top:0;left:0;width:0;height:0;border-radius:999px;background:#004eff;pointer-events:none;z-index:0;transition:transform .38s cubic-bezier(.4,0,.2,1),width .38s cubic-bezier(.4,0,.2,1),height .38s cubic-bezier(.4,0,.2,1),opacity .2s}
.rm-pill-ind.rm-na{transition:none}
body .native-tabs .re-tabs>button,.rm-bh-unit button{position:relative;z-index:1}
body .native-tabs .re-tabs>button[aria-selected="true"],body .rm-bh-unit button[aria-pressed="true"]{background:transparent!important;box-shadow:none!important;color:#fff!important}
body .native-tabs .re-tabs,body .rm-bh-unit{box-shadow:none!important}
body .native-tabs .re-tabs>button:not([aria-selected="true"]):hover,body .rm-bh-unit button[aria-pressed="false"]:hover{background:#e3ecff!important;color:#004eff!important}
body .rm-bh-seg button{position:relative;z-index:1;flex:0 0 auto;appearance:none;border:0;cursor:pointer;font:inherit;font-size:15px;line-height:1;padding:11px 18px;border-radius:999px;background:transparent;color:#111;white-space:nowrap;-webkit-tap-highlight-color:transparent}
body .rm-bh-seg button[aria-pressed="true"]{color:#fff!important;background:transparent!important}
.rm-bh-sep{flex:0 0 1px;align-self:stretch;margin:8px 8px;background:rgba(0,78,255,.18)}
.rm-bh-ul{flex:0 0 auto;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#586373;padding:0 8px 0 14px;position:relative;z-index:1;white-space:nowrap}
@media(max-width:781px){body .rm-bh-seg button{font-size:14px;padding:10px 14px}.rm-bh-ul{font-size:10px;padding-left:10px}.rm-bh-bar .rm-bh-row{flex-direction:column;align-items:stretch}.rm-bh-bar .rm-bh-seg{display:flex;width:100%}.rm-bh-readsw{justify-content:flex-start}}
@media(prefers-reduced-motion:reduce){.rm-pill-ind{transition:none}}
CSS;
	$js = <<<'JS'
(function(){
function setup(box,sel){
var key='i'+sel.length;if(box.getAttribute('data-'+key))return;box.setAttribute('data-'+key,'1');
var ind=document.createElement('span');ind.className='rm-pill-ind rm-na';box.insertBefore(ind,box.firstChild);
function pos(anim){var a=box.querySelector(sel);if(!a){ind.style.opacity=0;return}
ind.style.opacity=1;if(!anim)ind.classList.add('rm-na');
ind.style.width=a.offsetWidth+'px';ind.style.height=a.offsetHeight+'px';
ind.style.transform='translate('+a.offsetLeft+'px,'+a.offsetTop+'px)';
if(!anim){void ind.offsetWidth;ind.classList.remove('rm-na')}}
pos(false);
new MutationObserver(function(){pos(true)}).observe(box,{attributes:true,subtree:true,attributeFilter:['aria-selected','aria-pressed','class']});
window.addEventListener('resize',function(){pos(false)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){pos(false)});
window.addEventListener('load',function(){pos(false)});
}
function init(){
document.querySelectorAll('.native-tabs .re-tabs').forEach(function(b){setup(b,'button[aria-selected="true"]')});
document.querySelectorAll('.rm-bh-unit').forEach(function(b){setup(b,'button[aria-pressed="true"]')});
document.querySelectorAll('.rm-bh-seg').forEach(function(b){setup(b,'a[aria-current="true"]');setup(b,'button[aria-pressed="true"]');var a=b.querySelector('a[aria-current="true"]');if(a&&b.scrollWidth>b.clientWidth&&a.offsetLeft+a.offsetWidth>b.clientWidth-10){b.scrollLeft=Math.max(0,a.offsetLeft-60)}
b.querySelectorAll('a.rm-bh-pill').forEach(function(l){l.addEventListener('click',function(e){if(e.metaKey||e.ctrlKey||e.shiftKey||l.getAttribute('aria-current')==='true')return;e.preventDefault();b.querySelectorAll('a.rm-bh-pill').forEach(function(x){x.removeAttribute('aria-current')});l.setAttribute('aria-current','true');var h=l.href;setTimeout(function(){location.href=h},300)})})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
setTimeout(init,600);
})();
JS;
	echo '<style id="rm-pill-css">' . $css . '</style><script>' . $js . '</script>'; // phpcs:ignore
}, 100 );

