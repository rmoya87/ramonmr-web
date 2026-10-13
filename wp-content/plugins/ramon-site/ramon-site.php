<?php
/**
 * Plugin Name: Ramon Site
 * Description: Funciones propias de ramonmr.com en un solo plugin, con modulos activables y pagina de ajustes (Ajustes > Ramon Site). Rollback: desactivar y reactivar los plugins antiguos.
 * Version: 1.1.2
 * Author: ramonmr.com
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RSITE_DIR', plugin_dir_path( __FILE__ ) );

/** Ajustes de seguridad (valores por defecto = comportamiento anterior). */
function rsite_sec( $key ) {
	$d = array(
		'headers'      => 1,
		'xmlrpc'       => 1,
		'anon'         => 1,
		'hsts'         => 1,
		'hsts_age'     => 300,
		'hsts_sub'     => 0,
		'hsts_preload' => 0,
		'csp'          => 'report',
	);
	$o = get_option( 'rsite_security', array() );
	return ( is_array( $o ) && isset( $o[ $key ] ) ) ? $o[ $key ] : $d[ $key ];
}

/** Ajustes del hero del blog. */
function rsite_hero( $key ) {
	$d = array( 'slides' => 5, 'ms' => 3000 );
	$o = get_option( 'rsite_hero', array() );
	$v = ( is_array( $o ) && isset( $o[ $key ] ) ) ? (int) $o[ $key ] : $d[ $key ];
	if ( 'slides' === $key ) {
		return max( 1, min( 10, $v ) );
	}
	return max( 1500, min( 15000, $v ) );
}

/**
 * Modulos: slug => array( titulo, descripcion, plugin antiguo equivalente ).
 */
function rsite_modules() {
	return array(
		'security'       => array( 'Seguridad', 'Cabeceras de seguridad, XML-RPC y restricción de enumeración anónima.', 'ramon-security/ramon-security.php' ),
		'i18n'           => array( 'Idiomas ES/EN', 'Capa de idioma sobre Polylang: textos fijos, enlaces entre idiomas y selector.', 'ramon-i18n/ramon-i18n.php' ),
		'external-links' => array( 'Enlaces externos', 'Abre en pestaña nueva los enlaces externos y a ficheros.', 'ramon-external-links/ramon-external-links.php' ),
		'header-stable'  => array( 'Cabecera estable', 'Sirve la cabecera ya en estado compacto desde el HTML.', 'ramon-header-stable/ramon-header-stable.php' ),
		'workshop'       => array( 'En el taller', 'Sección "En el taller" del blog: entradas no publicadas con etapa y progreso (panel en cada entrada).', '' ),
		'recaptcha'      => array( 'reCAPTCHA discreto', 'Oculta el distintivo de reCAPTCHA y muestra el aviso legal de Google bajo el botón de los formularios.', '' ),
		'consent'        => array( 'Consentimiento de cookies', 'Oculta la pestaña flotante de Complianz; «Administrar consentimiento» es un enlace en el pie.', '' ),
		'perf'           => array( 'Rendimiento', 'Tamaños correctos (sizes) en las miniaturas de las tarjetas de proyectos y noticias para servir variantes más ligeras.', '' ),
		'dark'           => array( 'Modo oscuro', 'Modo oscuro automático: se activa solo en los dispositivos de quien visita la web que usan el tema oscuro del sistema. No hay interruptor para el visitante. Desactívalo aquí para volver siempre al tema claro.', '' ),
		'a11y'           => array( 'Accesibilidad AA', 'Contraste, foco visible, objetivos táctiles y ajustes de movimiento (WCAG 2.2 AA).', '' ),
		'posts'          => array( 'Módulo entradas del blog', 'Lectura más cómoda, entradas relacionadas «Para seguir tirando del hilo» y comentarios ocultos.', '' ),
		'cta'            => array( 'Módulo «Hablemos de tu proyecto»', 'Rediseño del bloque final de contacto en las páginas de servicios y en la home.', '' ),
		'footer'         => array( 'Pie de página', 'Estilo del pie: filas La web y Servicios y barra legal.', '' ),
		'projects'       => array( 'Ficha de proyecto', 'Título y datos del proyecto sobre la imagen principal, datos en una fila e imagen completa sin recorte.', '' ),
		'blog-hero'      => array( 'Blog: hero, temas y cafés', 'Hero del blog, barra de temas y filtro por tiempo de lectura.', 'ramon-blog-hero/ramon-blog-hero.php' ),
	);
}

