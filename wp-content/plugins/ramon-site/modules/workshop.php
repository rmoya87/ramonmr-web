<?php
/** Modulo de Ramon Site: seccion "En el taller" alimentada por entradas no publicadas. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function rsite_wk_stages() {
	return array(
		'idea'   => array( 'es' => 'Idea', 'en' => 'Idea' ),
		'draft'  => array( 'es' => 'Borrador', 'en' => 'Draft' ),
		'review' => array( 'es' => 'Revisión', 'en' => 'Review' ),
		'scheduled' => array( 'es' => 'Programado', 'en' => 'Scheduled' ),
	);
}

/** Avance por defecto de cada etapa real (se usa si la entrada no tiene un progreso propio). */
function rsite_wk_default_pct( $stage ) {
	$map = array( 'idea' => 20, 'draft' => 50, 'review' => 80, 'scheduled' => 95 );
	return isset( $map[ $stage ] ) ? $map[ $stage ] : 20;
}

add_action( 'init', function () {
	$auth = function () {
		return current_user_can( 'edit_posts' );
	};
	register_post_meta( 'post', '_rsite_wk', array( 'type' => 'string', 'single' => true, 'show_in_rest' => true, 'auth_callback' => $auth ) );
	register_post_meta( 'post', '_rsite_wk_stage', array( 'type' => 'string', 'single' => true, 'show_in_rest' => true, 'auth_callback' => $auth ) );
	register_post_meta( 'post', '_rsite_wk_pct', array( 'type' => 'string', 'single' => true, 'show_in_rest' => true, 'auth_callback' => $auth ) );
} );

add_action( 'add_meta_boxes', function () {
	add_meta_box( 'rsite_wk', 'En el taller', 'rsite_wk_box', 'post', 'side', 'high' );
} );

function rsite_wk_box( $post ) {
	wp_nonce_field( 'rsite_wk_save', 'rsite_wk_nonce' );
	$on    = get_post_meta( $post->ID, '_rsite_wk', true );
	$stage = get_post_meta( $post->ID, '_rsite_wk_stage', true );
	$pct   = get_post_meta( $post->ID, '_rsite_wk_pct', true );
	if ( '' === $pct ) {
		$pct = 20;
	}
	echo '<p class="description">Todas las entradas en borrador, pendientes o programadas salen solas en "En el taller".</p><input type="hidden" name="rsite_wk" value="1">';
	echo '<p><label for="rsite_wk_stage">Etapa</label><br><select id="rsite_wk_stage" name="rsite_wk_stage" style="width:100%">';
	foreach ( rsite_wk_stages() as $k => $l ) {
		echo '<option value="' . esc_attr( $k ) . '"' . selected( $stage, $k, false ) . '>' . esc_html( $l['es'] ) . '</option>';
	}
	echo '</select></p>';
	echo '<p><label for="rsite_wk_pct">Progreso (0-100)</label><br><input type="number" min="0" max="100" id="rsite_wk_pct" name="rsite_wk_pct" value="' . esc_attr( (int) $pct ) . '" style="width:100%"></p>';
	echo '<p class="description">Solo se muestra mientras la entrada no está publicada. Al publicarla desaparece sola. Cada idioma usa su propia entrada: marca también la traducción EN y pon su título en inglés.</p>';
}

