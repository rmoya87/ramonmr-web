<?php
// Catalog contract tests. No WordPress database connection.
define('ABSPATH','/tmp/');$actions=[];
function register_activation_hook($file,$callback){}
function rest_url($path){return home_url('/wp-json/'.$path);}
function check($condition){if(!$condition)throw new Exception('Catalog assertion failed');}
function add_action($name,$cb,$priority=10){global $actions;$actions[$name][$priority][]=$cb;}
function pll_current_language($field){return $_GET['lang']??'es';}
function pll_home_url($lang){return home_url($lang==='en'?'/en/':'/');}
function home_url($path='/'){return 'http://127.0.0.1:18763'.$path;}
function add_query_arg($args,$url){return $url.(str_contains($url,'?')?'&':'?').http_build_query($args);}
function wp_parse_url($url,$component){return parse_url($url,$component);}
function get_post_types(){return ['post','page','ohio_portfolio','attachment'];}
function get_posts($args){global $posts;return array_filter($posts,fn($x)=>$x->post_status==='publish'&&!$x->post_password);}
function pll_get_post_language($id,$field){global $langs;return $langs[$id];}
function get_permalink($post){return $post->url;}
function get_the_title($post){return $post->title;}
function wp_strip_all_tags($x){return strip_tags($x);}
function is_admin(){return false;}function wp_doing_ajax(){return false;}function is_feed(){return false;}
function nocache_headers(){header('Cache-Control: no-store');}
function plugins_url($path,$file){return home_url('/assets/');}
function esc_attr($x){return htmlspecialchars($x,ENT_QUOTES);}function esc_html($x){return htmlspecialchars($x,ENT_QUOTES);}function esc_url($x){return htmlspecialchars($x,ENT_QUOTES);}
function wp_json_encode($x,$flags=0){return json_encode($x,$flags);}
$posts=[];$langs=[];
foreach (['es','en'] as $lang) { foreach (['page','post','ohio_portfolio'] as $i=>$type) { $id=count($posts)+1;$langs[$id]=$lang;$posts[]=(object)['ID'=>$id,'title'=>$lang.' item '.$id,'post_type'=>$type,'post_status'=>'publish','post_password'=>'','url'=>home_url(($lang==='en'?'/en':'').'/sample-'.$id.'/')]; } }
require dirname(__DIR__).'/ramon-touring.php';
foreach (['es','en'] as $lang) { $catalog=rm_touring_catalog($lang);$items=array_merge(...array_column($catalog,'items'));check(count($items)===3);foreach($items as $item)check($langs[$item['id']]===$lang); }
$posts[]=(object)['ID'=>99,'title'=>'DRAFT','post_type'=>'post','post_status'=>'draft','post_password'=>'','url'=>home_url('/draft/')];$langs[99]='es';
$posts[]=(object)['ID'=>98,'title'=>'PASSWORD','post_type'=>'page','post_status'=>'publish','post_password'=>'protected','url'=>home_url('/protected/')];$langs[98]='es';
$posts[]=(object)['ID'=>97,'title'=>'FOREIGN','post_type'=>'post','post_status'=>'publish','post_password'=>'','url'=>'https://other.invalid/'];$langs[97]='es';
$all=json_encode(rm_touring_catalog('es'));foreach(['DRAFT','PASSWORD','FOREIGN'] as $bad)check(!str_contains($all,$bad));
echo "Catalog language and exclusion tests passed\n";
