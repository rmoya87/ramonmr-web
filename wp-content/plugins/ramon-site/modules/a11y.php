<?php
/** Modulo de Ramon Site: accesibilidad (WCAG 2.2 AA). Contraste, foco y objetivos tactiles. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_head', function () {
	$css = '
body .project-overlay .wp-block-post-title{max-height:none!important;overflow:visible!important;line-height:1.3!important}body .project-overlay .wp-block-post-title a{line-height:1.3!important}

@media (max-width:600px){body .project-overlay{padding:10px 12px!important}body .project-overlay .wp-block-post-title{font-size:15px!important;line-height:1.25!important;margin:0!important}body .project-overlay :is(p,.wp-block-post-terms){font-size:13px!important;margin:4px 0 0!important}}

body.single-post .native-related-posts .related-card-details.related-card-details{background-image:linear-gradient(rgba(11,16,30,.6) 0%,rgba(11,16,30,.82) 45%,rgba(11,16,30,.94) 100%)!important}body .related-card-details :is(p,a,h3,h2,span){text-shadow:0 1px 2px rgba(0,0,0,.5)}
body .project-overlay{background-image:linear-gradient(rgba(0,0,0,.1) 0%,rgba(0,0,0,.9) 100%)!important}body.page-id-153557 .native-project-grid .project-overlay{display:flex!important;flex-direction:column!important;justify-content:flex-end!important;align-items:flex-start!important;text-align:left!important;inset:0!important;padding:24px!important}body.page-id-153557 .native-project-grid .project-overlay .wp-block-post-terms{display:none!important}body.page-id-153557 .native-project-grid .project-overlay .wp-block-post-title{margin:0!important;font-size:20px;text-wrap:balance;max-width:100%}@media(max-width:600px){body.page-id-153557 .native-project-grid .project-overlay{padding:10px 12px!important}body.page-id-153557 .native-project-grid .project-overlay .wp-block-post-title{font-size:15px!important}}body .project-overlay :is(h3,a,span,p){color:#fff!important;text-shadow:0 1px 3px rgba(0,0,0,.6)}
body.page-template .rm-contact-intro .rm-ct-k,body .rm-contact-intro .rm-ct-k,body .rm-ct-pv-k,body .rm-ct-pv-head strong{color:#586373!important}

body.page-id-44 .rm-contact-intro .rm-ct-k,body.page-id-44 .rm-ct-pv-k,body.page-id-44 .rm-ct-pv-head strong,body .rm-bl-k,body .rm-bl-crumbs{color:#586373!important}

body .rm-bh-band{background-image:radial-gradient(900px 420px at 85% 10%,rgba(120,170,255,.16),transparent 70%),linear-gradient(135deg,#0048ec,#003bc4)!important}
body .rm-bh-band,body .rm-bh-band *{--rm-a11y-t:1}body .rm-bh-band :is(p,span,a,h1,h2,li,div){color:#fff!important}

body .site-header .header-row.header-row::before{background:rgba(255,255,255,.70)!important}
body .rm-bh-feature{background:linear-gradient(rgba(0,25,100,.2),rgba(0,25,100,.2)),rgba(255,255,255,.1)!important}

/* Contraste 4.5:1 */
body .site-footer .eyebrow,body .site-footer .eyebrow.has-muted-color{color:#9a9aa0!important}
body .portfolio-cta .is-style-outline .wp-block-button__link,body .has-dark-background-color .is-style-outline .wp-block-button__link{color:#6b95ff!important;border-color:#6b95ff!important}
body .rm-ph,body .is-ph{color:#6b7280!important}


/* P1 resto: contraste */
body .project-meta-field h3,body .project-meta-field .wp-block-heading{color:#5f6368!important}
body .project-nav-card-label{color:#4b5563!important}
body .site-footer .footer-dot{color:#c9c9cf!important}
body .rm-bh-k,body .rm-bh-from{color:#fff!important}
body .social-rail{background:rgba(255,255,255,.88);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-radius:999px;padding:14px 8px;box-shadow:0 6px 20px -10px rgba(0,0,0,.25)}
html body .project-headline.project-headline{font-size:clamp(2.1rem,4.4vw,3.4rem)!important;overflow-wrap:normal!important;word-break:normal!important}
html body .skip-link.screen-reader-text:focus{clip:auto!important;clip-path:none!important;width:auto!important;height:auto!important;overflow:visible!important;position:fixed!important;top:12px!important;left:12px!important;z-index:100000!important;padding:12px 20px!important;border-radius:999px!important;background:#004eff!important;color:#fff!important;font-size:15px!important;font-weight:600;text-decoration:none!important;box-shadow:0 8px 24px -8px rgba(0,78,255,.6)!important;white-space:nowrap}
body .social-rail,body .social-rail a,body .social-rail p{color:#111!important}


/* P2 resto */
body .service-card-title a,body [class*=crumbs] a,body .footer-row-links a{display:inline-flex;align-items:center;min-height:24px;min-width:24px;justify-content:center}
body .wp-block-button__link{min-width:24px!important;min-height:24px;text-align:center}
body .logos-marquee.rs-paused .logos-track{animation-play-state:paused!important}
body .rs-pause{display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;margin:14px 0 0 auto;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.06);color:#d6d6d6;cursor:pointer;opacity:.85;transition:background .2s,opacity .2s}body .rs-pause:hover,body .rs-pause:focus-visible{background:rgba(255,255,255,.18);opacity:1;color:#fff}body .rs-pause svg{width:14px;height:14px;fill:currentColor;display:block}body .rs-pause .rs-ico-play{display:none}body .rs-pause[data-paused="1"] .rs-ico-play{display:block}body .rs-pause[data-paused="1"] .rs-ico-pause{display:none}body .rs-pause:focus-visible{outline:3px solid #8fb0ff!important;outline-offset:3px}body .logos-marquee .logos-item img{content-visibility:visible}
@media (prefers-reduced-motion:reduce){body .logos-marquee .logos-track{animation:none!important;transform:none!important;flex-wrap:wrap;width:auto;justify-content:center}body .rs-pause{display:none}}

/* Objetivos tactiles minimos 24x24 (WCAG 2.5.8) */
body .rm-bh-dots{gap:0!important}
body .rm-bh-dots button{box-sizing:content-box!important;min-width:8px;min-height:8px;padding:8px!important;background-clip:content-box!important}
body .page-numbers{display:inline-flex;align-items:center;justify-content:center;min-width:24px;min-height:24px}
body .wp-block-navigation__submenu-icon{min-width:24px!important;min-height:24px!important;display:inline-flex;align-items:center;justify-content:center}
body .wp-block-post-title a,body [class*=breadcrumb] a,body li>a:not(.wp-block-button__link),body .wp-block-post-terms a,body .wp-block-breadcrumbs a,body nav[aria-label] a{display:inline-block;min-height:24px;line-height:1.5;padding-block:1px}
/* Foco visible */
body :is(a,button,input,select,textarea,summary,[tabindex]):focus-visible{outline:3px solid #004eff!important;outline-offset:2px!important;border-radius:6px}
body .has-dark-background-color :is(a,button,input,select,textarea):focus-visible,body .site-footer :is(a,button):focus-visible{outline-color:#8fb0ff!important}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}}
/* Auditoria axe 13-oct: contraste y objetivos (WCAG 2.2 AA, sin certificar) */
@media (prefers-color-scheme:light){html body .is-style-outline--2>.wp-block-button__link.wp-element-button{color:#004eff!important}}
@media (prefers-color-scheme:dark){html body .re-tools .tool-symbol:not(:has(img)){color:#9db9ff!important}}
html body.page-id-153858 .entry-content p a,html body.page-id-153859 .entry-content p a{text-decoration:underline!important;text-underline-offset:2px}
html body .news-overlay .taxonomy-category a{display:inline-flex!important;align-items:center;min-height:24px;position:relative;z-index:3}
html body .competency-grid:focus-visible,html body .certificate-grid:focus-visible,html body .tool-grid:focus-visible{outline:2px solid #004eff;outline-offset:2px;border-radius:12px}
html body .listing-grid.native-news-grid.native-news-grid .news-overlay h3.wp-block-post-title.wp-block-post-title{line-height:1.2!important;max-height:none!important}
html body .listing-grid.native-news-grid .news-overlay .wp-block-post-title a{display:-webkit-box!important;-webkit-line-clamp:3!important;-webkit-box-orient:vertical!important;overflow:hidden!important;line-height:1.2!important}
@media (prefers-color-scheme:dark){html body .rm-ct-topic.rm-ct-topic[aria-pressed="true"]{background-color:#004eff!important;border-color:#004eff!important;color:#fff!important;box-shadow:0 14px 34px rgba(0,78,255,.45)!important}html body .rm-ct-topic.rm-ct-topic[aria-pressed="true"] .rm-ct-ico.rm-ct-ico{background-color:#fff!important}}
/* Foco en campos: sin halo, borde propio en azul de la web (dia y noche) */
html body :is(input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=hidden]):not([type=image]):not([type=file]),textarea,select):is(:focus,:focus-visible),html body .wpcf7 :is(input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=hidden]):not([type=image]):not([type=file]),textarea,select):is(:focus,:focus-visible),html body.page-id-44 .rm-contact-form .wpcf7 :is(input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=hidden]):not([type=image]):not([type=file]),textarea,select):is(:focus,:focus-visible),html body.page-id-153546 .rm-contact-form .wpcf7 :is(input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=hidden]):not([type=image]):not([type=file]),textarea,select):is(:focus,:focus-visible){outline:0!important;outline-offset:0!important;border-color:#004eff!important;box-shadow:inset 0 0 0 1px #004eff!important}
@media (prefers-color-scheme:dark){html body :is(input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=hidden]):not([type=image]):not([type=file]),textarea,select):is(:focus,:focus-visible),html body .wpcf7 :is(input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=hidden]):not([type=image]):not([type=file]),textarea,select):is(:focus,:focus-visible),html body.page-id-44 .rm-contact-form .wpcf7 :is(input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=hidden]):not([type=image]):not([type=file]),textarea,select):is(:focus,:focus-visible),html body.page-id-153546 .rm-contact-form .wpcf7 :is(input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=hidden]):not([type=image]):not([type=file]),textarea,select):is(:focus,:focus-visible){border-color:#4d82ff!important;box-shadow:inset 0 0 0 1px #4d82ff!important}}
@media (prefers-color-scheme:dark){html body .site-header .header-row.header-row.header-row.header-row{border-color:transparent!important}}
@media (prefers-color-scheme:dark){html body .site-header .header-row.header-row.header-row.header-row{background-color:transparent!important}html body .site-header .header-row.header-row.header-row::before{background:rgba(22,26,35,.70)!important}html body .site-header .header-row.header-row.header-row :is(.wp-block-navigation,.wp-block-group,.header-inner,.header-pill){background-color:transparent!important}html body .re-section .skill-number.skill-number{color:#1a60ff!important}html body .site-header .header-row.header-row.header-row::before{inset:-1px!important}html body .service-section.native-service-cards.native-service-cards{background-color:#05070a!important}html body main .wp-block-button.is-style-outline.is-style-outline>.wp-block-button__link.wp-element-button{color:#4d82ff!important;border-color:#4d82ff!important}html body .service-card-more.service-card-more.service-card-more,html body .service-card-more.service-card-more.service-card-more a{color:#4d82ff!important}html body .re-tools .tool-symbol img[src*=cursor-logo],html body .re-tools .tool-symbol img[src*=laminas]{filter:brightness(0) invert(1)!important}html body main .native-section.native-section .native-panel.native-panel.native-panel.native-panel,html body main .native-section .native-panel.native-panel.native-panel.native-panel:has(>.native-tiles){border-color:transparent!important}html body[class][class][class] .rm-contact-form.rm-contact-form.rm-contact-form :is(input.wpcf7-form-control,textarea.wpcf7-form-control,select.wpcf7-form-control):not(:focus):not(:focus-visible){border-color:rgba(255,255,255,.36)!important}html body[class][class][class] main :is(.competency,.certificate).competency.competency,html body[class][class][class] main article.certificate.certificate{border-color:transparent!important}html body[class][class][class] .rm-bl-cajon-list li,html body[class][class][class] :is(.rm-contact-form.rm-contact-form.rm-contact-form,.rm-ct-pv-card.rm-ct-pv-card.rm-ct-pv-card),html body[class][class][class] .hero-article-social.hero-article-social.hero-article-social{border-color:transparent!important}}
body .re-tools .tool-symbol:has(img[src*=activecampaign]){width:128px!important;height:40px!important;margin-left:0!important}body .re-tools .tool-symbol img[src*=activecampaign]{width:100%!important;height:100%!important;object-fit:contain!important}body .re-tools .tool-symbol:has(img[src*=laminas]){width:140px!important;height:56px!important;overflow:hidden!important;position:relative}body .re-tools .tool-symbol img[src*=laminas]{width:168px!important;height:168px!important;max-width:none!important;flex:none;transform:translate(22px,48px)}body .rm-contact-form .wpcf7-acceptance label input[type=checkbox]{margin-top:0!important}body .rm-contact-form .wpcf7-acceptance label .wpcf7-list-item-label{margin-top:2px!important}@media (prefers-color-scheme:light){html body .rm-contact-form.rm-contact-form.rm-contact-form :is(input.wpcf7-form-control,textarea.wpcf7-form-control,select.wpcf7-form-control):not(:focus):not(:focus-visible){border-color:#7f8a9a!important}}
@media (prefers-color-scheme:dark){html body[class][class][class] .career .career-year.career-year.career-year{color:#1a60ff!important}html body[class][class][class] .career.career.career{border-bottom-color:rgba(255,255,255,.06)!important}}@media (prefers-color-scheme:light){html body[class][class][class] .career.career.career{border-bottom-color:#f0f2f6!important}}
@media (prefers-color-scheme:dark){html body[class][class][class] .native-result.native-result.native-result{border-top-color:rgba(255,255,255,.06)!important}html body[class][class][class] .rm-ct-pv-head.rm-ct-pv-head.rm-ct-pv-head{border-bottom-color:rgba(255,255,255,.06)!important}html body[class][class][class] .rm-ct-pv-foot.rm-ct-pv-foot.rm-ct-pv-foot{border-top-color:rgba(255,255,255,.06)!important}html body[class][class][class] a.rs-case.rs-case.rs-case{border-color:transparent!important}}@media (prefers-color-scheme:light){html body[class][class][class] .native-result.native-result.native-result{border-top-color:#f0f2f6!important}}
@media (prefers-color-scheme:dark){html body[class][class][class] .wpcf7 .rm-consent-ui .wpcf7-acceptance input[type=checkbox]:not(:checked):not(:focus):not(:focus-visible){border-color:rgba(255,255,255,.36)!important}}@media (prefers-color-scheme:light){html body[class][class][class] .wpcf7 .rm-consent-ui .wpcf7-acceptance input[type=checkbox]:not(:checked):not(:focus):not(:focus-visible){border-color:#7f8a9a!important}}
@media (prefers-color-scheme:dark){html body[class][class][class] .wpcf7 .rm-consent-ui .wpcf7-acceptance input[type=checkbox]:checked{border-color:#1a60ff!important}}
@media (prefers-color-scheme:dark){html body[class][class][class] .project-gallery-column.project-gallery-column a{border-color:rgba(255,255,255,.06)!important}html body[class][class][class] .project-meta-field.project-meta-field.project-meta-field{border-color:rgba(255,255,255,.06)!important}html body[class][class][class] a.project-nav-card.project-nav-card.project-nav-card{border-color:transparent!important}}
@media (prefers-color-scheme:dark){html body[class][class][class] .project-gallery-column.project-gallery-column a{background-color:transparent!important}}
html body img.hero-art[src$="rocket.png"]{aspect-ratio:1600/1200}html body img.hero-art[src$="necesidades-negocio.png"]{aspect-ratio:1084/878}
html body img.hero-product[src$="diseno-de-producto.png"]{aspect-ratio:1850/1212}
';
	echo '<style id="rsite-a11y-css">' . $css . '</style>' . "\n";
}, 110 );

/* Campos CF7 sin etiqueta visible: el placeholder pasa tambien a aria-label. */
add_filter( 'wpcf7_form_elements', function ( $html ) {
	return preg_replace_callback( '/<(input|textarea)\b([^>]*?)\splaceholder="([^"]+)"([^>]*)>/i', function ( $m ) {
		if ( false !== stripos( $m[0], 'aria-label=' ) || false !== stripos( $m[0], 'type="hidden"' ) ) { return $m[0]; }
		return '<' . $m[1] . $m[2] . ' aria-label="' . $m[3] . '" placeholder="' . $m[3] . '"' . $m[4] . '>';
	}, $html );
}, 30 );

add_action( 'wp_footer', function () {
	$en = function_exists( 'pll_current_language' ) && 'en' === pll_current_language();
	$p  = $en ? array( 'Pause logo animation', 'Play logo animation' ) : array( 'Pausar animación de logos', 'Reanudar animación de logos' );
	?>
<script id="rsite-a11y-forms-js">document.addEventListener("wpcf7invalid",function(e){var f=e.target&&e.target.querySelector?e.target:null;if(!f)return;setTimeout(function(){var i=f.querySelector("[aria-invalid=true]");if(i){i.focus()}},250)},false);</script>
<script id="rsite-a11y-js">(function(){var m=document.querySelector('.logos-marquee');if(!m)return;function eager(){m.querySelectorAll('img').forEach(function(i){i.loading='eager';i.decoding='sync'})}eager();document.addEventListener('DOMContentLoaded',function(){eager();setTimeout(eager,300)});if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;var t=<?php echo wp_json_encode( $p ); ?>;var b=document.createElement('button');b.type='button';b.className='rs-pause';b.setAttribute('aria-label',t[0]);b.title=t[0];b.innerHTML='<svg class="rs-ico-pause" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><rect x="2" y="1" width="3.5" height="12" rx="1"/><rect x="8.5" y="1" width="3.5" height="12" rx="1"/></svg><svg class="rs-ico-play" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M3 1.2v11.6a.8.8 0 0 0 1.2.7l9-5.8a.8.8 0 0 0 0-1.4l-9-5.8A.8.8 0 0 0 3 1.2z"/></svg>';b.addEventListener('click',function(){var on=m.classList.toggle('rs-paused');b.setAttribute('aria-label',on?t[1]:t[0]);b.title=on?t[1]:t[0];b.dataset.paused=on?'1':'0'});m.parentNode.insertBefore(b,m.nextSibling)})();</script>
	<?php
}, 60 );

/* Visor de imagenes: al cerrar, devolver el foco al enlace que lo abrio (2.4.3). */
add_action( 'wp_footer', function () {
	echo '<script id="rsite-a11y-lightbox-js">(function(){var last=null;document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a");if(a&&a.querySelector("img")&&!e.target.closest(".rn-lightbox"))last=a;},true);document.addEventListener("keydown",function(e){var a=document.activeElement;if(e.key==="Enter"&&a&&a.tagName==="A"&&a.querySelector("img"))last=a;},true);function watch(){var lb=document.querySelector(".rn-lightbox");if(!lb||!window.MutationObserver)return;new MutationObserver(function(){if(!lb.classList.contains("rn-open")&&last&&last.isConnected){var l=last;last=null;setTimeout(function(){try{l.focus({preventScroll:true});}catch(x){}},30);}}).observe(lb,{attributes:true,attributeFilter:["class"]});}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",watch);}else{watch();}})();</script>' . "\n";
}, 99 );


/* Regiones con scroll horizontal: alcanzables por teclado (2.1.1). */
add_action( 'wp_footer', function () {
	echo '<script id="rsite-a11y-scroll-js">(function(){var es=(document.documentElement.lang||"").slice(0,2)==="es";function run(){document.querySelectorAll(".competency-grid,.certificate-grid,.tool-grid").forEach(function(g){if(g.scrollWidth>g.clientWidth+2){if(!g.hasAttribute("tabindex")){g.setAttribute("tabindex","0");}if(!g.hasAttribute("role")){g.setAttribute("role","group");}if(!g.hasAttribute("aria-label")){var h=g.closest("section,div.tab-panel,.re-section");var t=h&&h.querySelector("h2,h3");g.setAttribute("aria-label",(t?t.textContent.trim()+". ":"")+(es?"Lista con desplazamiento horizontal":"Horizontally scrollable list"));}}});}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",run);}else{run();}window.addEventListener("load",run);window.addEventListener("resize",run);document.addEventListener("click",function(){setTimeout(run,60)});})();</script>' . "\n";
}, 99 );


add_action( 'wp_head', function () {
	echo '<style id="rm-a11y-tile-dark">@media (prefers-color-scheme:dark){html body[class][class][class] .rm-ct-topic[aria-pressed="true"]{background-color:#1a60ff!important;border-color:#1a60ff!important}html body[class][class][class] .rm-ct-topic[aria-pressed="true"],html body[class][class][class] .rm-ct-topic[aria-pressed="true"] *{color:#fff!important}}</style>' . "\n";
}, 99 );

add_filter( 'the_content', function ( $html ) {
	if ( ! is_string( $html ) || strpos( $html, 'class="hero-art"' ) === false && strpos( $html, 'class="hero-product"' ) === false ) {
		return $html;
	}
	return preg_replace( '/<img(?![^>]*fetchpriority)([^>]*class="hero-(?:art|product)"[^>]*)>/', '<img fetchpriority="high"$1>', $html, 1 );
}, 99 );

/* Rendimiento: en la portada, las miniaturas de las tarjetas (PNG, bajo el pliegue) se cargaban con prioridad alta y compiten con la imagen del hero (LCP). Reversible: borrar este bloque. */
add_filter( 'wp_get_attachment_image_attributes', function ( $attr ) {
	if ( is_front_page() && isset( $attr['class'] ) && false !== strpos( $attr['class'], 'post-thumbnail' ) ) {
		$attr['loading'] = 'lazy';
		unset( $attr['fetchpriority'] );
	}
	return $attr;
}, 20 );

/* Rendimiento: precarga de la imagen del hero del CV (es un fondo CSS que el navegador descubre tarde). Reversible: borrar este bloque. */
add_action( 'wp_head', function () {
	$path = wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '', PHP_URL_PATH );
	$cv   = array( '/curriculum-ramon-de-moya/', '/en/cv/' );
	if ( ! in_array( $path, $cv, true ) ) {
		return;
	}
	$base = 'https://ramonmr.com/wp-content/themes/ramon-native/assets/images/';
	echo '<link rel="preload" as="image" href="' . esc_url( $base . 'hero-cv-likeness-mobile.webp' ) . '" fetchpriority="high" media="(max-width:781px)">' . "\n";
	if ( '/en/cv/' === $path ) {
		echo '<link rel="preload" as="image" href="' . esc_url( $base . 'hero-cv-likeness.webp' ) . '" fetchpriority="high" media="(min-width:782px)">' . "\n";
	}
}, 1 );

/* Regiones con scroll del CV: el foco quedaba recortado en el borde del viewport (offset positivo) y azul sobre el fondo azul de Herramientas. Anillo interior; blanco en Herramientas. Reversible. */
add_action( 'wp_head', function () {
	echo '<style id="rm-a11y-region-focus">html body[class][class][class] .competency-grid:focus-visible,html body[class][class][class] .certificate-grid:focus-visible,html body[class][class][class] .tool-grid:focus-visible{outline-offset:-4px!important;outline-width:3px!important}html body[class][class][class] .tool-grid:focus-visible{outline-color:#fff!important}</style>' . "\n";
}, 99 );
