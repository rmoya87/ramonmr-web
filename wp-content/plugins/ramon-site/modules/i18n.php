<?php
/** Modulo de Ramon Site. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function ri_lang() {
	return function_exists( 'pll_current_language' ) ? pll_current_language() : '';
}

function ri_dict_exact() {
	return array(
		'Servicios' => 'Services', 'Marketing digital' => 'Digital marketing', 'Marketing Digital' => 'Digital marketing',
		'Diseño de producto' => 'Product design', 'Necesidades de negocio' => 'Business needs', 'Soluciones digitales' => 'Digital solutions', 'Curriculum' => 'CV',
		'Marketing online' => 'Online marketing', 'Negocio online' => 'Online business',
		'Contáctame' => 'Contact me', 'Contáctame →' => 'Contact me →',
		'SOBRE MI' => 'ABOUT ME', 'SERVICIOS' => 'SERVICES', 'Suscribete' => 'Subscribe', 'Síguenos' => 'Follow us',
		'Todos los derechos reservados.' => 'All rights reserved.', 'LA WEB' => 'THE SITE', 'Privacidad' => 'Privacy', 'Cookies' => 'Cookies', 'Aviso legal' => 'Legal notice', 'Sígueme' => 'Follow me', 'LinkedIn (se abre en una pestaña nueva)' => 'LinkedIn (opens in a new tab)', 'X (se abre en una pestaña nueva)' => 'X (opens in a new tab)',
		'Política de privacidad' => 'Privacy policy', 'Política de Privacidad' => 'Privacy Policy', 'Política de cookies' => 'Cookie policy',
		'Tu email' => 'Your email', 'Subscríbete' => 'Subscribe', 'He leído y acepto la' => 'I have read and accept the',
		'Saltar al contenido' => 'Skip to content', 'Abrir el menú' => 'Open menu', 'Cerrar el menú' => 'Close menu',
		'Submenú de Blog' => 'Blog submenu', 'Submenú de Servicios' => 'Services submenu',
		'Leer más →' => 'Read more →', 'Ver más →' => 'See more →', 'Menos de un minuto' => 'Less than a minute', 'Tiempo de lectura' => 'Reading time',
		'Servicio' => 'Service', 'Proyecto' => 'Project', 'Paginación' => 'Pagination', 'Siguiente' => 'Next', 'Página siguiente' => 'Next page', 'Anterior' => 'Previous',
		'Entradas relacionadas' => 'Related posts', 'Publicado' => 'Published', 'Autor' => 'Author', 'Puntuación SEO' => 'SEO score',
		'Inicio' => 'Home', 'Categoría' => 'Category', 'Temas' => 'Topics', 'El blog' => 'The blog', 'En el taller' => 'In the workshop', 'Lo que estoy preparando' => 'What I am working on', 'En preparación' => 'In preparation', 'Siguiente' => 'Next', 'Anterior' => 'Previous', 'Paginación' => 'Pagination',
		'Antes de publicarlos pasan por aquí: ideas a medias que quiero dejar bien contadas. No prometo fechas, solo que irán saliendo.' => 'Before they are published they pass through here: half-formed ideas I want to tell properly. I am not promising dates, only that they will keep coming out.',
		'Encuentra artículos interesantes sobre marketing online, diseño de producto o como mejorar tu negocio online.' => 'Find interesting articles about online marketing, product design or how to improve your online business.',
		'Accesibilidad digital: de requisito legal a decisión de producto' => 'Digital accessibility: from legal requirement to product decision',
		'Aparecer en las respuestas de IA de Google: lo que Google dice y lo que no' => 'Showing up in Google\'s AI answers: what Google says and what it doesn\'t',
		'El AI Act no se ha aplazado entero: qué debe revisar quien gestiona un equipo' => 'The AI Act has not been postponed entirely: what a team manager should review',
		'Aceptar cookies' => 'Accept cookies', 'Acepto' => 'Accept', 'Aceptar' => 'Accept', 'Denegado' => 'Deny', 'Ver preferencias' => 'View preferences',
		'Administrar consentimiento' => 'Manage consent', 'Administrar opciones' => 'Manage options', 'Gestionar los servicios' => 'Manage services',
		'Gestionar {vendor_count} proveedores' => 'Manage {vendor_count} vendors', 'Guardar preferencias' => 'Save preferences',
		'Leer más sobre estos propósitos' => 'Read more about these purposes', 'Necesarias' => 'Necessary', 'Preferencias' => 'Preferences',
		'Estadísticas' => 'Statistics', 'Siempre activo' => 'Always active', 'Gestionar el Consentimiento de las Cookies' => 'Manage Cookie Consent',
		'Utilizamos cookies para optimizar nuestro sitio web y nuestro servicio.' => 'We use cookies to optimize our website and our service.',
		'El almacenamiento o acceso técnico es estrictamente necesario para el propósito legítimo de permitir el uso de un servicio específico explícitamente solicitado por el abonado o usuario, o con el único propósito de llevar a cabo la transmisión de una comunicación a través de una red de comunicaciones electrónicas.' => 'The technical storage or access is strictly necessary for the legitimate purpose of enabling the use of a specific service explicitly requested by the subscriber or user, or for the sole purpose of carrying out the transmission of a communication over an electronic communications network.',
		'El almacenamiento o acceso técnico es necesario para crear perfiles de usuario para enviar publicidad, o para rastrear al usuario en un sitio web o en varios sitios web con fines de marketing similares.' => 'The technical storage or access is required to create user profiles to send advertising, or to track the user on a website or across several websites for similar marketing purposes.',
		'El almacenamiento o acceso técnico es necesario para la finalidad legítima de almacenar preferencias no solicitadas por el abonado o usuario.' => 'The technical storage or access is necessary for the legitimate purpose of storing preferences that are not requested by the subscriber or user.',
		'El almacenamiento o acceso técnico que es utilizado exclusivamente con fines estadísticos anónimos. Sin una requerimiento, el cumplimiento voluntario por parte de su proveedor de servicios de Internet, o los registros adicionales de un tercero, la información almacenada o recuperada sólo para este propósito no se puede utilizar para identificarlo.' => 'The technical storage or access that is used exclusively for anonymous statistical purposes. Without a subpoena, voluntary compliance on the part of your Internet Service Provider, or additional records from a third party, information stored or retrieved for this purpose alone cannot usually be used to identify you.',
		'El almacenamiento o acceso técnico que es utilizado exclusivamente con fines estadísticos.' => 'The technical storage or access that is used exclusively for statistical purposes.',
		'Ramón de Moya' => 'Ramón de Moya',
		'Proyecto anterior' => 'Previous project', 'Proyecto siguiente' => 'Next project',
	);
}

function ri_default_lang() {
	$d = function_exists( 'pll_default_language' ) ? pll_default_language() : '';
	return $d ? $d : 'es';
}

/** Diccionario de un idioma: clave (texto original) => texto mostrado. Fabrica (ingles) mas lo guardado en Ajustes > Ramon Site > Textos por idioma. En el idioma principal solo hay lo guardado. */
function ri_dict_for( $lang ) {
	$dict = ( 'en' === $lang ) ? ri_dict_exact() : array();
	$o    = get_option( 'rsite_texts', array() );
	if ( is_array( $o ) && ! empty( $o[ $lang ] ) && is_array( $o[ $lang ] ) ) {
		foreach ( $o[ $lang ] as $src => $tr ) {
			if ( is_string( $tr ) && '' !== $tr ) { $dict[ $src ] = $tr; }
		}
	}
	return $dict;
}