add_action( 'save_post_post', function ( $post_id ) {
	if ( ! isset( $_POST['rsite_wk_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['rsite_wk_nonce'] ) ), 'rsite_wk_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	update_post_meta( $post_id, '_rsite_wk', isset( $_POST['rsite_wk'] ) ? '1' : '0' );
	$stage = isset( $_POST['rsite_wk_stage'] ) ? sanitize_key( wp_unslash( $_POST['rsite_wk_stage'] ) ) : 'idea';
	if ( ! isset( rsite_wk_stages()[ $stage ] ) ) {
		$stage = 'idea';
	}
	update_post_meta( $post_id, '_rsite_wk_stage', $stage );
	$pct = isset( $_POST['rsite_wk_pct'] ) ? (int) $_POST['rsite_wk_pct'] : 0;
	update_post_meta( $post_id, '_rsite_wk_pct', (string) max( 0, min( 100, $pct ) ) );
} );

function rsite_wk_is_en() {
	if ( function_exists( 'pll_current_language' ) ) {
		return 'en' === pll_current_language();
	}
	return 0 === strpos( get_locale(), 'en' );
}

add_shortcode( 'rsite_workshop', function () {
	$en   = rsite_wk_is_en();
	$args = array(
		'post_type'      => 'post',
		'post_status'    => array( 'draft', 'pending', 'future' ),
		'posts_per_page' => 12,
		'orderby'        => 'date',
		'order'          => 'ASC',
	);
	if ( function_exists( 'pll_current_language' ) ) {
		$args['lang'] = $en ? 'en' : 'es';
	}
	$q = new WP_Query( $args );
	if ( ! $q->have_posts() ) {
		return '';
	}
	$stages = rsite_wk_stages();
	$items  = '';
	while ( $q->have_posts() ) {
		$q->the_post();
		$id    = get_the_ID();
		if ( '' === trim( wp_strip_all_tags( get_the_title() ) ) ) {
			continue;
		}
		$status = get_post_status( $id );
		$st     = get_post_meta( $id, '_rsite_wk_stage', true );
		if ( 'future' === $status ) {
			$st = 'scheduled';
		} elseif ( 'pending' === $status && ( 'idea' === $st || 'draft' === $st || ! isset( $stages[ $st ] ) ) ) {
			$st = 'review';
		} elseif ( ! isset( $stages[ $st ] ) || 'scheduled' === $st ) {
			$st = 'draft';
		}
		$label = $stages[ $st ][ $en ? 'en' : 'es' ];
		$keys  = array_keys( $stages );
		$n     = array_search( $st, $keys, true );
		$n     = ( false === $n ) ? 1 : $n + 1;
		$tot   = count( $keys );
		$aria  = ( $en ? 'Stage: ' : 'Etapa: ' ) . $label . ' (' . $n . ( $en ? ' of ' : ' de ' ) . $tot . ')';
		$segs  = '';
		for ( $k = 1; $k <= $tot; $k++ ) {
			$segs .= '<b' . ( $k <= $n ? ' class="f"' : '' ) . '></b>';
		}
		$items .= '<li><strong>' . esc_html( get_the_title() ) . '</strong><em class="rs-wk-steps" role="img" aria-label="' . esc_attr( $aria ) . '">' . $segs . '</em><span>' . esc_html( $label ) . '</span></li>';
	}
	wp_reset_postdata();
	if ( '' === $items ) {
		return '';
	}
	$eyebrow = $en ? 'In the workshop' : 'En el taller';
	$h2      = $en ? 'What I am working on' : 'Lo que estoy preparando';
	$p       = $en ? 'Before they are published they show up here: half-formed ideas I want to tell properly. No dates promised, just that they will come out.' : 'Antes de publicarlos pasan por aquí: ideas a medias que quiero dejar bien contadas. No prometo fechas, solo que irán saliendo.';
	$js      = '<style>.rm-bl-cajon-list li em.rs-wk-steps{display:flex;gap:6px;height:8px;margin:14px 0 12px;font-style:normal;background:none!important;border-radius:0!important}.rm-bl-cajon-list li em.rs-wk-steps b{flex:1;height:8px;border-radius:999px;background:#d5def5;display:block;transform:none!important;width:auto!important;animation:none!important}.rm-bl-cajon-list li em.rs-wk-steps b.f{background:#004eff}.rm-bl-cajon-list li em.rs-wk-steps::before,.rm-bl-cajon-list li em.rs-wk-steps::after{content:none!important}</style>';
	return '<div class="wp-block-group rm-bl-cajon content-width"><div class="wp-block-group rm-bl-cajon-intro"><p class="rm-bl-eyebrow">' . esc_html( $eyebrow ) . '</p><h2 class="wp-block-heading">' . esc_html( $h2 ) . '</h2><p>' . esc_html( $p ) . '</p></div><ul class="wp-block-list rm-bl-cajon-list">' . $items . '</ul></div>' . $js;
} );

