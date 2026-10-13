<?php
/** Ramon Site: pestana Rendimiento (CSS/JS minificado o legible, assets de formularios, WebP, cache). */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Valores por defecto = comportamiento anterior a esta pestana. */
function rsite_perf( $key ) {
	$d = array( 'min_css' => 1, 'min_js' => 1, 'forms' => 1, 'form_paths' => '', 'excl_webp' => '', 'excl_min' => '' );
	$o = get_option( 'rsite_perf', array() );
	return ( is_array( $o ) && array_key_exists( $key, $o ) ) ? $o[ $key ] : $d[ $key ];
}

function rsite_flush_cache() {
	global $file_prefix;
	if ( function_exists( 'wp_cache_clean_cache' ) && isset( $file_prefix ) ) {
		wp_cache_clean_cache( $file_prefix, true );
		return true;
	}
	return false;
}

/** Una ruta por linea; "*" al final = prefijo. */
function rsite_perf_match( $key ) {
	$list = (string) rsite_perf( $key );
	if ( '' === trim( $list ) ) { return false; }
	$req = isset( $_SERVER['REQUEST_URI'] ) ? (string) strtok( wp_unslash( $_SERVER['REQUEST_URI'] ), '?' ) : '';
	$req = '/' . trim( $req, '/' );
	foreach ( preg_split( '/\r\n|\r|\n/', $list ) as $line ) {
		$line = trim( $line );
		if ( '' === $line ) { continue; }
		$star = ( '*' === substr( $line, -1 ) );
		$rule = '/' . trim( rtrim( $line, '*' ), '/' );
		if ( $star ? 0 === strpos( $req, $rule ) : $req === $rule ) { return true; }
	}
	return false;
}

/** Las copias legibles solo se usan si siguen siendo equivalentes al minificado vigente del tema (hash registrado en assets/js/sources.json). */
function rsite_perf_sync() {
	$j   = json_decode( (string) @file_get_contents( RSITE_DIR . 'assets/js/sources.json' ), true );
	$out = array( 'css' => false, 'header.js' => false, 'reveal.js' => false );
	if ( ! is_array( $j ) ) { return $out; }
	$f = get_theme_file_path( 'assets/site.min.css' );
	$out['css'] = isset( $j['css']['site.min.css'] ) && file_exists( $f ) && hash_file( 'sha256', $f ) === $j['css']['site.min.css'] && file_exists( get_theme_file_path( 'assets/site.css' ) );
	foreach ( array( 'header.js', 'reveal.js' ) as $n ) {
		$f = get_theme_file_path( 'assets/' . $n );
		$out[ $n ] = isset( $j['js'][ $n ] ) && file_exists( $f ) && hash_file( 'sha256', $f ) === $j['js'][ $n ];
	}
	return $out;
}

if ( ! is_admin() ) {
	add_action( 'wp_enqueue_scripts', function () {
		$sync = ( ! rsite_perf( 'min_css' ) || ! rsite_perf( 'min_js' ) ) && ! rsite_perf_match( 'excl_min' ) ? rsite_perf_sync() : array( 'css' => false, 'header.js' => false, 'reveal.js' => false );
		if ( ! rsite_perf( 'min_css' ) && $sync['css'] ) {
			$css = wp_styles()->registered;
			$f   = get_theme_file_path( 'assets/site.css' );
			if ( isset( $css['ramon-native'] ) && file_exists( $f ) ) {
				$css['ramon-native']->src = get_theme_file_uri( 'assets/site.css' );
				$css['ramon-native']->ver = (string) filemtime( $f );
			}
		}
		if ( ! rsite_perf( 'min_js' ) ) {
			$js  = wp_scripts()->registered;
			$map = array( 'ramon-native-header' => array( 'header.src.js', 'header.js' ), 'ramon-native-reveal' => array( 'reveal.src.js', 'reveal.js' ) );
			foreach ( $map as $handle => $pair ) {
				$file = $pair[0];
				$path = RSITE_DIR . 'assets/js/' . $file;
				if ( ! empty( $sync[ $pair[1] ] ) && isset( $js[ $handle ] ) && file_exists( $path ) ) {
					$js[ $handle ]->src = plugins_url( 'assets/js/' . $file, RSITE_DIR . 'ramon-site.php' );
					$js[ $handle ]->ver = (string) filemtime( $path );
				}
			}
		}
	}, 999 );

	// Rutas sin WebP: en ellas el HTML conserva las imagenes originales.
	add_filter( 'pre_option_rm_webp_on', function ( $pre ) {
		return rsite_perf_match( 'excl_webp' ) ? '0' : $pre;
	} );

	// El tema quita CSS/JS de Contact Form 7 donde no hay formulario. Aqui se puede volver a cargar en todo el sitio o en rutas concretas.
	add_action( 'wp_enqueue_scripts', function () {
		if ( rsite_perf( 'forms' ) && ! rsite_perf_match( 'form_paths' ) ) { return; }
		foreach ( array( 'contact-form-7', 'swv' ) as $h ) {
			if ( wp_style_is( $h, 'registered' ) ) { wp_enqueue_style( $h ); }
			if ( wp_script_is( $h, 'registered' ) ) { wp_enqueue_script( $h ); }
		}
	}, 120 );
}

