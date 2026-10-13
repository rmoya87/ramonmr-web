<?php
/** Ramon Site: pestana Textos por idioma. Un campo por cada idioma configurado en Polylang (menos el principal). */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Todos los idiomas configurados en Polylang (el principal primero): slug => nombre. */
function rsite_texts_langs() {
	if ( ! function_exists( 'pll_languages_list' ) ) { return array(); }
	$slugs = (array) pll_languages_list( array( 'fields' => 'slug' ) );
	$names = (array) pll_languages_list( array( 'fields' => 'name' ) );
	$def   = function_exists( 'pll_default_language' ) ? (string) pll_default_language() : 'es';
	$out   = array();
	foreach ( $slugs as $i => $slug ) {
		$out[ $slug ] = isset( $names[ $i ] ) ? $names[ $i ] : $slug;
	}
	if ( isset( $out[ $def ] ) ) {
		$out = array( $def => $out[ $def ] ) + $out;
	}
	return $out;
}

/** Texto de fabrica de cada clave por idioma: ingles = diccionario incluido; idioma principal = la propia clave. */
function rsite_texts_defaults( $lang ) {
	return ( 'en' === $lang && function_exists( 'ri_dict_exact' ) ) ? ri_dict_exact() : array();
}

function rsite_texts_default_lang() {
	return function_exists( 'ri_default_lang' ) ? ri_default_lang() : 'es';
}

function rsite_texts_factory( $lang, $key ) {
	if ( $lang === rsite_texts_default_lang() ) { return $key; }
	$def = rsite_texts_defaults( $lang );
	return isset( $def[ $key ] ) ? $def[ $key ] : '';
}

function rsite_texts_saved() {
	$o = get_option( 'rsite_texts', array() );
	return is_array( $o ) ? $o : array();
}

if ( is_admin() ) {
	add_action( 'admin_init', function () {
		register_setting( 'rsite_texts_group', 'rsite_texts', array(
			'type'              => 'array',
			'sanitize_callback' => function ( $in ) {
				// WordPress puede llamar dos veces al sanear en el primer guardado: la segunda llega ya saneada.
				if ( is_array( $in ) && ! isset( $in['rows'] ) ) { return $in; }
				$rows  = ( is_array( $in ) && isset( $in['rows'] ) && is_array( $in['rows'] ) ) ? $in['rows'] : array();
				$langs = rsite_texts_langs();
				$old   = rsite_texts_saved();
				$out   = array();
				// Idiomas que ya no estan configurados: se conservan tal cual.
				foreach ( $old as $slug => $map ) {
					if ( ! isset( $langs[ $slug ] ) && is_array( $map ) ) { $out[ $slug ] = $map; }
				}
				foreach ( $rows as $row ) {
					if ( ! is_array( $row ) || ! isset( $row['src'] ) ) { continue; }
					$src = trim( sanitize_text_field( $row['src'] ) );
					if ( '' === $src || ! isset( $row['tr'] ) || ! is_array( $row['tr'] ) ) { continue; }
					foreach ( $langs as $slug => $name ) {
						if ( ! isset( $row['tr'][ $slug ] ) ) { continue; }
						$tr = trim( sanitize_text_field( $row['tr'][ $slug ] ) );
						if ( '' === $tr ) { continue; }
						// Solo se guarda lo que cambia respecto al texto de fabrica.
						if ( rsite_texts_factory( $slug, $src ) === $tr ) { continue; }
						$out[ $slug ][ $src ] = $tr;
					}
				}
				return $out;
			},
		) );
		if ( isset( $_GET['page'], $_GET['settings-updated'] ) && 'ramon-site' === $_GET['page'] && isset( $_GET['tab'] ) && 'texts' === $_GET['tab'] && function_exists( 'rsite_flush_cache' ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			rsite_flush_cache();
		}
	} );
}

function rsite_texts_render() {
	$langs = rsite_texts_langs();
	if ( ! function_exists( 'ri_dict_exact' ) ) {
		echo '<div class="notice notice-warning inline"><p>El módulo «Idiomas ES/EN» está desactivado (pestaña General). Actívalo para editar y aplicar estos textos.</p></div>';
		return;
	}
	if ( ! $langs ) {
		echo '<p>No hay idiomas configurados en Polylang.</p>';
		return;
	}
	$saved = rsite_texts_saved();
	$keys  = array();
	foreach ( array_keys( rsite_texts_defaults( 'en' ) ) as $k ) { $keys[ $k ] = true; }
	foreach ( $langs as $slug => $name ) {
		if ( ! empty( $saved[ $slug ] ) && is_array( $saved[ $slug ] ) ) {
			foreach ( array_keys( $saved[ $slug ] ) as $k ) { $keys[ $k ] = true; }
		}
	}
	echo '<p>Textos fijos del tema. La primera columna es la clave fija (el texto original del tema, no se edita) y hay un campo por cada idioma configurado en Polylang (' . esc_html( implode( ', ', array_values( $langs ) ) ) . '). El campo del idioma principal cambia cómo se muestra el texto en ese idioma sin cambiar la clave. Un campo vacío o igual al de fábrica usa el texto de fábrica; si no hay, se ve el texto original.</p>';
	echo '<form method="post" action="options.php">';
	settings_fields( 'rsite_texts_group' );
	$w = (int) floor( 76 / max( 1, count( $langs ) ) );
	echo '<table class="widefat striped" role="presentation" style="table-layout:fixed;width:100%"><thead><tr><th style="width:24%">Texto original (clave)</th>';
	foreach ( $langs as $slug => $name ) { echo '<th style="width:' . (int) $w . '%">' . esc_html( $name ) . '</th>'; }
	echo '</tr></thead><tbody>';
	$i = 0;
	$field = function ( $name, $val ) {
		if ( strlen( $val ) > 80 ) {
			return '<textarea name="' . esc_attr( $name ) . '" rows="4" class="large-text" style="width:100%">' . esc_textarea( $val ) . '</textarea>';
		}
		return '<input type="text" class="large-text" style="width:100%" name="' . esc_attr( $name ) . '" value="' . esc_attr( $val ) . '">';
	};
	foreach ( array_keys( $keys ) as $src ) {
		echo '<tr><td style="word-wrap:break-word"><input type="hidden" name="rsite_texts[rows][' . (int) $i . '][src]" value="' . esc_attr( $src ) . '">' . esc_html( $src ) . '</td>';
		foreach ( $langs as $slug => $name ) {
			$val = isset( $saved[ $slug ][ $src ] ) ? $saved[ $slug ][ $src ] : rsite_texts_factory( $slug, $src );
			echo '<td>' . $field( 'rsite_texts[rows][' . (int) $i . '][tr][' . $slug . ']', $val ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</tr>';
		$i++;
	}
	for ( $n = 0; $n < 3; $n++ ) {
		echo '<tr><td><input type="text" class="large-text" placeholder="Nueva clave: texto original del tema" name="rsite_texts[rows][' . (int) $i . '][src]" value=""></td>';
		foreach ( $langs as $slug => $name ) {
			echo '<td><input type="text" class="large-text" name="rsite_texts[rows][' . (int) $i . '][tr][' . esc_attr( $slug ) . ']" value=""></td>';
		}
		echo '</tr>';
		$i++;
	}
	echo '</tbody></table>';
	submit_button( 'Guardar textos' );
	echo '</form>';
}
