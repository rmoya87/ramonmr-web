<?php
/** Modulo de Ramon Site: rendimiento. Ajusta sizes de miniaturas de tarjetas. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_filter( 'render_block', function ( $html, $block ) {
	if ( empty( $block['blockName'] ) || 'core/post-featured-image' !== $block['blockName'] ) {
		return $html;
	}
	if ( is_singular( 'post' ) || is_singular( 'ohio_portfolio' ) || is_admin() ) {
		return $html;
	}
	// Las miniaturas son apaisadas (2,3:1) recortadas en cuadrado con object-fit:cover, asi que el
	// ancho util es el de la altura de la tarjeta por 2,3 (unos 760 px en escritorio, 390 en movil).
	// El navegador multiplica por la densidad de pantalla: en retina sigue eligiendo la variante mayor.
	return preg_replace( '/\ssizes="[^"]*"/', ' sizes="(max-width: 781px) 100vw, 760px"', $html );
}, 20, 2 );


/**
 * WebP: genera copias .webp junto a los PNG/JPEG (el original no se toca) y, con el interruptor
 * rm_webp_on activo, sustituye la URL en el HTML servido por la copia .webp si existe.
 * Reversible: poner rm_webp_on a 0 (admin-post.php?action=rm_webp&mode=off) o quitar este bloque.
 */
function rm_webp_candidates() {
	$out = array();
	$up  = wp_get_upload_dir();
	$dirs = array(
		array( $up['basedir'], '~^(?:ramon-native-[0-9a-f]+/)?\d{4}/\d{2}/.+\.(?:png|jpe?g)$~i' ),
		array( get_theme_file_path( '' ), '~.+\.(?:png|jpe?g)$~i' ),
	);
	foreach ( $dirs as $d ) {
		$base = rtrim( $d[0], '/' );
		if ( ! is_dir( $base ) ) { continue; }
		$it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $base, FilesystemIterator::SKIP_DOTS ) );
		foreach ( $it as $f ) {
			if ( ! $f->isFile() ) { continue; }
			$rel = ltrim( substr( $f->getPathname(), strlen( $base ) ), '/' );
			if ( preg_match( $d[1], $rel ) ) { $out[] = $f->getPathname(); }
		}
	}
	sort( $out );
	return $out;
}

function rm_webp_convert( $path, $force = false ) {
	$r = rm_webp_convert_one( $path, $force );
	// Nunca borrar ni sobrescribir copias existentes en una reconversion.
	return $r;
}

function rm_webp_convert_one( $path, $force = false ) {
	$dest = $path . '.rm.webp';
	$existing = rm_rn_map();
	$key = ltrim( substr( $path, strlen( WP_CONTENT_DIR ) ), '/' );
	if ( isset( $existing[ $key ] ) && file_exists( WP_CONTENT_DIR . '/' . $existing[ $key ] ) ) { return array( 'have', 0, 0 ); }
	if ( file_exists( $dest ) ) {
		return array( 'have', 0, 0 );
	}
	$info = @getimagesize( $path );
	if ( ! $info ) { return array( 'skip-noinfo', 0, 0 ); }
	list( $w, $h, $type ) = $info;
	if ( $w > 16383 || $h > 16383 || $w * $h * 6 > 380000000 ) { return array( 'skip-size', 0, 0 ); }
	$orig = filesize( $path );
	if ( IMAGETYPE_PNG === $type ) {
		$head = file_get_contents( $path, false, null, 0, 65536 );
		if ( false !== strpos( $head, 'acTL' ) ) { return array( 'skip-animated', 0, 0 ); }
		$im = @imagecreatefrompng( $path );
	} elseif ( IMAGETYPE_JPEG === $type ) {
		if ( ! empty( $info['channels'] ) && 3 !== (int) $info['channels'] ) { return array( 'skip-cmyk', 0, 0 ); }
		if ( function_exists( 'exif_read_data' ) ) {
			$ex = @exif_read_data( $path );
			if ( ! empty( $ex['Orientation'] ) && 1 !== (int) $ex['Orientation'] ) { return array( 'skip-orientation', 0, 0 ); }
		}
		$im = @imagecreatefromjpeg( $path );
	} else {
		return array( 'skip-type', 0, 0 );
	}
	if ( ! $im ) { return array( 'skip-decode', 0, 0 ); }
	$tmp = $dest . '.tmp';
	$ok  = false;
	if ( IMAGETYPE_PNG === $type ) {
		imagepalettetotruecolor( $im );
		imagealphablending( $im, false );
		imagesavealpha( $im, true );
		$ok = imagewebp( $im, $tmp, defined( 'IMG_WEBP_LOSSLESS' ) ? IMG_WEBP_LOSSLESS : 101 );

	} else {
		$ok = imagewebp( $im, $tmp, 85 );
	}
	imagedestroy( $im );
	if ( ! $ok || ! file_exists( $tmp ) ) { @unlink( $tmp ); return array( 'skip-encode', 0, 0 ); }
	$new = filesize( $tmp );
	if ( $new >= $orig ) { @unlink( $tmp ); return array( 'skip-notsmaller', 0, 0 ); }
	// Nombre limpio, sin sobrescribir el original ni otras variantes.
	$clean = preg_replace( '~\.(?:png|jpe?g)$~i', '.webp', $path );
	if ( file_exists( $clean ) ) { $clean = preg_replace( '~\.(?:png|jpe?g)$~i', '-optimizada.webp', $path ); }
	if ( file_exists( $clean ) ) { $clean = preg_replace( '~\.(png|jpe?g)$~i', '-$1-optimizada.webp', $path ); }
	if ( file_exists( $clean ) ) { @unlink( $tmp ); return array( 'skip-name-conflict', 0, 0 ); }
	if ( ! rename( $tmp, $clean ) ) { @unlink( $tmp ); return array( 'skip-write', 0, 0 ); }
	$mf = WP_CONTENT_DIR . '/rm-backup-unused/rn-map.json';
	$map = (array) json_decode( (string) @file_get_contents( $mf ), true );
	$map[ ltrim( substr( $path, strlen( WP_CONTENT_DIR ) ), '/' ) ] = ltrim( substr( $clean, strlen( WP_CONTENT_DIR ) ), '/' );
	if ( false === file_put_contents( $mf . '.tmp', wp_json_encode( $map ), LOCK_EX ) || ! rename( $mf . '.tmp', $mf ) ) { return array( 'skip-map-write', 0, 0 ); }
	return array( 'ok', $orig, $new );
}

