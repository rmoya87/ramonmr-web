<?php
/** Modulo de Ramon Site: bloque final "Hablemos de tu proyecto" (servicios y home). */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_head', function () {
	$css = '
body .native-cta{background:transparent!important;padding:56px 20px 64px!important;margin:0!important}
body .native-cta .native-width{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:0 48px;align-content:center;max-width:1120px;margin:0 auto;padding:clamp(36px,5vw,72px) clamp(28px,5vw,72px);border-radius:36px;color:#fff;background:var(--wp--preset--color--blue,#004eff);border:0;box-shadow:0 24px 60px -24px rgba(0,78,255,.55)}
body .native-cta h2{margin:0!important;color:#fff!important;font-size:clamp(2.1rem,5.2vw,4rem)!important;line-height:1.02!important;letter-spacing:-.02em;grid-column:1}
body .native-cta p{margin:20px 0 0!important;color:rgba(255,255,255,.92)!important;font-size:clamp(1.05rem,1.6vw,1.25rem);max-width:34ch;grid-column:1}
body .native-cta .native-button{grid-column:2;grid-row:1 / span 2;justify-self:end;align-self:center;display:inline-flex;align-items:center;gap:14px;padding:20px 28px 20px 32px!important;border-radius:999px!important;background:#fff!important;color:var(--wp--preset--color--blue,#004eff)!important;font-weight:700;font-size:1.05rem;text-decoration:none;box-shadow:0 10px 28px -10px rgba(0,20,90,.5);transition:transform .2s ease,box-shadow .2s ease}
body .native-cta .native-button::after{content:"";width:40px;height:40px;flex:none;border-radius:50%;background:var(--wp--preset--color--blue,#004eff) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Crect x=\'3\' y=\'5\' width=\'18\' height=\'14\' rx=\'3\'/%3E%3Cpath d=\'m4 7 8 6 8-6\'/%3E%3C/svg%3E") center/22px no-repeat}
body .native-cta .native-button:hover{transform:translateY(-2px);box-shadow:0 16px 34px -12px rgba(0,20,90,.6)}
body .native-cta .native-button:focus-visible{outline:3px solid #fff!important;outline-offset:3px!important}
@media (max-width:781px){body .native-cta{padding:40px 14px 48px!important}body .native-cta .native-width{grid-template-columns:1fr;border-radius:28px}body .native-cta .native-button{grid-column:1;grid-row:auto;justify-self:stretch;justify-content:space-between;margin-top:32px!important}}
body.home .section.news{padding-bottom:0!important;min-height:0!important}
body.home .native-cta{padding-top:96px!important}
@media (max-width:781px){body.home .native-cta{padding-top:68px!important}}
@media (prefers-reduced-motion:reduce){body .native-cta .native-button{transition:none}}
';
	echo '<style id="rsite-cta-css">' . $css . '</style>' . "\n";
}, 111 );

/* En la home se sustituye la banda final por el mismo modulo. */
add_action( 'template_redirect', function () {
	if ( ! is_front_page() || is_feed() ) { return; }
	ob_start( function ( $html ) {
		$en  = function_exists( 'pll_current_language' ) && 'en' === pll_current_language();
		$url = $en ? home_url( '/en/contact-digital-consultant/' ) : home_url( '/contacto-consultor-digital/' );
		$new = $en
			? '<section class="native-cta"><div class="native-width"><h2>LET&#8217;S TALK ABOUT<br>YOUR PROJECT</h2><p>Tell me what you need and where you are.</p><a class="native-button" href="' . esc_url( $url ) . '">Contact me</a></div></section>'
			: '<section class="native-cta"><div class="native-width"><h2>HABLEMOS DE<br>TU PROYECTO</h2><p>Cuéntame qué necesitas y en qué punto estás.</p><a class="native-button" href="' . esc_url( $url ) . '">Contactar</a></div></section>';
		return preg_replace( '#<section class="wp-block-group section cta [^"]*"[^>]*>.*?</section>#s', str_replace( '$', '\\$', $new ), $html, 1 );
	} );
}, 2 );

/* Servicios: "Experiencia relacionada" como tarjetas con imagen (rejilla en escritorio, carrusel en movil). */
function rsite_cases_map() {
	return array(
		'marketing-digital'        => array( 3974, 3973, 153338, 3960, 3972, 3965, 3968, 22250 ),
		'diseno-de-producto'       => array( 153395, 3954, 3958, 3963, 3961, 22258, 22681, 3962 ),
		'necesidades-de-negocio'   => array( 153146, 3961, 22268, 3962, 22250, 22258, 22681, 3971 ),
	);
}

add_action( 'wp_head', function () {
	$css = '
body .rs-cases-wrap{position:relative}
body .rs-cases{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:18px;margin:24px 0 0;padding:4px 0 14px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
body .rs-case{flex:0 0 calc((100% - 54px)/4);scroll-snap-align:start}
@media (max-width:1100px) and (min-width:782px){body .rs-case{flex-basis:calc((100% - 36px)/3)}}
body .rs-nav{display:flex;gap:10px;justify-content:flex-end;margin-top:6px}
body .rs-nav[hidden]{display:none}
body .rs-nav button{width:44px;height:44px;border-radius:50%;border:1px solid rgba(17,17,17,.12);background:rgba(255,255,255,.8);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#111;font-size:1.2rem;cursor:pointer}
body .rs-nav button:disabled{opacity:.4;cursor:default}
/* Fondo: blanco en Como trabajo, fondo general en Experiencia relacionada */
body .native-section.open-panel:has(.native-steps) .native-panel{background:#fff!important;padding:32px!important;border-radius:24px!important}
body .native-section.rs-open .native-panel{background:transparent!important;padding:20px 0!important;border-radius:0!important;box-shadow:none!important}
body .rs-case{display:flex;flex-direction:column;background:rgba(255,255,255,.72);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(17,17,17,.08);border-radius:22px;overflow:hidden;text-decoration:none!important;color:inherit;box-shadow:0 12px 32px -22px rgba(0,30,120,.35);transition:transform .25s ease,box-shadow .25s ease}
body .rs-case:hover{transform:translateY(-3px);box-shadow:0 18px 40px -22px rgba(0,30,120,.45)}
body .rs-case:focus-visible{outline:3px solid var(--wp--preset--color--blue,#004eff);outline-offset:3px}
body .rs-case-img{display:block;aspect-ratio:4/3;overflow:hidden;background:#e9eefb}
body .rs-case-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
body .rs-case:hover .rs-case-img img{transform:scale(1.04)}
body .rs-case-body{display:flex;flex-direction:column;gap:4px;padding:14px 16px 16px;flex:1}
body .rs-case-client{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#4b5563;font-weight:600}
body .rs-case-title{font-size:1rem;line-height:1.25;font-weight:700;color:#111}
body .rs-case-meta{font-size:.85rem;line-height:1.4;color:#4b5563}
body .rs-case-more{margin-top:auto;padding-top:8px;font-size:.9rem;color:var(--wp--preset--color--blue,#004eff);font-weight:600}
@media (max-width:781px){body .rs-case{flex:0 0 72%;max-width:280px}body .rs-cases{margin:24px -4px 0;padding:4px 4px 14px;gap:14px}body .native-section.open-panel:has(.native-steps) .native-panel{padding:24px 20px!important}}
body .rs-cases:focus-visible{outline:3px solid var(--wp--preset--color--blue,#004eff);outline-offset:2px;border-radius:12px}
@media (prefers-reduced-motion:reduce){body .rs-cases{scroll-behavior:auto}body .rs-case,body .rs-case-img img{transition:none}body .rs-case:hover{transform:none}body .rs-case:hover .rs-case-img img{transform:none}}
';
	echo '<style id="rsite-cases-css">' . $css . '</style>' . "\n";
}, 112 );

add_action( 'template_redirect', function () {
	if ( ! is_page() || is_feed() ) { return; }
	$pid_page = get_queried_object_id();
	$es_id    = function_exists( 'pll_get_post' ) ? (int) pll_get_post( $pid_page, 'es' ) : $pid_page;
	$slug     = $es_id ? get_post_field( 'post_name', $es_id ) : '';
	$map      = rsite_cases_map();
	if ( ! isset( $map[ $slug ] ) ) { return; }
	$lang = function_exists( 'pll_current_language' ) ? pll_current_language() : 'es';
	ob_start( function ( $html ) use ( $map, $slug, $lang ) {
		$more = ( 'en' === $lang ) ? 'View project' : 'Ver proyecto';
		$label = ( 'en' === $lang ) ? 'Related projects' : 'Proyectos relacionados';
		return preg_replace_callback(
			'#<section class="native-section"><div class="native-width native-panel"><h2>(EXPERIENCIA RELACIONADA|RELATED EXPERIENCE)</h2>.*?</div></div></section>#s',
			function ( $m ) use ( $map, $slug, $lang, $more, $label ) {
				$out = '';
				foreach ( $map[ $slug ] as $es ) {
					$pid = function_exists( 'pll_get_post' ) ? (int) pll_get_post( $es, $lang ) : $es;
					if ( ! $pid || 'publish' !== get_post_status( $pid ) ) { continue; }
					$ex     = wp_strip_all_tags( get_post_field( 'post_excerpt', $pid ) ?: get_post_field( 'post_content', $pid ) );
					$client = ''; $meta = '';
					if ( preg_match( '/(?:Cliente|Client)\s+(.+?)\s+(?:Rol|Role|Empresa|Company)\s/u', $ex, $c ) ) { $client = $c[1]; }
					if ( preg_match( '/(?:Rol|Role)\s+(.+?)\s+(?:Año|Year|Periodo|Period)\s+(\S+)/u', $ex, $r ) ) { $meta = $r[1] . ' · ' . rtrim( $r[2], ',.' ); }
					if ( 'Proyecto personal' === $client || 'Personal project' === $client ) { $client = ( 'en' === $lang ) ? 'Personal project' : 'Proyecto personal'; }
					$img = get_the_post_thumbnail_url( $pid, 'medium_large' );
					$ttl = get_the_title( $pid );
					$out .= '<a class="rs-case" href="' . esc_url( get_permalink( $pid ) ) . '" target="_blank" rel="noopener noreferrer">'
						. ( $img ? '<span class="rs-case-img"><img src="' . esc_url( $img ) . '" alt="" loading="lazy" decoding="async" width="768" height="576"></span>' : '' )
						. '<span class="rs-case-body">' . ( $client ? '<span class="rs-case-client">' . esc_html( $client ) . '</span>' : '' )
						. '<span class="rs-case-title">' . esc_html( $ttl ) . '</span>'
						. ( $meta ? '<span class="rs-case-meta">' . esc_html( $meta ) . '</span>' : '' )
						. '<span class="rs-case-more">' . $more . ' <span aria-hidden="true">→</span></span></span><span style="position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap"> (' . ( 'en' === $lang ? 'opens in a new tab' : 'se abre en una pestaña nueva' ) . ')</span></a>';
				}
				if ( '' === $out ) { return $m[0]; }
				$prev = ( 'en' === $lang ) ? 'Previous projects' : 'Proyectos anteriores';
				$next = ( 'en' === $lang ) ? 'Next projects' : 'Proyectos siguientes';
				return '<section class="native-section rs-open"><div class="native-width native-panel"><h2>' . $m[1] . '</h2><div class="rs-cases-wrap"><div class="rs-cases" role="region" aria-label="' . esc_attr( $label ) . '" tabindex="0">' . $out . '</div><div class="rs-nav" hidden><button type="button" data-rs-dir="-1" aria-label="' . esc_attr( $prev ) . '">←</button><button type="button" data-rs-dir="1" aria-label="' . esc_attr( $next ) . '">→</button></div></div></div></section>';
			},
			$html, 1
		);
	} );
}, 3 );

add_action( 'wp_footer', function () {
	?>
<script>(function(){var w=document.querySelector('.rs-cases-wrap');if(!w)return;var c=w.querySelector('.rs-cases'),n=w.querySelector('.rs-nav'),b=n.querySelectorAll('button');
function upd(){var o=c.scrollWidth>c.clientWidth+4;n.hidden=!o;b[0].disabled=c.scrollLeft<=2;b[1].disabled=c.scrollLeft+c.clientWidth>=c.scrollWidth-2}
b.forEach(function(x){x.addEventListener('click',function(){var card=c.querySelector('.rs-case');var step=card.getBoundingClientRect().width+18;var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;c.scrollBy({left:step*(+x.dataset.rsDir),behavior:rm?'auto':'smooth'})})});
c.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);upd();})();</script>
	<?php
}, 50 );

add_action( 'wp_head', function () {
	echo '<style id="rsite-pad-css">html body .method-card.method-card{min-height:0!important;padding:clamp(32px,4vw,56px) clamp(20px,4.5vw,56px)!important}html body main .native-section.native-section:has(>.native-panel>.native-steps){padding-top:8px!important;padding-bottom:8px!important}html body main .native-section .native-panel.native-panel.native-panel.native-panel:has(>.native-steps){padding:clamp(24px,3vw,40px) clamp(20px,4.5vw,56px)!important}@media (prefers-color-scheme: dark){html body main .native-section .native-panel.native-panel.native-panel:has(>.native-tiles){background-color:#171b24!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:24px!important}}</style>' . "\n"; // phpcs:ignore
}, 99 );

/* Blog y listados: 12 entradas por pagina (rejilla 3x4) y paginado rediseñado. */
add_action( 'pre_get_posts', function ( $q ) {
	if ( is_admin() || ! $q->is_main_query() ) { return; }
	if ( $q->is_category() || $q->is_tag() || $q->is_search() || $q->is_home() ) {
		$q->set( 'posts_per_page', 12 );
	}
}, 20 );
add_action( 'wp_head', function () {
	if ( is_admin() || ! ( is_category() || is_tag() || is_search() || is_home() ) ) { return; }
	$css = '
html body .wp-block-query-pagination.wp-block-query-pagination{display:flex!important;flex-wrap:wrap;align-items:center;justify-content:center!important;gap:8px!important;margin:48px auto 0!important;padding:0!important;width:fit-content;max-width:100%;border:0;background:none;box-shadow:none}
html body .wp-block-query-pagination .wp-block-query-pagination-numbers{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0!important}
html body .wp-block-query-pagination .page-numbers{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:44px;padding:0 12px;border-radius:999px;font-size:16px;line-height:1;color:#0b1020;text-decoration:none!important;background:transparent;border:0;transition:background .2s,color .2s}
html body .wp-block-query-pagination a.page-numbers:hover,html body .wp-block-query-pagination a.page-numbers:focus-visible{background:rgba(0,78,255,.1);color:#004eff}
html body .wp-block-query-pagination .page-numbers.current{background:#004eff;color:#fff;font-weight:600}
html body .wp-block-query-pagination .page-numbers.dots{min-width:28px;padding:0}
html body .wp-block-query-pagination .wp-block-query-pagination-previous,html body .wp-block-query-pagination .wp-block-query-pagination-next{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;margin:0!important;border-radius:999px;font-size:16px;color:#004eff;text-decoration:none!important;border:0;background:transparent;transition:background .2s,color .2s}
html body .wp-block-query-pagination .wp-block-query-pagination-previous:hover,html body .wp-block-query-pagination .wp-block-query-pagination-next:hover,html body .wp-block-query-pagination .wp-block-query-pagination-previous:focus-visible,html body .wp-block-query-pagination .wp-block-query-pagination-next:focus-visible{background:rgba(0,78,255,.1);color:#004eff}
html body .wp-block-query-pagination .wp-block-query-pagination-previous-arrow,html body .wp-block-query-pagination .wp-block-query-pagination-next-arrow{margin:0 6px}
@media (max-width:600px){html body .wp-block-query-pagination.wp-block-query-pagination{gap:6px!important}html body .wp-block-query-pagination .page-numbers{min-width:40px;height:40px;padding:0 8px}html body .wp-block-query-pagination .wp-block-query-pagination-previous,html body .wp-block-query-pagination .wp-block-query-pagination-next{padding:0 14px}}
@media (prefers-color-scheme: dark){html body .wp-block-query-pagination .page-numbers:not(.current){color:#e8ecf5;background:transparent!important}html body .wp-block-query-pagination a.page-numbers:hover{background:rgba(143,176,255,.16);color:#8fb0ff}html body .wp-block-query-pagination .page-numbers.current{background:#004eff;color:#fff}html body .wp-block-query-pagination .wp-block-query-pagination-previous,html body .wp-block-query-pagination .wp-block-query-pagination-next{background:transparent;color:#8fb0ff;border:0}html body .wp-block-query-pagination .wp-block-query-pagination-previous:hover,html body .wp-block-query-pagination .wp-block-query-pagination-next:hover{background:rgba(143,176,255,.16);color:#8fb0ff}}';
	echo '<style id="rsite-pager-css">' . $css . '</style>' . "\n"; // phpcs:ignore
}, 99 );