if ( is_admin() ) {
	add_action( 'admin_init', function () {
		register_setting( 'rsite_perf_group', 'rsite_perf', array(
			'type'              => 'array',
			'sanitize_callback' => function ( $in ) {
				$in = is_array( $in ) ? $in : array();
				if ( isset( $in['webp_present'] ) ) {
					$want = ! empty( $in['webp'] ) ? '1' : '0';
					if ( get_option( 'rm_webp_on', '0' ) !== $want ) {
						update_option( 'rm_webp_on', $want, false );
					}
				}
				$lists = array();
				foreach ( array( 'form_paths', 'excl_webp', 'excl_min' ) as $k ) {
					$paths = array();
					foreach ( preg_split( '/\r\n|\r|\n/', isset( $in[ $k ] ) ? (string) $in[ $k ] : '' ) as $p ) {
						$p = trim( sanitize_text_field( $p ) );
						if ( '' !== $p && 0 === strpos( $p, '/' ) ) { $paths[] = $p; }
					}
					$lists[ $k ] = implode( "\n", array_slice( array_unique( $paths ), 0, 50 ) );
				}
				return array(
					'min_css'    => ! empty( $in['min_css'] ) ? 1 : 0,
					'min_js'     => ! empty( $in['min_js'] ) ? 1 : 0,
					'forms'      => ! empty( $in['forms'] ) ? 1 : 0,
					'form_paths' => $lists['form_paths'],
					'excl_webp'  => $lists['excl_webp'],
					'excl_min'   => $lists['excl_min'],
				);
			},
		) );
		// Tras guardar esta pestana, vaciar la cache de paginas para que el HTML use los archivos elegidos.
		if ( isset( $_GET['page'], $_GET['settings-updated'] ) && 'ramon-site' === $_GET['page'] && isset( $_GET['tab'] ) && 'perf' === $_GET['tab'] ) { // phpcs:ignore WordPress.Security.NonceVerification
			rsite_flush_cache();
		}
	} );
	add_action( 'admin_post_rsite_flush', function () {
		if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No autorizado' ); }
		check_admin_referer( 'rsite_flush' );
		$ok = rsite_flush_cache();
		wp_safe_redirect( add_query_arg( array( 'page' => 'ramon-site', 'tab' => 'perf', 'flushed' => $ok ? '1' : '0' ), admin_url( 'options-general.php' ) ) );
		exit;
	} );
}