function ri_translate_text_nodes( $html, $dict, $lang = 'en' ) {
	$html = preg_replace_callback( '/>([^<>]+)</u', function ( $m ) use ( $dict, $lang ) {
		$raw = $m[1];
		$t   = trim( html_entity_decode( $raw, ENT_QUOTES, 'UTF-8' ) );
		$t   = preg_replace( '/\x{00a0}/u', ' ', $t );
		if ( $t === '' ) { return $m[0]; }
		if ( isset( $dict[ $t ] ) ) {
			return '>' . str_replace( trim( $raw ), esc_html( $dict[ $t ] ), $raw ) . '<';
		}
		if ( 'en' === $lang && preg_match( '/^(\d+) min lectura$/u', $t, $x ) ) { return '>' . $x[1] . ' min read<'; }
		if ( 'en' === $lang && preg_match( '/^(\d+) comentarios?$/u', $t, $x ) ) { return '>' . $x[1] . ( $x[1] == 1 ? ' comment' : ' comments' ) . '<'; }
		if ( 'en' === $lang && preg_match( '/^(\d{2}\/\d{2}\/\d{4}) a las (.+)$/u', $t, $x ) ) { return '>' . $x[1] . ' at ' . $x[2] . '<'; }
		return $m[0];
	}, $html );
	$html = preg_replace_callback( '/\b(placeholder|aria-label|title|value)="([^"]*)"/u', function ( $m ) use ( $dict ) {
		$t = html_entity_decode( $m[2], ENT_QUOTES, 'UTF-8' );
		if ( isset( $dict[ $t ] ) ) { return $m[1] . '="' . esc_attr( $dict[ $t ] ) . '"'; }
		return $m[0];
	}, $html );
	return $html;
}