function rsite_enabled_modules() {
	$saved = get_option( 'rsite_modules', null );
	$out   = array();
	foreach ( rsite_modules() as $slug => $m ) {
		$out[ $slug ] = ( is_array( $saved ) && array_key_exists( $slug, $saved ) ) ? ! empty( $saved[ $slug ] ) : ( ! is_array( $saved ) || in_array( $slug, array( 'recaptcha', 'consent', 'a11y', 'footer', 'cta', 'posts', 'perf', 'projects' ), true ) );
	}
	return $out;
}

/**
 * Carga cada modulo activado, salvo que su plugin antiguo siga activo
 * (evita declarar dos veces el mismo codigo).
 */
function rsite_load_modules() {
	$active  = (array) get_option( 'active_plugins', array() );
	$enabled = rsite_enabled_modules();
	$GLOBALS['rsite_skipped'] = array();
	foreach ( rsite_modules() as $slug => $m ) {
		if ( empty( $enabled[ $slug ] ) ) {
			continue;
		}
		if ( in_array( $m[2], $active, true ) ) {
			$GLOBALS['rsite_skipped'][] = $slug;
			continue;
		}
		$file = RSITE_DIR . 'modules/' . $slug . '.php';
		if ( file_exists( $file ) ) {
			try {
				require_once $file;
			} catch ( \Throwable $e ) {
				error_log( 'Ramon Site: modulo ' . $slug . ' no se pudo cargar: ' . $e->getMessage() );
			}
		}
	}
}
// Si el modulo «En el taller» esta desactivado, el shortcode no debe mostrarse como texto suelto.
add_shortcode( 'rsite_workshop', '__return_empty_string' );
rsite_load_modules();

// Pestanas Rendimiento y Textos por idioma. Un fallo aqui no debe tumbar el sitio.
foreach ( array( 'performance', 'texts' ) as $rsite_inc ) {
	$rsite_file = RSITE_DIR . 'includes/' . $rsite_inc . '.php';
	if ( file_exists( $rsite_file ) ) {
		try {
			require_once $rsite_file;
		} catch ( \Throwable $e ) {
			error_log( 'Ramon Site: ' . $rsite_inc . ' no se pudo cargar: ' . $e->getMessage() );
		}
	}
}

