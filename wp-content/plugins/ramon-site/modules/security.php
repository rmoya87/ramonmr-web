<?php
/** Modulo de Ramon Site. */
if (!defined('ABSPATH')) { exit; }

// Solo respuestas procesadas por WordPress. La caché estática y archivos como
// readme.html requieren configuración del servidor para cobertura completa.
function ramon_security_headers() {
    if (headers_sent() || !rsite_sec('headers')) { return; }
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header_remove('X-Powered-By');
}
add_action('send_headers', 'ramon_security_headers', 100);
add_action('admin_init', 'ramon_security_headers', 100);
add_action('login_init', 'ramon_security_headers', 100);
add_filter('rest_pre_serve_request', function ($served) {
    ramon_security_headers();
    return $served;
}, 100, 1);

// Mantener REST para editor y formularios; solo restringir rutas de usuarios
// a visitantes anónimos, sin impedir autenticación ni acceso de administradores.
add_filter('rest_pre_dispatch', function ($result, $server, $request) {
    if (rsite_sec('anon') && !is_user_logged_in() && preg_match('#^/wp/v2/users(?:/|$)#', $request->get_route())) {
        return new WP_Error('ramon_users_private', 'Esta información no está disponible públicamente.', array('status' => 403));
    }
    return $result;
}, 10, 3);

// Bloquear la consulta author=N antes de que WordPress redirija al slug.
// No cambiar archivos de autor por slug ni contenido del blog.
add_action('template_redirect', function () {
    if (rsite_sec('anon') && !is_user_logged_in() && isset($_GET['author'])) {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
        nocache_headers();
    }
}, 0);
add_filter('redirect_canonical', function ($redirect) {
    if (rsite_sec('anon') && !is_user_logged_in() && isset($_GET['author'])) { return false; }
    return $redirect;
}, 10, 1);

// Hardening restricted to this site's exact hosts. Other portals are unchanged.
function ramon_security_host() {
    return in_array(strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '')), array('ramonmr.com','www.ramonmr.com'), true);
}
add_action('plugins_loaded', function () {
    if (rsite_sec('xmlrpc') && ramon_security_host() && defined('XMLRPC_REQUEST') && XMLRPC_REQUEST) {
        status_header(403);
        header('Content-Type: text/plain; charset=UTF-8');
        echo 'XML-RPC desactivado.';
        exit;
    }
}, 0);
add_filter('xmlrpc_enabled', function ($on) { return rsite_sec('xmlrpc') ? false : $on; });
add_filter('wp_headers', function ($headers) { if (rsite_sec('xmlrpc')) { unset($headers['X-Pingback']); } return $headers; });
add_action('send_headers', function () { if(rsite_sec('xmlrpc') && ramon_security_host()) header_remove('X-Pingback'); }, 101);
function ramon_security_extra_headers() {
    if (!ramon_security_host() || headers_sent()) return;
    if (is_ssl() && rsite_sec('hsts')) {
        $age = max(0, (int) rsite_sec('hsts_age'));
        $v   = 'max-age=' . $age;
        if (rsite_sec('hsts_sub')) { $v .= '; includeSubDomains'; }
        if (rsite_sec('hsts_preload') && rsite_sec('hsts_sub') && $age >= 31536000) { $v .= '; preload'; }
        header('Strict-Transport-Security: ' . $v);
    }
    $csp_mode = rsite_sec('csp');
    if ('off' === $csp_mode) { return; }
    $csp_name = ('enforce' === $csp_mode) ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
    header($csp_name . ": default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
}
add_action('send_headers','ramon_security_extra_headers',102);
add_action('admin_init','ramon_security_extra_headers',102);
add_action('login_init','ramon_security_extra_headers',102);
add_filter('rest_pre_serve_request',function($served){ramon_security_extra_headers();return $served;},102);

// Exportación de solo lectura de los dos temas estándar sin usar (botones en Ajustes > Ramon Site > Seguridad).
function rsite_sec_theme_export_ui() {
    $found = false;
    foreach (array('twentyfifteen','twentytwentythree') as $slug) {
        if (wp_get_theme($slug)->exists()) {
            if (!$found) { echo '<h2>Copias de temas inactivos</h2><p>Exporta los archivos instalados. No modifica temas ni servidor.</p>'; }
            $found = true;
            echo '<p><a class="button" href="'.esc_url(wp_nonce_url(admin_url('admin-post.php?action=ramon_theme_backup&theme='.$slug),'ramon_theme_backup')).'">Exportar '.esc_html($slug).'</a></p>';
        }
    }
}
add_action('admin_post_ramon_theme_backup',function(){
    if(!current_user_can('manage_options'))wp_die('No autorizado');
    check_admin_referer('ramon_theme_backup');
    $slug=sanitize_key($_GET['theme']??'');
    if(!in_array($slug,array('twentyfifteen','twentytwentythree'),true))wp_die('Tema no permitido');
    $theme=wp_get_theme($slug);
    if(!$theme->exists()||get_stylesheet()===$slug||get_template()===$slug)wp_die('No exportable');
    if(!class_exists('ZipArchive'))wp_die('ZipArchive no disponible');
    $root=$theme->get_stylesheet_directory();
    $tmp=wp_tempnam('ramon-theme-backup.zip');
    $zip=new ZipArchive();
    if($zip->open($tmp,ZipArchive::CREATE|ZipArchive::OVERWRITE)!==true)wp_die('No se puede crear copia');
    $it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS));
    foreach($it as $file){if($file->isFile()&&!$file->isLink())$zip->addFile($file->getPathname(),$slug.'/'.substr($file->getPathname(),strlen($root)+1));}
    $zip->close();
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="'.$slug.'-installed-backup.zip"');
    header('Content-Length: '.filesize($tmp));
    readfile($tmp);unlink($tmp);exit;
});

// WP Super Cache: guardar tambien la CSP en modo solo informe en las respuestas cacheadas.
add_filter('wpsc_known_headers', function ($headers) {
    if (is_array($headers)) {
        $headers[] = 'Content-Security-Policy-Report-Only';
    }
    return $headers;
});