function ri_term_by_path( $path ) {
	$parts = array_values( array_filter( explode( '/', trim( $path, '/' ) ) ) );
	if ( count( $parts ) >= 1 && $parts[0] === 'blog' ) {
		if ( count( $parts ) === 1 ) { $slug = 'blog'; } else { $slug = $parts[1]; }
		$term = get_term_by( 'slug', $slug, 'category' );
		if ( $term && function_exists( 'pll_get_term' ) ) {
			$en = pll_get_term( $term->term_id, 'en' );
			if ( $en ) {
				$l = get_term_link( (int) $en, 'category' );
				if ( ! is_wp_error( $l ) ) { return $l; }
			}
		}
	}
	return '';
}

function ri_map_url( $url ) {
	$home = untrailingslashit( home_url() );
	$path = '';
	if ( strpos( $url, $home ) === 0 ) { $path = substr( $url, strlen( $home ) ); }
	elseif ( isset( $url[0] ) && $url[0] === '/' && substr( $url, 0, 2 ) !== '//' ) { $path = $url; }
	else { return $url; }
	$frag = '';
	if ( ( $p = strpos( $path, '#' ) ) !== false ) { $frag = substr( $path, $p ); $path = substr( $path, 0, $p ); }
	$qs = '';
	if ( ( $p = strpos( $path, '?' ) ) !== false ) { $qs = substr( $path, $p ); $path = substr( $path, 0, $p ); }
	if ( $path === '' || $path === '/' ) { return pll_home_url( 'en' ) . $frag; }
	if ( strpos( $path, '/en/' ) === 0 || strpos( $path, '/wp-' ) === 0 || strpos( $path, '/feed' ) === 0 || preg_match( '/\.(pdf|jpg|jpeg|png|webp|gif|svg|zip|xml|css|js)$/i', $path ) ) { return $url; }
	$cache = wp_cache_get( 'ri_map_' . $path, 'ri' );
	if ( $cache !== false ) { return $cache === '' ? $url : $cache . $qs . $frag; }
	$out = '';
	$id  = ( rtrim( $path, '/' ) === '/portfolio' ) ? 249 : url_to_postid( home_url( $path ) );
	if ( $id ) {
		$en = pll_get_post( $id, 'en' );
		if ( $en && get_post_status( $en ) === 'publish' ) { $out = get_permalink( $en ); }
		elseif ( $en && current_user_can( 'edit_posts' ) ) { $out = get_permalink( $en ); }
	} else {
		$out = ri_term_by_path( $path );
	}
	wp_cache_set( 'ri_map_' . $path, $out, 'ri' );
	return $out === '' ? $url : $out . $qs . $frag;
}

function ri_translate_links( $html ) {
	return preg_replace_callback( '/\bhref="([^"]+)"/u', function ( $m ) {
		$u = html_entity_decode( $m[1], ENT_QUOTES, 'UTF-8' );
		$n = ri_map_url( $u );
		if ( $n === $u ) { return $m[0]; }
		return 'href="' . esc_url( $n ) . '"';
	}, $html );
}

function ri_switcher_url( $slug ) {
	if ( ! function_exists( 'pll_the_languages' ) ) { return ''; }
	$langs = pll_the_languages( array( 'raw' => 1, 'hide_if_no_translation' => 0, 'force_home' => 0 ) );
	return ( is_array( $langs ) && isset( $langs[ $slug ]['url'] ) ) ? $langs[ $slug ]['url'] : '';
}

function ri_insert_switcher( $html, $cur ) {
	$other = $cur === 'en' ? 'es' : 'en';
	$url   = ri_switcher_url( $other );
	if ( ! $url && function_exists( 'pll_home_url' ) && function_exists( 'pll_get_post' ) ) {
		$front = (int) get_option( 'page_on_front' );
		$cp    = $cur === 'es' ? pll_get_post( $front, $other ) : $front;
		if ( $cp && get_post_status( $cp ) === 'publish' ) { $url = pll_home_url( $other ); }
	}
	if ( ! $url ) { return $html; }
	$label = $other === 'en' ? 'English' : 'Español';
	$link  = '<a class="lang-switch" href="' . esc_url( $url ) . '" hreflang="' . $other . '" lang="' . $other . '" data-ri-lang="' . $other . '">' . $label . '</a>';
	$fs    = strpos( $html, '<footer' );
	if ( $fs === false ) { return $html; }
	$head = substr( $html, 0, $fs );
	$foot = substr( $html, $fs );
	$foot = preg_replace( '/(<a [^>]*>\s*(?:Contáctame|Contact me)\s*<\/a>)/u', '$1' . str_replace( '$', '\\$', $link ), $foot, 1 );
	return $head . $foot;
}