if ( is_admin() ) {
	add_action( 'admin_menu', function () {
		add_options_page( 'Ramon Site', 'Ramon Site', 'manage_options', 'ramon-site', 'rsite_render_page' );
	} );
	add_action( 'admin_init', function () {
		register_setting( 'rsite_general', 'rsite_modules', array(
			'type'              => 'array',
			'sanitize_callback' => function ( $in ) {
				$in  = is_array( $in ) ? $in : array();
				$out = array();
				foreach ( rsite_modules() as $slug => $m ) {
					$out[ $slug ] = ! empty( $in[ $slug ] ) ? 1 : 0;
				}
				return $out;
			},
		) );
		register_setting( 'rsite_blog', 'rsite_hero', array(
			'type'              => 'array',
			'sanitize_callback' => function ( $in ) {
				$in = is_array( $in ) ? $in : array();
				return array(
					'slides' => max( 1, min( 10, (int) ( isset( $in['slides'] ) ? $in['slides'] : 5 ) ) ),
					'ms'     => max( 1500, min( 15000, (int) ( isset( $in['ms'] ) ? $in['ms'] : 3000 ) ) ),
				);
			},
		) );
		register_setting( 'rsite_security', 'rsite_security', array(
			'type'              => 'array',
			'sanitize_callback' => function ( $in ) {
				$in   = is_array( $in ) ? $in : array();
				$ages = array( 300, 86400, 2592000, 15552000, 31536000, 63072000 );
				$age  = (int) ( isset( $in['hsts_age'] ) ? $in['hsts_age'] : 300 );
				if ( ! in_array( $age, $ages, true ) ) {
					$age = 300;
				}
				$csp = isset( $in['csp'] ) ? $in['csp'] : 'report';
				if ( ! in_array( $csp, array( 'off', 'report', 'enforce' ), true ) ) {
					$csp = 'report';
				}
				$sub = ! empty( $in['hsts_sub'] ) ? 1 : 0;
				return array(
					'headers'      => ! empty( $in['headers'] ) ? 1 : 0,
					'xmlrpc'       => ! empty( $in['xmlrpc'] ) ? 1 : 0,
					'anon'         => ! empty( $in['anon'] ) ? 1 : 0,
					'hsts'         => ! empty( $in['hsts'] ) ? 1 : 0,
					'hsts_age'     => $age,
					'hsts_sub'     => $sub,
					'hsts_preload' => ( $sub && ! empty( $in['hsts_preload'] ) && $age >= 31536000 ) ? 1 : 0,
					'csp'          => $csp,
				);
			},
		) );
	} );
	add_action( 'admin_notices', function () {
		if ( empty( $GLOBALS['rsite_skipped'] ) ) {
			return;
		}
		echo '<div class="notice notice-warning"><p><strong>Ramon Site:</strong> estos módulos no se cargan porque su plugin antiguo sigue activo: ' . esc_html( implode( ', ', $GLOBALS['rsite_skipped'] ) ) . '. Desactiva el plugin antiguo para que lo use Ramon Site.</p></div>';
	} );
}

function rsite_tabs() {
	return array(
		'general'  => 'General',
		'security' => 'Seguridad',
		'blog'     => 'Blog',
		'perf'     => 'Rendimiento',
		'texts'    => 'Textos por idioma',
	);
}

function rsite_tab_info( $slug, $text ) {
	$enabled = rsite_enabled_modules();
	$state   = ! empty( $enabled[ $slug ] ) ? 'activado' : 'desactivado';
	echo '<p>Módulo <strong>' . esc_html( $state ) . '</strong> (se cambia en la pestaña General). ' . esc_html( $text ) . '</p>';
}

