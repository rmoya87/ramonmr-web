<?php
/**
 * Plugin Name: Ramon Touring
 * Description: RM Touring Lab 2.0 — modo de conducción opcional con lectura del contenido publicado de WordPress.
 * Version: 3.0.8
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Author: Ramón de Moya
 * License: GPL-2.0-or-later
 */
if (!defined('ABSPATH')) { exit; }
const RM_TOURING_VERSION = '3.0.8';
require_once __DIR__.'/src/scores.php';
require_once __DIR__.'/src/admin.php';
register_activation_hook(__FILE__,'rm_touring_scores_install');
add_action('admin_init', static function () {
    if (get_option('rm_touring_db_v') === '2') { return; }
    rm_touring_scores_install();
    update_option('rm_touring_db_v', '2', false);
});
function rm_touring_lang() { return function_exists('pll_current_language') ? (pll_current_language('slug') ?: 'es') : 'es'; }
function rm_touring_url($lang = null) {
    $lang = $lang ?: rm_touring_lang();
    $base = function_exists('pll_home_url') ? pll_home_url($lang) : home_url('/');
    return add_query_arg(['rm_drive' => '1', 'ri_noredirect' => '1'], $base);
}
/** Published public content only. No users, drafts, custom fields or private data. */
function rm_touring_catalog($lang) {
    $en = $lang === 'en';
    $labels = $en ? ['Services','CV','Projects','Articles','Contact','More pages'] : ['Servicios','Curriculum','Portfolio','Blog','Contacto','Más páginas'];
    $groups = array_map(static function ($name) { return ['name'=>$name,'items'=>[]]; }, $labels);
    $types = array_values(array_diff(get_post_types(['public'=>true],'names'), ['attachment']));
    $args = ['post_type'=>$types,'post_status'=>'publish','posts_per_page'=>-1,'orderby'=>['menu_order'=>'ASC','title'=>'ASC'],'has_password'=>false,'suppress_filters'=>false,'lang'=>$lang];
    foreach (get_posts($args) as $post) {
        if (function_exists('pll_get_post_language') && pll_get_post_language($post->ID,'slug') !== $lang) { continue; }
        $url = get_permalink($post);
        if (!$url || wp_parse_url($url,PHP_URL_HOST) !== wp_parse_url(home_url('/'),PHP_URL_HOST)) { continue; }
        $path = (string) wp_parse_url($url,PHP_URL_PATH);
        $index = 5;
        if ($post->post_type === 'post' || preg_match('~/(blog|articles)/?$~',$path)) { $index=3; }
        elseif ($post->post_type === 'ohio_portfolio' || preg_match('~/(portfolio|projects)(/|$)~',$path)) { $index=2; }
        elseif (preg_match('~/(servicios|services)(/|$)~',$path)) { $index=0; }
        elseif (preg_match('~/(curriculum-ramon-de-moya|cv)/?$~',$path)) { $index=1; }
        elseif (preg_match('~/(contactame|contact)/?$~',$path)) { $index=4; }
        $groups[$index]['items'][] = ['id'=>(int)$post->ID,'title'=>wp_strip_all_tags(get_the_title($post)),'url'=>$url,'reader'=>add_query_arg(['rm_reader'=>'1','ri_noredirect'=>'1'],$url)];
    }
    foreach ($groups as &$group) { usort($group['items'], static function ($a, $b) { return substr_count(wp_parse_url($a['url'],PHP_URL_PATH),'/') <=> substr_count(wp_parse_url($b['url'],PHP_URL_PATH),'/'); }); } unset($group);
    return array_values(array_filter($groups,static function ($group) { return !empty($group['items']); }));
}
/** Reader-only presentation. Keep full main, forms and consent scripts untouched. */
add_action('wp_head', static function () {
    if (!isset($_GET['rm_reader']) || (string) $_GET['rm_reader'] !== '1' || is_admin()) { return; }
    echo '<style id="rm-touring-reader-style">html{margin-top:0!important}body{margin:0!important}#rm-reader-unused,.wp-site-blocks .site-header,.wp-site-blocks .site-footer,#wpadminbar,.social-rail{display:none!important}.wp-site-blocks{padding-top:0!important}main.page-main{margin-top:0!important;padding-top:24px!important;min-width:0!important}main.page-main img,main.page-main video{max-width:100%;height:auto}</style>';
}, 99);
function rm_touring_mode_css() {
    return '.social-rail{display:none!important}#rm-mode-pill{position:fixed;right:24px;top:36%;z-index:24;background:#fff;color:#172a32;border:1px solid #ccd6d9;box-shadow:0 6px 24px #10202922;border-radius:28px;padding:8px 3px;display:flex;flex-direction:column;align-items:center;gap:8px;font:12px/1.3 system-ui,sans-serif}#rm-mode-pill>span{writing-mode:vertical-rl;text-orientation:mixed;font-size:11px;font-weight:600}#rm-mode-pill a{display:flex;flex-direction:column;gap:4px;padding:3px;border-radius:22px;background:#e8eef0;color:#263f49;text-decoration:none}#rm-mode-pill a span{writing-mode:vertical-rl;text-orientation:mixed;padding:8px 4px;min-width:20px;min-height:44px;text-align:center;border-radius:18px}#rm-mode-pill a[data-game="0"] .mode-web,#rm-mode-pill a[data-game="1"] .mode-game{background:#243f49;color:#fff}#rm-mode-pill a:focus-visible{outline:3px solid #c08216;outline-offset:3px}body.rm-reader-expanded #rm-mode-pill{display:none}@media(max-width:700px){body:not(.rm-touring-shell):not(.rm-reader-expanded){box-sizing:border-box;padding-right:58px!important}#rm-mode-pill{top:auto;bottom:12px;right:12px;padding:6px 3px;flex-direction:column;border-radius:24px;gap:5px}#rm-mode-pill a{flex-direction:column}#rm-mode-pill a span{padding:8px 4px;min-height:44px;min-width:20px}}';
}
function rm_touring_mode_selector($game=false) {
    $en=rm_touring_lang()==='en';$base=function_exists('pll_home_url')?pll_home_url(rm_touring_lang()):home_url('/');
    $url=$game?$base:rm_touring_url();
    return '<nav id="rm-mode-pill" aria-label="'.esc_attr($en?'Website mode':'Modo de la web').'"><span>'.($en?'Mode':'Modo').'</span><a role="switch" aria-checked="'.($game?'true':'false').'" aria-label="'.esc_attr($en?'Game mode':'Modo Game').'" data-game="'.($game?'1':'0').'" href="'.esc_url($url).'"><span class="mode-web">Web</span><span class="mode-game">Game</span></a></nav>';
}
add_action('wp_head', static function () {
    if(is_admin()||is_feed()||isset($_GET['rm_drive'])||isset($_GET['rm_reader']))return;
    echo '<style id="rm-touring-mode-style">'.rm_touring_mode_css().'</style>';
},99);
add_action('wp_footer', static function () {
    if(is_admin()||is_feed()||isset($_GET['rm_drive'])||isset($_GET['rm_reader']))return;
    echo rm_touring_mode_selector(false);
},30);
add_action('template_redirect', static function () {
    if (is_admin() || wp_doing_ajax() || is_feed() || (defined('REST_REQUEST') && REST_REQUEST)) { return; }
    if (!isset($_GET['rm_drive']) || (string)$_GET['rm_drive']!=='1') { return; }
    nocache_headers();
    header('X-Robots-Tag: noindex, follow',true);
    $lang=rm_touring_lang();$en=$lang==='en';
    $base=function_exists('pll_home_url')?pll_home_url($lang):home_url('/');
    $asset=plugins_url('assets/',__FILE__);
    $sections=rm_touring_filter_catalog(rm_touring_catalog($lang));
    $config=['lang'=>$lang,'home'=>$base,'sections'=>$sections,'version'=>RM_TOURING_VERSION,'scoreVersion'=>2,'scores'=>rest_url('ramon-touring/v1/scores'),'run'=>rest_url('ramon-touring/v1/run')];
    ?><!doctype html><html lang="<?php echo esc_attr($en?'en':'es'); ?>"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,follow"><meta name="referrer" content="strict-origin-when-cross-origin"><title><?php echo esc_html($en?'Driving mode | Ramón de Moya':'Modo conducción | Ramón de Moya'); ?></title><link rel="canonical" href="<?php echo esc_url($base); ?>"><link rel="stylesheet" href="<?php echo esc_url($asset.'touring.css?v='.RM_TOURING_VERSION); ?>"><link rel="modulepreload" href="<?php echo esc_url($asset.'touring.js?v='.RM_TOURING_VERSION); ?>"></head><body class="rm-touring-shell"><?php echo '<style>'.rm_touring_mode_css().'</style>'.rm_touring_mode_selector(true); ?><main id="rm-touring"><div class="header"><div><h1><?php echo esc_html($en?'Your route through my work':'Tu ruta por mi trabajo'); ?></h1></div><a href="<?php echo esc_url($base); ?>"><?php echo esc_html($en?'Return to the regular website':'Volver a la web normal'); ?></a></div><div id="rm-touring-app"><p><?php echo esc_html($en?'Loading the optional driving mode…':'Cargando el modo conducción…'); ?></p></div><noscript><p><?php echo esc_html($en?'Driving mode needs JavaScript. Use the regular website to read all content.':'El modo conducción necesita JavaScript. Puedes leer todo el contenido en la web normal.'); ?></p></noscript><script type="application/json" id="rm-touring-config"><?php echo wp_json_encode($config,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT); ?></script><script>
(function(){
  var app=document.getElementById('rm-touring-app');
  var home=<?php echo wp_json_encode($base); ?>;
  var en=<?php echo $en?'true':'false'; ?>;
  var drive=window.location.href;
  function fail(msg){
    if(!app||app.querySelector('.racer'))return;
    app.innerHTML='<p>'+msg+'</p><p><a href="'+drive+'">'+(en?'Retry':'Reintentar')+'</a> · <a href="'+home+'">'+(en?'Regular website':'Web normal')+'</a></p>';
  }
  window.addEventListener('error',function(e){ if(e&&e.filename&&String(e.filename).indexOf('ramon-touring')!==-1) fail(en?'The driving mode failed to load.':'No se pudo cargar el modo conducción.'); }, true);
  setTimeout(function(){ fail(en?'Still loading or blocked. Retry, or use the regular website.':'Sigue cargando o está bloqueado. Reintenta, o usa la web normal.'); }, 10000);
})();
</script><script type="module" src="<?php echo esc_url($asset.'touring.js?v='.RM_TOURING_VERSION); ?>"></script></main></body></html><?php
    exit;
}, 0);