add_action( 'admin_post_rm_webp', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'no', 403 ); }
	@set_time_limit( 150 );
	@ini_set( 'memory_limit', '512M' );
	$mode = isset( $_GET['mode'] ) ? sanitize_key( $_GET['mode'] ) : 'status';
	$st   = get_option( 'rm_webp_state', array( 'last' => '', 'c' => array(), 'before' => 0, 'after' => 0 ) );
	if ( 'on' === $mode || 'off' === $mode ) {
		update_option( 'rm_webp_on', 'on' === $mode ? '1' : '0', false );
		if ( function_exists( 'wp_cache_clean_cache' ) ) { global $file_prefix; wp_cache_clean_cache( $file_prefix, true ); }
		wp_send_json( array( 'rm_webp_on' => get_option( 'rm_webp_on' ) ) );
	}
	if ( 'reset' === $mode ) {
		delete_option( 'rm_webp_state' );
		wp_send_json( array( 'reset' => true ) );
	}

	if ( 'inv' === $mode ) {
		global $wpdb;
		$up = wp_get_upload_dir();
		$base = rtrim( $up['basedir'], '/' ) . '/';
		$orig = array(); $size = array(); $att = 0;
		$rows = $wpdb->get_results( "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key='_wp_attachment_metadata'" );
		foreach ( $rows as $r ) {
			$m = maybe_unserialize( $r->meta_value );
			if ( ! is_array( $m ) || empty( $m['file'] ) ) { continue; }
			$att++;
			$dir = dirname( $m['file'] );
			$orig[ $base . $m['file'] ] = 1;
			if ( ! empty( $m['original_image'] ) ) { $size[ $base . $dir . '/' . $m['original_image'] ] = 1; }
			foreach ( ( $m['sizes'] ?? array() ) as $sz ) { $size[ $base . $dir . '/' . $sz['file'] ] = 1; }
		}
		$total_att = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='attachment'" );
		$out = array( 'attachments_total' => $total_att, 'attachments_with_meta' => $att, 'uploads_basedir' => $up['basedir'], 'siteurl' => home_url(), 'abspath' => ABSPATH );
		$cls = array(); $ext = array(); $bytes = array(); $theme = 0; $dirs = array();
		foreach ( rm_webp_candidates() as $p ) {
			$k = isset( $orig[ $p ] ) ? 'attachment-original' : ( isset( $size[ $p ] ) ? 'attachment-size' : ( 0 === strpos( $p, $base ) ? 'uploads-not-in-library' : 'theme' ) );
			$cls[ $k ] = ( $cls[ $k ] ?? 0 ) + 1;
			$e = strtolower( pathinfo( $p, PATHINFO_EXTENSION ) );
			$ext[ $k . ':' . $e ] = ( $ext[ $k . ':' . $e ] ?? 0 ) + 1;
			$bytes[ $k ] = ( $bytes[ $k ] ?? 0 ) + filesize( $p );
			if ( 'uploads-not-in-library' === $k && count( $dirs ) < 12 ) { $dirs[] = substr( $p, strlen( $base ) ); }
		}
		$out['classes'] = $cls; $out['ext'] = $ext; $out['bytes'] = $bytes; $out['sample_not_in_library'] = $dirs;
		// Adjuntos de la biblioteca que NO entran en mis candidatos (ruta fuera de AAAA/MM)
		$odd = array();
		foreach ( array_keys( $orig ) as $p ) { if ( preg_match( '~\.(png|jpe?g)$~i', $p ) && ! preg_match( '~^\d{4}/\d{2}/~', substr( $p, strlen( $base ) ) ) ) { $odd[] = substr( $p, strlen( $base ) ); } }
		$out['library_images_outside_yyyy_mm'] = count( $odd ); $out['sample_outside'] = array_slice( $odd, 0, 8 );
		$top = array();
		foreach ( glob( $base . '*', GLOB_ONLYDIR ) as $d ) { $top[ basename( $d ) ] = 1; }
		$out['uploads_top_dirs'] = array_keys( $top );
		wp_send_json( $out );
	}
	if ( 'run' === $mode ) {
		$budget = isset( $_GET['t'] ) ? min( 100, max( 5, (int) $_GET['t'] ) ) : 40;
		$t0 = microtime( true );
		$all = rm_webp_candidates();
		$n = 0;
		foreach ( $all as $p ) {
			if ( $p <= $st['last'] ) { continue; }
			if ( microtime( true ) - $t0 > $budget ) { break; }
			$r = rm_webp_convert( $p, ! empty( $_GET['force'] ) );
			$st['c'][ $r[0] ] = ( $st['c'][ $r[0] ] ?? 0 ) + 1;
			$st['before'] += $r[1];
			$st['after']  += $r[2];
			$st['last'] = $p;
			$n++;
		}
		$st['done'] = ( $n < 1 || end( $all ) <= $st['last'] );
		update_option( 'rm_webp_state', $st, false );
		wp_send_json( array( 'batch' => $n, 'total' => count( $all ), 'state' => $st, 'secs' => round( microtime( true ) - $t0, 1 ) ) );
	}
	$all = rm_webp_candidates();
	$have = 0;
	foreach ( $all as $p ) { if ( file_exists( $p . '.rm.webp' ) ) { $have++; } }
	wp_send_json( array( 'total' => count( $all ), 'with_webp' => $have, 'state' => $st, 'rm_webp_on' => get_option( 'rm_webp_on', '0' ) ) );
} );

