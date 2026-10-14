<?php
/**
 * Plugin Name: Ramon Touring
 * Description: Modo de conducción opcional con lectura del contenido publicado de WordPress.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Author: Ramón de Moya
 * License: GPL-2.0-or-later
 */
if (!defined('ABSPATH')) { exit; }
const RM_TOURING_VERSION = '1.0.0';
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
/** No option, rewrite, content or database mutation on activation/deactivation. */
add_action('wp_footer', static function () {
    if (is_admin() || is_feed() || isset($_GET['rm_drive']) || isset($_GET['rm_reader'])) { return; }
    $en=rm_touring_lang()==='en';
    echo '<nav aria-label="'.esc_attr($en?'Optional experience':'Experiencia opcional').'" style="text-align:center;padding:16px"><a href="'.esc_url(rm_touring_url()).'">'.esc_html($en?'Explore in driving mode':'Explorar en modo conducción').'</a></nav>';
}, 30);
add_action('template_redirect', static function () {
    if (is_admin() || wp_doing_ajax() || is_feed() || (defined('REST_REQUEST') && REST_REQUEST)) { return; }
    if (!isset($_GET['rm_drive']) || (string)$_GET['rm_drive']!=='1') { return; }
    // An independent opt-in view. Existing site templates and canonical URLs stay unchanged.
    nocache_headers();
    header('X-Robots-Tag: noindex, follow',true);
    $lang=rm_touring_lang();$en=$lang==='en';
    $base=function_exists('pll_home_url')?pll_home_url($lang):home_url('/');
    $asset=plugins_url('assets/',__FILE__);
    $config=['lang'=>$lang,'home'=>$base,'sections'=>rm_touring_catalog($lang),'version'=>RM_TOURING_VERSION];
    ?><!doctype html><html lang="<?php echo esc_attr($en?'en':'es'); ?>"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><meta name="referrer" content="strict-origin-when-cross-origin"><title><?php echo esc_html($en?'Driving mode | Ramón de Moya':'Modo conducción | Ramón de Moya'); ?></title><link rel="canonical" href="<?php echo esc_url($base); ?>"><link rel="stylesheet" href="<?php echo esc_url($asset.'touring.css?v='.RM_TOURING_VERSION); ?>"></head><body class="rm-touring-shell"><main id="rm-touring"><div class="header"><div><p>RM / TOURING LAB</p><h1><?php echo esc_html($en?'Your route through my work':'Tu ruta por mi trabajo'); ?></h1></div><a href="<?php echo esc_url($base); ?>"><?php echo esc_html($en?'Return to the regular website':'Volver a la web normal'); ?></a></div><div id="rm-touring-app"><p><?php echo esc_html($en?'Loading the optional driving mode. All content remains available on the regular website.':'Cargando el modo conducción opcional. Todo el contenido sigue disponible en la web normal.'); ?></p></div><noscript><p><?php echo esc_html($en?'Driving mode needs JavaScript. Use the regular website to read all content.':'El modo conducción necesita JavaScript. Puedes leer todo el contenido en la web normal.'); ?></p></noscript><script type="application/json" id="rm-touring-config"><?php echo wp_json_encode($config,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT); ?></script><script type="module" src="<?php echo esc_url($asset.'touring.js?v='.RM_TOURING_VERSION); ?>"></script></main></body></html><?php
    exit;
}, 0);