function ri_filter_output( $html ) {
	if ( strpos( $html, '<html' ) === false ) { return $html; }
	$cur = ri_lang();
	if ( ! $cur ) { return $html; }
	$bp = strpos( $html, '<body' );
	$dict = ri_dict_for( $cur );
	if ( ( $cur !== ri_default_lang() || $dict ) && $bp !== false ) {
		$head = substr( $html, 0, $bp );
		$body = substr( $html, $bp );
		if ( $cur === 'en' ) { $body = ri_translate_links( $body ); }
		$body = ri_translate_text_nodes( $body, $dict, $cur );
		$html = $head . $body;
	}
	if ( $bp !== false ) {
		$hd = substr( $html, 0, $bp );
		if ( strpos( $hd, 'hreflang="x-default"' ) === false ) {
			$hd = preg_replace( '#(<link rel="alternate" href="([^"]+)" hreflang="es" />)#', '$1' . "\n" . '<link rel="alternate" href="$2" hreflang="x-default" />', $hd, 1 );
			$html = $hd . substr( $html, $bp );
		}
	}
	if ( $cur === 'en' ) {
		$bp2 = strpos( $html, '<body' );
		if ( $bp2 !== false ) {
			$html = substr( $html, 0, $bp2 ) . preg_replace( '#href="(?:https://ramonmr\.com)?/blog/?"#', 'href="https://ramonmr.com/en/articles/"', substr( $html, $bp2 ) );
		}
	}
	{ $html = preg_replace( '#(<img[^>]*class="project-nav-card-img[^"]*"[^>]*?) alt="[^"]*"#', '$1 alt=""', $html ); }
	$html = ri_insert_switcher( $html, $cur );
	return $html;
}

add_action( 'template_redirect', function () {
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || is_feed() ) { return; }
	ob_start( 'ri_filter_output' );
}, 1 );

// Formulario de contacto: en EN usar el formulario en ingles.
add_filter( 'pre_do_shortcode_tag', function ( $out, $tag, $attr ) {
	if ( $tag !== 'contact-form-7' || ri_lang() !== 'en' ) { return $out; }
	$id = isset( $attr['id'] ) ? (string) $attr['id'] : '';
	if ( $id !== 'a093440' && $id !== '469' ) { return $out; }
	$forms = get_posts( array( 'post_type' => 'wpcf7_contact_form', 'title' => 'Formulario contacto inglés', 'numberposts' => 1, 'post_status' => 'publish' ) );
	if ( empty( $forms ) ) { return $out; }
	return do_shortcode( '[contact-form-7 id="' . (int) $forms[0]->ID . '"]' );
}, 10, 3 );

// Complianz: en EN no forzar los textos en espanol del tema.
add_filter( 'gettext', function ( $translated, $text, $domain ) {
	if ( $domain === 'complianz-gdpr' && ri_lang() === 'en' ) { return $text; }
	return $translated;
}, 999, 3 );

// Preferencia de idioma: guarda la eleccion manual y, en la primera visita, sugiere idioma segun el navegador.
add_action( 'wp_head', function () {
	$cur = ri_lang();
	if ( ! $cur ) { return; }
	?>
<script>(function(){try{
var KEY='ri_lang';
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-ri-lang]');if(a){try{localStorage.setItem(KEY,a.getAttribute('data-ri-lang'))}catch(x){}}},true);
var ua=navigator.userAgent||'';
if(/bot|crawl|spider|slurp|lighthouse|pagespeed|headless|preview|facebookexternalhit|embedly|quora|pinterest|whatsapp|telegram|monitor|curl|wget/i.test(ua))return;
if(navigator.webdriver)return;
var chosen=null;try{chosen=localStorage.getItem(KEY)}catch(x){}
if(chosen)return;
var ref=document.referrer||'';if(ref&&ref.indexOf(location.host)>-1)return;
if(location.search.indexOf('ri_noredirect')>-1)return;
var langs=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||navigator.userLanguage||''];
var first=(langs[0]||'').toLowerCase();
var want=(first.indexOf('es')===0)?'es':'en';
var cur=document.documentElement.getAttribute('lang')||'';cur=(cur.toLowerCase().indexOf('es')===0)?'es':'en';
if(want===cur){try{localStorage.setItem(KEY,cur)}catch(x){}return}
var alt=document.querySelector('link[rel="alternate"][hreflang^="'+want+'"]');
if(!alt||!alt.href||alt.href===location.href)return;
try{localStorage.setItem(KEY,want)}catch(x){}
location.replace(alt.href);
}catch(e){}})();</script>
	<?php
}, 1 );

// 301: /en/portfolio/ -> /en/projects/ (la URL EN real del portfolio).
add_action( 'plugins_loaded', function () {
	$p = isset( $_SERVER['REQUEST_URI'] ) ? strtok( $_SERVER['REQUEST_URI'], '?' ) : '';
	if ( rtrim( $p, '/' ) === '/en/portfolio' ) {
		wp_redirect( home_url( '/en/projects/' ), 301 );
		exit;
	}
}, 1 );



