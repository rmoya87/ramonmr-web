<?php
/** Modulo de Ramon Site: reCAPTCHA discreto (badge oculto + aviso legal en los formularios CF7). */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function rsite_rc_is_en() {
	if ( function_exists( 'pll_current_language' ) ) { return 'en' === pll_current_language(); }
	return false !== strpos( isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '', '/en/' );
}

add_action( 'wp_head', function () {
	echo '<style id="rsite-recaptcha-css">.grecaptcha-badge,.grecaptcha-badge.rc-on{visibility:hidden!important;opacity:0!important;pointer-events:none!important}.rsite-rc-note{margin:10px 0 0!important;font-size:12px!important;line-height:1.5!important;color:#595959!important;font-weight:400!important}.site-footer .rsite-rc-note{color:#b4b4ba!important}.site-footer .rsite-rc-note a{color:#d6defa!important}.rsite-rc-note a{font-size:inherit!important;line-height:inherit!important;color:#0033a0!important;text-decoration:underline}</style>' . "\n";
}, 99 );

add_filter( 'wpcf7_form_elements', function ( $html ) {
	if ( false !== strpos( $html, 'rsite-rc-note' ) ) { return $html; }
	if ( rsite_rc_is_en() ) {
		$t = 'This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener">Terms of Service</a> apply.';
	} else {
		$t = 'Este sitio está protegido por reCAPTCHA y se aplican la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Política de privacidad</a> y las <a href="https://policies.google.com/terms" target="_blank" rel="noopener">Condiciones del servicio</a> de Google.';
	}
	return $html . '<p class="rsite-rc-note">' . $t . '</p>';
}, 20 );

