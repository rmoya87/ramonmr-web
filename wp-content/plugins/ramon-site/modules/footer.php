<?php
/** Modulo de Ramon Site: estilo del pie (filas "La web" y "Servicios" + barra legal). */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_head', function () {
	$css = '
body .site-footer .footer-rows{display:flex;flex-direction:column;gap:14px;margin-top:34px}
body .site-footer .footer-row{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 28px;margin:0}
body .site-footer .footer-row .eyebrow{margin:0;min-width:124px;font-size:13px;letter-spacing:.14em;color:#9a9aa0!important}
body .site-footer .footer-row-links,body .site-footer .footer-legal-links{display:flex;flex-wrap:wrap;gap:4px 26px;margin:0}
body .site-footer .footer-row-links a,body .site-footer .footer-legal-links a{display:inline-block;padding:2px 0;min-height:24px;font-size:15px;line-height:24px}
body .site-footer .footer-legal-links a{font-size:13px;color:#c9c9ce}
body .site-footer .footer-legal-links a:hover,body .site-footer .footer-row-links a:hover{color:#fff}
body .site-footer .footer-legal-links a[hidden]{display:none!important}
body .site-footer .copyright{align-items:center;gap:8px 24px;flex-wrap:wrap}
body .site-footer .copyright p{color:#b4b4ba;margin:0}
body .site-footer .copyright .footer-dot{opacity:.6}
@media (min-width:782px){body .site-footer>.content-width{display:grid;grid-template-columns:auto 1fr;align-items:stretch;column-gap:56px}body .site-footer>.content-width>.rm-signature-footer{margin:0}body .site-footer .footer-rows{margin-top:0;justify-self:end;gap:10px;grid-column:2;grid-row:1;justify-content:space-between;align-self:start;height:59px;box-sizing:border-box;gap:0}body .site-footer .footer-row .eyebrow,body .site-footer .footer-row-links a{line-height:24px}body .site-footer .footer-row{align-items:center}body .site-footer .footer-social{grid-column:1;grid-row:2;margin-top:14px}body .site-footer>.content-width>.rm-signature-footer{grid-column:1;grid-row:1}}
body .site-footer .footer-social{display:flex;align-items:center;gap:6px;margin-top:14px;padding:0 0 0 2px}body .site-footer .footer-social-label{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#9a9aa0;margin-right:8px}body .site-footer .footer-social a{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;color:#fff;background:rgba(255,255,255,.08);transition:background .2s}body .site-footer .footer-social a:hover{background:rgba(255,255,255,.18)}
@media (max-width:781px){body .site-footer .footer-social{padding-left:16px}body .site-footer .footer-row{flex-direction:column;align-items:flex-start;gap:4px}body .site-footer .footer-rows{padding:0 16px;margin-top:24px}body .site-footer .copyright{flex-direction:column;align-items:center;text-align:center;padding:24px 16px}body .site-footer .footer-legal-links{justify-content:center}}
';
	echo '<style id="rsite-footer-css">' . $css . '</style>' . "\n";
}, 115 );