function rsite_render_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$tabs = rsite_tabs();
	$tab  = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'general'; // phpcs:ignore WordPress.Security.NonceVerification
	if ( ! isset( $tabs[ $tab ] ) ) {
		$tab = 'general';
	}
	$enabled = rsite_enabled_modules();
	echo '<div class="wrap"><h1>Ramon Site</h1>';
	settings_errors();
	echo '<nav class="nav-tab-wrapper">';
	foreach ( $tabs as $k => $label ) {
		echo '<a href="' . esc_url( admin_url( 'options-general.php?page=ramon-site&tab=' . $k ) ) . '" class="nav-tab' . ( $tab === $k ? ' nav-tab-active' : '' ) . '">' . esc_html( $label ) . '</a>';
	}
	echo '</nav>';

	if ( 'general' === $tab ) {
		echo '<form method="post" action="options.php">';
		settings_fields( 'rsite_general' );
		echo '<h2>Módulos</h2><p>Activa o desactiva cada función. Los cambios se aplican al guardar.</p><table class="form-table" role="presentation">';
		foreach ( rsite_modules() as $slug => $m ) {
			echo '<tr><th scope="row">' . esc_html( $m[0] ) . '</th><td><label><input type="checkbox" name="rsite_modules[' . esc_attr( $slug ) . ']" value="1"' . checked( ! empty( $enabled[ $slug ] ), true, false ) . '> Activado</label><p class="description">' . esc_html( $m[1] ) . '</p></td></tr>';
		}
		echo '</table>';
		echo '<h3>Qué hace cada módulo sin opciones</h3><ul style="list-style:disc;margin-left:20px"><li><strong>Idiomas ES/EN:</strong> traduce los textos fijos del tema, enlaza ES/EN y pone el selector de idioma. Las traducciones de entradas y páginas se gestionan en Polylang.</li><li><strong>Enlaces externos:</strong> abre en pestaña nueva los enlaces externos y a ficheros (PDF, ZIP...). Para excluir un enlace concreto, añade el atributo data-ramon-keep-target.</li><li><strong>Cabecera estable:</strong> sirve la cabecera ya compacta desde el HTML para que no se reconstruya con animación en cada página.</li></ul>';
		submit_button( 'Guardar módulos' );
		echo '</form>';
	} elseif ( 'security' === $tab ) {
		rsite_tab_info( 'security', 'Con los valores por defecto la web se comporta como antes.' );
		echo '<form method="post" action="options.php">';
		settings_fields( 'rsite_security' );
		echo '<table class="form-table" role="presentation">';
		$chk = function ( $k, $label, $desc ) {
			echo '<tr><th scope="row">' . esc_html( $label ) . '</th><td><label><input type="checkbox" name="rsite_security[' . esc_attr( $k ) . ']" value="1"' . checked( ! empty( rsite_sec( $k ) ), true, false ) . '> Activado</label><p class="description">' . esc_html( $desc ) . '</p></td></tr>';
		};
		$chk( 'headers', 'Cabeceras de seguridad', 'X-Content-Type-Options y Referrer-Policy. Desmarcar equivale al antiguo rollback de cabeceras.' );
		$chk( 'xmlrpc', 'Bloquear XML-RPC', 'Bloquea xmlrpc.php y quita la cabecera X-Pingback.' );
		$chk( 'anon', 'Ocultar usuarios a visitantes', 'Bloquea /wp/v2/users y ?author=N para visitantes sin sesión.' );
		$chk( 'hsts', 'HSTS', 'Obliga al navegador a usar siempre HTTPS durante el tiempo elegido.' );
		$ages = array( 300 => '5 minutos (prueba, valor actual)', 86400 => '1 día', 2592000 => '30 días', 15552000 => '6 meses', 31536000 => '1 año', 63072000 => '2 años' );
		echo '<tr><th scope="row"><label for="rsite_hsts_age">Duración de HSTS</label></th><td><select id="rsite_hsts_age" name="rsite_security[hsts_age]">';
		foreach ( $ages as $sec => $lab ) {
			echo '<option value="' . esc_attr( $sec ) . '"' . selected( (int) rsite_sec( 'hsts_age' ), $sec, false ) . '>' . esc_html( $lab ) . '</option>';
		}
		echo '</select><p class="description"><strong>Aviso:</strong> 5 minutos es solo un valor de prueba. Subirlo hace que los navegadores que ya visitaron la web se nieguen a abrirla sin HTTPS durante ese tiempo, y no se puede deshacer antes de que caduque. Sube la duración por pasos y solo si todo el sitio (y los subdominios, si los incluyes) funciona bien con HTTPS.</p></td></tr>';
		$chk( 'hsts_sub', 'HSTS: incluir subdominios', 'Añade includeSubDomains. Afecta a TODOS los subdominios de ramonmr.com: actívalo solo si todos tienen HTTPS.' );
		$chk( 'hsts_preload', 'HSTS: preload', 'Solo se aplica con subdominios y duración de 1 año o más. Entrar en la lista de precarga de los navegadores se solicita aparte y es muy difícil de revertir.' );
		echo '<tr><th scope="row"><label for="rsite_csp">Política de contenido (CSP)</label></th><td><select id="rsite_csp" name="rsite_security[csp]">';
		foreach ( array( 'report' => 'Solo informativa (Report-Only, no bloquea nada)', 'enforce' => 'Aplicar (bloquea lo que no cumpla)', 'off' => 'Desactivada' ) as $v => $lab ) {
			echo '<option value="' . esc_attr( $v ) . '"' . selected( rsite_sec( 'csp' ), $v, false ) . '>' . esc_html( $lab ) . '</option>';
		}
		echo '</select><p class="description"><strong>Aviso:</strong> al aplicar la CSP el navegador bloquea los scripts, estilos o imágenes que no cumplan la regla y puedes romper partes de la web (formularios, analítica, mapas). Prueba primero en modo informativo y vuelve a «Solo informativa» si algo falla.</p></td></tr>';
		echo '</table>';
		submit_button( 'Guardar seguridad' );
		echo '</form>';
		if ( function_exists( 'rsite_sec_theme_export_ui' ) ) {
			rsite_sec_theme_export_ui();
		}
	} elseif ( 'blog' === $tab ) {
		rsite_tab_info( 'blog-hero', 'Hero, temas y filtro de lectura del blog.' );
		echo '<form method="post" action="options.php">';
		settings_fields( 'rsite_blog' );
		echo '<table class="form-table" role="presentation">';
		echo '<tr><th scope="row"><label for="rsite_h_slides">Número de ideas clave</label></th><td><input id="rsite_h_slides" type="number" min="1" max="10" name="rsite_hero[slides]" value="' . esc_attr( rsite_hero( 'slides' ) ) . '"><p class="description">Cuántas entradas recientes rotan en la tarjeta del hero (1 a 10). Por defecto 5.</p></td></tr>';
		echo '<tr><th scope="row"><label for="rsite_h_ms">Velocidad (milisegundos)</label></th><td><input id="rsite_h_ms" type="number" min="1500" max="15000" step="100" name="rsite_hero[ms]" value="' . esc_attr( rsite_hero( 'ms' ) ) . '"><p class="description">Tiempo entre cambios de idea. 3000 = 3 segundos.</p></td></tr>';
		echo '</table>';
		submit_button( 'Guardar blog' );
		echo '</form>';
		echo '<h2>En el taller</h2>';
		rsite_tab_info( 'workshop', 'Es automático: muestra todas las entradas en borrador, pendientes o programadas (solo título y etapa, nunca el contenido). Al publicar una entrada desaparece sola. Cada idioma usa su propia entrada. Si no hay ninguna, la sección no se muestra.' );
	}
	elseif ( 'perf' === $tab && function_exists( 'rsite_perf_render' ) ) {
		rsite_perf_render();
	} elseif ( 'texts' === $tab && function_exists( 'rsite_texts_render' ) ) {
		rsite_texts_render();
	}
	echo '</div>';
}

