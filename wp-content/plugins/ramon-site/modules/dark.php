<?php
/** Modulo de Ramon Site: modo oscuro automatico (segun la preferencia del sistema del visitante, sin interruptor visible). */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_head', function () {
	if ( is_admin() ) { return; }
	echo '<meta name="color-scheme" content="light dark">' . "\n";
	echo '<style id="rsite-dark">@media (prefers-color-scheme: dark){' . <<<'CSS'
:root{color-scheme:dark}
:root{--wp--preset--color--ink:#f2f4f8;--wp--preset--color--muted:#a8afbd;--wp--preset--color--pale:#0f131b;--wp--preset--color--surface:#141821;--wp--preset--color--control:#171c26;--wp--preset--color--line:#2a2f3a;--wp--preset--color--soft:#222733;--wp--preset--color--footer:#08090d}
html,body,body.wp-site-blocks,.wp-site-blocks{background:#0b0d12!important;color:#f2f4f8}
body .has-white-background-color,body .has-surface-background-color{background-color:#141821!important}
body .has-pale-background-color{background-color:#0f131b!important}
body .has-ink-color,body .has-dark-color{color:#f2f4f8!important}
body .has-muted-color{color:#a8afbd!important}
body :is(.hero,.service-section,.native-service-cards,.native-hero,.native-section,.rm-services-v3,.section,.listing-content,.native-landing,.archive-listing){background-color:#0b0d12!important}
body :is(h1,h2,h3,h4,h5,h6,.wp-block-heading,.wp-block-post-title,.wp-block-post-title a){color:#f2f4f8}
body :is(.hero-subtitle,.eyebrow,.service-card-kicker,.service-card-text,.rs-case-client,.rs-case-meta,.project-meta,.panel-intro){color:#b4bac7!important}
body :is(.service-card,.rs-case,.native-card,.card,.competency,.skill,.certificate,.tool,.tab-panel,.re-card,.cv-card,.native-article-score){background-color:#171b24!important;color:#f2f4f8!important;border-color:#2a2f3a!important}
body .rs-case-img{background-color:#1b2540!important}
body :is(.rs-case-more,.native-button){color:#7da3ff}
body .entry-content>p:not([class*="native-"]),body .entry-content>:is(ul,ol,blockquote){color:#e6e9f0!important}
body .entry-content>:is(h2,h3,h4,h5){color:#f2f4f8!important}
body .entry-content>p a,body .entry-content>:is(ul,ol) a{color:#7da3ff!important}
body .entry-content>blockquote{color:#c9cfdb!important}
body .site-header :is(.wp-block-navigation,.wp-block-group,.header-inner,.header-pill),body .wp-block-navigation__submenu-container,body .social-rail{background-color:rgba(24,27,36,.82)!important;border-color:rgba(255,255,255,.12)!important}
body :is(.site-header,.wp-block-navigation) .wp-block-navigation-item__label,body .wp-block-navigation__submenu-container a{color:#f2f4f8!important}
body .wp-block-navigation-item.current-menu-item .wp-block-navigation-item__label,body .wp-block-navigation-item__label[aria-current]{color:#7da3ff!important}
body .social-rail,body .social-rail *{color:#f2f4f8!important}
body :is(input,textarea,select,.wpcf7 input,.wpcf7 textarea){background-color:#171b24!important;color:#f2f4f8!important;border-color:#343a48!important}
body ::placeholder{color:#9aa1b0!important}
body :is(a.rs-pause,button.rs-pause){color:#fff}
body .tab-nav a,body .re-tabs a{color:#f2f4f8}
body hr,body .wp-block-separator{border-color:#2a2f3a!important;background:#2a2f3a}
body .native-related-posts>h4{color:#f2f4f8!important}
body .page-numbers,body .pagination a{background:#171b24!important;color:#f2f4f8!important}
body .page-numbers.current{background:#004eff!important;color:#fff!important}
body .wp-block-image img,body figure img{filter:brightness(.92)}
body .site-mark img,body .site-header img.custom-logo,body .site-header .wp-block-site-logo img{filter:invert(1) hue-rotate(180deg) brightness(1.15)}
body,body :is(.service-card,.rs-case,.site-header,a,button){transition:background-color .3s ease,color .3s ease,border-color .3s ease}
@media (prefers-reduced-motion:reduce){body,body *{transition:none!important}}
html body .site-header .header-row.header-row::before{background:rgba(22,26,35,.70)!important}
html body .site-header .header-row.header-row{border-color:rgba(255,255,255,.12)!important;box-shadow:0 10px 32px rgba(0,0,0,.45)!important}
html body .site-header .header-row a:not(.wp-block-button__link),html body .site-header .header-row .wp-block-navigation-item__content{color:#f2f4f8!important}
html body .site-header .wp-block-navigation__responsive-container-open{background:rgba(255,255,255,.1)!important;color:#f2f4f8!important}
html body .site-header .wp-block-navigation__responsive-container-open svg{fill:#f2f4f8!important}
html body .wp-block-navigation__responsive-container.is-menu-open{background-color:#0b0d12!important}
html body .wp-block-navigation__responsive-container.is-menu-open .wp-block-navigation__responsive-container-close{background:rgba(255,255,255,.12)!important;color:#f2f4f8!important}
html body .wp-block-navigation__responsive-container.is-menu-open .wp-block-navigation__responsive-container-close svg{fill:#f2f4f8!important}
html body .wp-block-navigation__responsive-container.is-menu-open .menu-overlay-brand img{filter:brightness(0) invert(1)!important}
html body main.native-post-single .entry-content.wp-block-post-content{background-color:#0b0d12!important}
html body .wp-block-navigation__responsive-container.is-menu-open li:not(:has(>a.rm-nav-active))::before{background-color:#f2f4f8!important}
html body .wp-block-navigation__responsive-container.is-menu-open li:has(>a.rm-nav-active)::before{background-color:#8fb0ff!important}
html body .site-header .header-row .wp-block-button__link{background:#004eff!important;color:#fff!important}
html body .is-style-outline>.wp-block-button__link,html body .wp-block-button__link.is-style-outline{color:#8fb0ff!important;border-color:#8fb0ff!important;background:transparent!important}
html body article.service-card.service-card,html body .service-card.service-card{background-color:#171b24!important;color:#f2f4f8!important;border-color:#2a2f3a!important}
html body .service-card.service-card :is(.service-card-title,h3){color:#f2f4f8!important}
html body .service-card.service-card :is(.service-card-text,.service-card-kicker,p){color:#b4bac7!important}
html body .wp-block-button.is-style-outline.is-style-outline>.wp-block-button__link.wp-element-button{color:#8fb0ff!important;border-color:#8fb0ff!important;background:transparent!important}
html body .service-card-more.service-card-more a,html body .service-card-more.service-card-more{color:#8fb0ff!important}
html body .entry-content.entry-content{background-color:transparent!important}
html body .project-meta-field.project-meta-field{border-top-color:rgba(255,255,255,.16)!important}
html body .not-found-search .wp-block-search__inside-wrapper{background:rgba(24,27,36,.82)!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:14px!important;overflow:hidden;padding:0!important}
html body .not-found-search .wp-block-search__input{background:transparent!important;color:#f2f4f8!important;border:0!important}
html body .not-found-search .wp-block-search__input::placeholder{color:#aab2c0!important;opacity:1}
html body .not-found-search .wp-block-search__button{background:transparent!important;color:#8fb0ff!important;border:0!important;border-left:1px solid rgba(255,255,255,.14)!important}
html body .not-found-search .wp-block-search__button svg{fill:#8fb0ff!important}
html body .hero-article-social.hero-article-social{background-color:rgba(24,27,36,.82)!important;border:1px solid rgba(255,255,255,.12)!important}
html body .hero-article-social.hero-article-social a,html body .hero-article-social.hero-article-social a svg{color:#f2f4f8!important;fill:currentColor}
html body .re-section.re-pale{background-color:#0b0d12!important}
html body :is(.tab-nav.re-tabs,.rm-bh-seg.rm-bh-seg){background-color:rgba(24,27,36,.92)!important;border-color:rgba(255,255,255,.12)!important}
html body .rm-bh-seg :is(button,a,span,label){color:#f2f4f8!important}
html body .rm-bh-seg button[aria-pressed=true],html body .rm-bh-seg .is-active,html body .rm-bh-seg [aria-selected=true]{color:#fff!important}
html body .rm-bl-cajon-list li{background-color:rgba(24,27,36,.9)!important;border-color:rgba(255,255,255,.12)!important}
html body .rm-bl-cajon-list li strong{color:#f2f4f8!important}
html body .rm-bl-cajon-list li span{background:rgba(143,176,255,.16)!important;color:#b9ceff!important}
html body .rm-bl-cajon-list li em.rs-wk-steps b{background:#2f3850!important}
html body .rm-bl-cajon-list li em.rs-wk-steps b.f{background:#5b86ff!important}
html body .rm-bl-cajon-intro .rm-bl-eyebrow.rm-bl-eyebrow{color:#8fb0ff!important}
html body .rm-bl-cajon-intro p:not(.rm-bl-eyebrow){color:#b4bac7!important}
html body .re-section :is(.re-num,.num,.index,[class*=number]){color:#8fb0ff!important}
html body .re-section :is(p,li,span,small,.desc){color:#c9cfdb}
html body .re-section :is(h2,h3,h4,strong){color:#f2f4f8}
html body :is(.tab-nav.re-tabs,.rm-bh-seg.rm-bh-seg) :is(button,a,span,label){color:#f2f4f8!important}
html body :is(.tab-nav.re-tabs,.rm-bh-seg.rm-bh-seg) :is([aria-selected=true],[aria-pressed=true],.active,.is-active,.on){color:#fff!important}
html body .project-meta-field.project-meta-field h3{color:#aab1c0!important}
html body .project-meta-field.project-meta-field p{color:#f2f4f8!important}
html body a.project-nav-card.project-nav-card{background-color:#171b24!important;border-color:#2a2f3a!important;color:#f2f4f8!important}
html body .project-nav-card.project-nav-card :is(span,strong,p){color:#f2f4f8!important}
html body .project-nav-card-media.project-nav-card-media{background-color:#1b2540!important}
html body .rm-contact-eyebrow.rm-contact-eyebrow{color:#8fb0ff!important}
html body .rm-contact-intro.rm-contact-intro :is(h1,h2){color:#f2f4f8!important}
html body .rm-contact-intro.rm-contact-intro p:not(.rm-contact-eyebrow){color:#b4bac7!important}
html body .rm-ct-pv-k.rm-ct-pv-k{color:#b4bac7!important}
html body :is(.rm-contact-form.rm-contact-form,.rm-ct-pv-card.rm-ct-pv-card){background-color:rgba(24,27,36,.9)!important;border-color:rgba(255,255,255,.12)!important;color:#f2f4f8!important}
html body .rm-ct-topic.rm-ct-topic{background-color:rgba(255,255,255,.08)!important;color:#f2f4f8!important;border-color:rgba(255,255,255,.18)!important}
html body .rm-ct-ico.rm-ct-ico{background-color:#8fb0ff!important}
html body .rm-contact-form :is(label,legend,span,p,h2,h3,small){color:#e6e9f0!important}

html body .native-project-grid li.wp-block-post.wp-block-post{background-color:#171b24!important}
@media (min-width:782px){html body .hero:is(.hero-home,.hero-cv){position:relative}
html body .hero:is(.hero-home,.hero-cv)::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(90deg,rgba(11,13,18,.96) 0%,rgba(11,13,18,.9) 38%,rgba(11,13,18,.55) 58%,rgba(11,13,18,0) 78%)}
html body .hero:is(.hero-home,.hero-cv)>.hero-inner{position:relative;z-index:1}}
html body .social-rail.social-rail,html body .social-rail.social-rail *{color:#f2f4f8!important}
html body .social-rail.social-rail a{color:#f2f4f8!important}
html body .rm-ct-pv.rm-ct-pv *{color:#d3d8e3!important}
html body .rm-ct-pv.rm-ct-pv ::placeholder{color:#9aa1b0!important}
html body :is(a,button,input,textarea,select,summary,[tabindex]):focus-visible{outline-color:#8fb0ff!important}
html body .entry-content.wp-block-post-content{box-shadow:16px 0 0 0 #0b0d12,-16px 0 0 0 #0b0d12!important}
html body .tab-panel.tab-panel{background-color:transparent!important}
html body .native-panel.native-panel{background-color:#171b24!important;border-color:rgba(255,255,255,.1)!important}
html body .native-panel :is(li,figure){background-color:rgba(0,78,255,.18)!important}
html body main .native-section .native-panel.native-panel.native-panel,html body .native-section.open-panel .native-panel.native-panel{background-color:#171b24!important;border-color:rgba(255,255,255,.1)!important}
html body main .native-panel.native-panel :is(li,figure,.native-step,[class*=step]){background-color:rgba(0,78,255,.18)!important}
html body main .native-panel.native-panel :is(p,li,span,small){color:#d3d8e3!important}
html body main .native-panel.native-panel :is(h2,h3,h4,strong){color:#f2f4f8!important}
html body main .native-panel.native-panel hr,html body main .native-panel.native-panel :is([class*=divider],[class*=note]){border-color:rgba(255,255,255,.12)!important}
html body .rm-contact-form.rm-contact-form :is(input.wpcf7-form-control,textarea.wpcf7-form-control,select.wpcf7-form-control){background-color:#1f2430!important;color:#f2f4f8!important;border-color:rgba(255,255,255,.18)!important}
html body main button[aria-label^="Proyectos"]{background-color:rgba(255,255,255,.12)!important;color:#f2f4f8!important;border-color:rgba(255,255,255,.2)!important}
html body main button[aria-label^="Proyectos"] *{color:#f2f4f8!important;stroke:#f2f4f8}
html body .native-gallery.native-gallery figure{background-color:#171b24!important}
html body form.wpcf7-form input.wpcf7-form-control:not([type=submit]):not([type=checkbox]):not([type=radio]):not([type=file]),html body .wpcf7 input[type=text],html body .wpcf7 input[type=email],html body .wpcf7 input[type=tel],html body .wpcf7 input[type=url],html body .rm-contact-form input[type=text],html body .rm-contact-form input[type=email]{background-color:#1f2430!important;color:#f2f4f8!important;border-color:rgba(255,255,255,.18)!important;-webkit-text-fill-color:#f2f4f8}
html body main button[aria-label*="rojects"],html body main button[aria-label*="royectos"]{background-color:rgba(255,255,255,.12)!important;color:#f2f4f8!important}
html body main button[aria-label*="rojects"] *,html body main button[aria-label*="royectos"] *{color:#f2f4f8!important;stroke:#f2f4f8}
html body .wpcf7-spinner::before{background-color:#8fb0ff!important}
html body main .native-section .native-panel.native-panel.native-panel,html body .native-section.open-panel .native-panel.native-panel,html body .native-section.dark .native-panel.native-panel,html body .native-panel.native-panel.native-panel{background-color:transparent!important;border-color:transparent!important;box-shadow:none!important}
html body main .native-panel.native-panel :is(ol,ul,div):not([class*=card]){background-color:transparent!important}
html body .rm-services-v3.rm-services-v3 :is(.native-hero,.native-section) p:not([class*=button]){color:#c9cfdb!important}
html body .re-section.re-tools.re-tools :is(p,li,span,small,h2,h3,h4,strong,.desc){color:#fff!important}
html body .project-gallery.project-gallery a,html body .project-native-gallery figure{background-color:#171b24!important}
html body .rm-contact-form.rm-contact-form :is(p,label,span,.wpcf7-list-item-label,.wpcf7-acceptance){color:#e6e9f0!important}
html body .rm-contact-form.rm-contact-form :is(a){color:#8fb0ff!important}
html body .rm-contact-form.rm-contact-form ::placeholder{color:#9aa1b0!important}
html body .native-gallery.native-gallery figcaption{color:#e6e9f0!important}
html body .native-gallery.native-gallery figure img{mix-blend-mode:screen!important;filter:invert(1) hue-rotate(180deg) brightness(1.1)!important}
html body .career .career-year.career-year{color:#8fb0ff!important}
html body main img[src*="/assets/images/icon-"]{filter:brightness(0) invert(1) opacity(.92)!important}
html body .wpcf7-list-item-label a,html body .rsite-rc-note a{color:#8fb0ff!important}
html body[class] .rm-contact-form .wpcf7 a,html body[class] .rm-contact-form .wpcf7 .rsite-rc-note a{color:#8fb0ff!important}
html body main .wp-block-button.is-style-outline .wp-block-button__link{color:#8fb0ff!important;border-color:#8fb0ff!important}
html body .site-header .main-nav .wp-block-navigation-item__content.rm-nav-active,html body .site-header .main-nav .wp-block-navigation-item__content.rm-nav-active .wp-block-navigation-item__label,html body .site-header .main-nav .wp-block-navigation-item:has(>.rm-nav-active){color:#8fb0ff!important}
html body .site-header .main-nav .wp-block-navigation-item:has(>.rm-nav-active) svg,html body .site-header .main-nav .wp-block-navigation-item:has(>.rm-nav-active) svg *{color:#8fb0ff!important;stroke:#8fb0ff!important}
html body .cmplz-cookiebanner.cmplz-cookiebanner{background:rgba(22,24,30,.94)!important;color:#e6e9f0!important;border:1px solid rgba(255,255,255,.14)!important;box-shadow:0 12px 40px rgba(0,0,0,.6)!important}
html body .cmplz-cookiebanner :is(.cmplz-message,.cmplz-description,.cmplz-title,.cmplz-category-title,.cmplz-header,.cmplz-body,p,span,label,h2,h3){color:#e6e9f0!important}
html body .cmplz-cookiebanner :is(a,.cmplz-link){color:#8fb0ff!important}
html body .cmplz-cookiebanner .cmplz-btn.cmplz-accept,html body .cmplz-cookiebanner .cmplz-btn.cmplz-save-preferences{background:#004eff!important;border-color:#004eff!important;color:#fff!important}
html body .cmplz-cookiebanner .cmplz-btn.cmplz-deny,html body .cmplz-cookiebanner .cmplz-btn.cmplz-view-preferences{background:transparent!important;border:1px solid rgba(255,255,255,.4)!important;color:#e6e9f0!important}
html body .cmplz-cookiebanner .cmplz-divider{background:rgba(255,255,255,.14)!important}
html body .cmplz-cookiebanner .cmplz-close svg{fill:#e6e9f0!important}
html body .cmplz-cookiebanner .cmplz-categories .cmplz-category{background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:10px!important}
html body .cmplz-cookiebanner .cmplz-categories .cmplz-category :is(summary,.cmplz-category-header,.cmplz-category-title,.cmplz-always-active,.cmplz-description-categories,.cmplz-description){background:transparent!important;color:#e6e9f0!important}
html body .cmplz-cookiebanner .cmplz-category-header .cmplz-icon svg,html body .cmplz-cookiebanner .cmplz-category summary svg{fill:#e6e9f0!important;stroke:#e6e9f0!important}
CSS
	. '}</style>' . "\n";
}, 999 );