function rsite_perf_render() {
	echo '<p>Con los valores por defecto la web se comporta como hasta ahora. Al guardar se vacía la caché de páginas.</p>';
	if ( isset( $_GET['flushed'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		echo '<div class="notice notice-' . ( '1' === $_GET['flushed'] ? 'success' : 'warning' ) . ' inline"><p>' . ( '1' === $_GET['flushed'] ? 'Caché de páginas vaciada.' : 'No se pudo vaciar la caché (WP Super Cache no responde).' ) . '</p></div>'; // phpcs:ignore WordPress.Security.NonceVerification
	}
	$sync = rsite_perf_sync();
	if ( ! $sync['css'] || ! $sync['header.js'] || ! $sync['reveal.js'] ) {
		$bad = array();
		foreach ( $sync as $n => $ok ) { if ( ! $ok ) { $bad[] = ( 'css' === $n ? 'site.css' : $n ); } }
		echo '<div class="notice notice-warning inline"><p>Las copias legibles de ' . esc_html( implode( ', ', $bad ) ) . ' ya no coinciden con el minificado vigente del tema. Mientras tanto se sirve siempre el minificado del tema; hay que regenerar la copia legible y su hash.</p></div>';
	}
	echo '<form method="post" action="options.php">';
	settings_fields( 'rsite_perf_group' );
	echo '<table class="form-table" role="presentation">';
	$row = function ( $k, $label, $desc ) {
		echo '<tr><th scope="row">' . esc_html( $label ) . '</th><td><label><input type="checkbox" name="rsite_perf[' . esc_attr( $k ) . ']" value="1"' . checked( ! empty( rsite_perf( $k ) ), true, false ) . '> Activado</label><p class="description">' . esc_html( $desc ) . '</p></td></tr>';
	};
	$row( 'min_css', 'CSS minificado', 'Usa assets/site.min.css del tema. Desmarcado carga assets/site.css, equivalente y legible, pero más pesado.' );
	$row( 'min_js', 'JS minificado', 'Usa header.js y reveal.js del tema, ya minificados. Desmarcado carga las copias legibles incluidas en este plugin (comentarios y espacios incluidos).' );
	$row( 'forms', 'Formularios solo donde hay formulario', 'El CSS y JS de Contact Form 7 solo se cargan en páginas que muestran un formulario. Desmarcado se cargan en todas (el reCAPTCHA sigue cargándose solo con formulario).' );
	$area = function ( $k, $label, $desc ) {
		echo '<tr><th scope="row"><label for="rsite_' . esc_attr( $k ) . '">' . esc_html( $label ) . '</label></th><td><textarea id="rsite_' . esc_attr( $k ) . '" name="rsite_perf[' . esc_attr( $k ) . ']" rows="3" cols="50" class="large-text code">' . esc_textarea( (string) rsite_perf( $k ) ) . '</textarea><p class="description">' . esc_html( $desc ) . ' Una ruta por línea, empezando por «/»; «*» al final vale como prefijo (por ejemplo /contactame/*).</p></td></tr>';
	};
	$area( 'form_paths', 'Rutas con formulario forzado', 'Solo afecta a los archivos de Contact Form 7: en estas páginas se cargan siempre.' );
	$area( 'excl_min', 'Rutas siempre minificadas', 'Excluye estas páginas del modo legible de CSS y JS: usan siempre los archivos minificados del tema.' );
	$area( 'excl_webp', 'Rutas sin WebP', 'En estas páginas el HTML mantiene las imágenes originales aunque WebP esté activado.' );
	echo '<tr><th scope="row">WebP en el HTML</th><td><input type="hidden" name="rsite_perf[webp_present]" value="1"><label><input type="checkbox" name="rsite_perf[webp]" value="1"' . checked( '1', (string) get_option( 'rm_webp_on', '0' ), false ) . '> Activado</label><p class="description">Sustituye las imágenes PNG/JPEG por su copia .webp cuando existe. Es el ajuste rm_webp_on del módulo Rendimiento.</p></td></tr>';
	echo '</table>';
	submit_button( 'Guardar rendimiento' );
	echo '</form>';
	echo '<h2>Caché</h2><p>Vacía la caché de páginas de WP Super Cache. La caché del servidor de IONOS no se puede vaciar desde aquí.</p>';
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="rsite_flush">';
	wp_nonce_field( 'rsite_flush' );
	submit_button( 'Vaciar caché ahora', 'secondary' );
	echo '</form>';
}