/**
 * Home: el bloque de noticias (Query Loop con clase native-news-grid) muestra
 * siempre las 3 ultimas entradas publicadas del idioma actual.
 */
add_filter( 'query_loop_block_query_vars', function ( $query, $block ) {
	$qid = isset( $block->context['queryId'] ) ? (int) $block->context['queryId'] : 0;
	if ( 1 !== $qid || ! is_front_page() ) {
		return $query;
	}
	unset( $query['post__in'], $query['post__not_in'], $query['meta_query'], $query['tax_query'], $query['s'] );
	$query['post_type']           = 'post';
	$query['post_status']         = 'publish';
	$query['posts_per_page']      = 3;
	$query['orderby']             = 'date';
	$query['order']               = 'DESC';
	$query['ignore_sticky_posts'] = true;
	$query['offset']              = 0;
	if ( function_exists( 'pll_current_language' ) ) {
		$query['lang'] = pll_current_language();
	}
	return $query;
}, 9999, 2 );

/* Tiempo de lectura automatico: guarda minutos (palabras/130) al publicar/actualizar y rellena los que falten. */
add_action( 'transition_post_status', function ( $new, $old, $post ) {
	if ( 'post' === $post->post_type && function_exists( 'rm_bh_save_minutes' ) ) {
		rm_bh_save_minutes( $post->ID );
	}
}, 20, 3 );
add_action( 'init', function () {
	if ( ! function_exists( 'rm_bh_calc_minutes' ) ) { return; }
	$ids = get_posts( array( 'post_type' => 'post', 'post_status' => array( 'publish', 'future' ), 'posts_per_page' => 50, 'fields' => 'ids', 'no_found_rows' => true, 'suppress_filters' => true,
		'meta_query' => array( array( 'key' => '_rm_read_min', 'compare' => 'NOT EXISTS' ) ) ) );
	foreach ( $ids as $id ) { update_post_meta( $id, '_rm_read_min', rm_bh_calc_minutes( $id ) ); }
}, 30 );