add_action( 'template_redirect', function () {
	if ( '1' !== get_option( 'rm_webp_on', '0' ) || is_feed() || is_admin() || is_robots() || is_trackback() ) { return; }
	ob_start( 'rm_webp_rewrite' );
}, 0 );

function rm_webp_rewrite( $html ) {
	if ( false === stripos( $html, '<html' ) ) { return $html; }
	// No cambiar metadatos sociales, schema ni enlaces de identidad.
	$parts = preg_split( '~(<meta\b[^>]*>|<script\b[^>]*application/ld\+json[^>]*>.*?</script>|<link\b[^>]*rel=["\'](?:canonical|image_src|apple-touch-icon|icon|shortcut icon|alternate)[^>]*>)~is', $html, -1, PREG_SPLIT_DELIM_CAPTURE );
	if ( ! is_array( $parts ) ) { return $html; }
	$re = '~(?<![\w/.-])((?:https?:)?//(?:www\.)?ramonmr\.com/wp-content/((?:uploads/(?:ramon-native-[0-9a-f]+/)?\d{4}/\d{2}|themes/ramon-native)/[^\s"\'<>()\\\\,]*?\.(?:png|jpe?g)))(?=[\s"\'<>()\\\\,?#]|$)~i';
	$map = rm_rn_map(); $cache = array();
	foreach ( $parts as $i => $part ) {
		if ( 1 === $i % 2 ) { continue; }
		$parts[ $i ] = preg_replace_callback( $re, function ( $m ) use ( &$cache, $map ) {
			$rel = rawurldecode( $m[2] );
			if ( ! array_key_exists( $rel, $cache ) ) {
				$orig = WP_CONTENT_DIR . '/' . $rel; $target = $map[ $rel ] ?? '';
				if ( '' !== $target && file_exists( WP_CONTENT_DIR . '/' . $target ) && file_exists( $orig ) && filesize( WP_CONTENT_DIR . '/' . $target ) < filesize( $orig ) ) { $cache[ $rel ] = $target; }
				else { $cache[ $rel ] = ''; }
			}
			if ( '' === $cache[ $rel ] ) { return $m[1]; }
			$prefix = substr( $m[1], 0, strpos( $m[1], '/wp-content/' ) );
			return $prefix . '/wp-content/' . implode( '/', array_map( 'rawurlencode', explode( '/', $cache[ $rel ] ) ) );
		}, $part );
	}
	return implode( '', $parts );
}

function rm_rn_map() {
	static $map = null;
	if ( null === $map ) { $map = (array) json_decode( (string) @file_get_contents( WP_CONTENT_DIR . '/rm-backup-unused/rn-map.json' ), true ); }
	return $map;
}

