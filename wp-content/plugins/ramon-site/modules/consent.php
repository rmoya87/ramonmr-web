<?php
/** Modulo de Ramon Site: oculta la pestana flotante de Complianz; "Administrar consentimiento" vive como enlace en el pie (clase cmplz-show-banner). */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_head', function () {
	echo '<style id="rsite-consent-css">#cmplz-manage-consent,.cmplz-manage-consent.cmplz-btn,button.cmplz-manage-consent{display:none!important}</style>' . "\n";
}, 99 );

add_action( 'wp_footer', function () {
	?>
<script id="rsite-consent-js">document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.cmplz-show-banner');if(!a){return;}e.preventDefault();var b=document.querySelector('button.cmplz-manage-consent');if(b){b.click();}});</script>
	<?php
}, 99 );