/* Tiempo de lectura vacio: se rellena al final del buffer (palabras/130, redondeo arriba, igual que el resto de entradas). */
add_action( 'template_redirect', function () {
	if ( is_feed() || is_admin() || ! function_exists( 'rm_bh_calc_minutes' ) ) { return; }
	$single = is_singular( 'post' ) ? get_queried_object_id() : 0;
	ob_start( function ( $html ) use ( $single ) {
		$en  = function_exists( 'pll_current_language' ) && 'en' === pll_current_language();
		$txt = function ( $pid ) use ( $en ) {
			$m = rm_bh_calc_minutes( $pid );
			return $m . ( $en ? ' min read' : ' min lectura' );
		};
		/* Tarjetas sin parrafo de lectura (el bloque se omite cuando esta vacio): se anade tras la fecha. */
		$html = preg_replace_callback( '/(<div class="wp-block-post-date[^"]*"><time[^>]*>[^<]*<\/time><\/div>)(\s*<h3[^>]*><a href="([^"]+)")/s', function ( $m ) use ( $txt ) {
			$pid = url_to_postid( $m[3] );
			if ( ! $pid ) { return $m[0]; }
			return $m[1] . '<p class="article-reading-time">' . esc_html( $txt( $pid ) ) . '</p>' . $m[2];
		}, $html );
		if ( false === strpos( $html, '<p class="article-reading-time"></p>' ) ) { return $html; }
		if ( $single ) {
			return str_replace( '<p class="article-reading-time"></p>', '<p class="article-reading-time">' . esc_html( $txt( $single ) ) . '</p>', $html );
		}
		return preg_replace_callback( '/<p class="article-reading-time"><\/p>(.{0,1500}?)<a href="([^"]+)"/s', function ( $m ) use ( $txt ) {
			$pid = url_to_postid( $m[2] );
			if ( ! $pid ) { return $m[0]; }
			return '<p class="article-reading-time">' . esc_html( $txt( $pid ) ) . '</p>' . $m[1] . '<a href="' . $m[2] . '"';
		}, $html );
	} );
}, 0 );

/* Al publicar, despublicar o editar una entrada publicada: invalida solo las URLs afectadas en WP Super Cache (portadas, blog, categorias y sus paginas). No cambia la configuracion global de cache. */
add_action( 'transition_post_status', function ( $new, $old, $post ) {
	if ( 'post' !== $post->post_type || ( 'publish' !== $new && 'publish' !== $old ) || ! function_exists( 'wpsc_delete_url_cache' ) ) {
		return;
	}
	$ids = function_exists( 'pll_get_post_translations' ) ? array_values( (array) pll_get_post_translations( $post->ID ) ) : array();
	$ids[] = $post->ID;
	$urls  = array( home_url( '/' ), home_url( '/blog/' ), home_url( '/en/' ), home_url( '/en/articles/' ) );
	if ( function_exists( 'pll_languages_list' ) && function_exists( 'pll_home_url' ) ) {
		foreach ( (array) pll_languages_list() as $l ) { $urls[] = pll_home_url( $l ); }
	}
	foreach ( array_unique( array_map( 'intval', $ids ) ) as $id ) {
		$urls[] = get_permalink( $id );
		foreach ( (array) get_the_category( $id ) as $c ) {
			$l = get_term_link( $c );
			if ( ! is_wp_error( $l ) ) { $urls[] = $l; }
		}
	}
	foreach ( array_unique( array_filter( $urls ) ) as $u ) {
		$u = trailingslashit( $u );
		wpsc_delete_url_cache( $u );
		for ( $n = 2; $n <= 5; $n++ ) {
			if ( false !== strpos( $u, '/blog/' ) || false !== strpos( $u, '/articles/' ) || false !== strpos( $u, 'category' ) ) { wpsc_delete_url_cache( $u . 'page/' . $n . '/' ); }
		}
	}
}, 99, 3 );

