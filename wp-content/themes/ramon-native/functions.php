<?php
/** Ramón Native: no data writes and no constructor dependencies. */
add_action( 'after_setup_theme', function () { add_theme_support( 'wp-block-styles' ); add_theme_support( 'editor-styles' ); add_editor_style( 'assets/site.css' ); } );
add_action( 'wp_enqueue_scripts', function () {
 wp_enqueue_style( 'ramon-native', get_theme_file_uri( 'assets/site.min.css' ), array(), wp_get_theme()->get('Version') );
 wp_enqueue_script( 'ramon-native-header', get_theme_file_uri( 'assets/header.js' ), array(), wp_get_theme()->get('Version'), array('in_footer'=>true,'strategy'=>'defer') );
 if ( is_singular() && ( str_contains( (string) get_post_field( 'post_content', get_queried_object_id() ), 'native-tabs' ) || str_contains( (string) get_post_field( 'post_content', get_queried_object_id() ), 'project-native-gallery' ) ) ) {
  wp_enqueue_script( 'ramon-native-tabs', get_theme_file_uri( 'assets/tabs.min.js' ), array(), wp_get_theme()->get('Version'), array('in_footer'=>true,'strategy'=>'defer') );
 }
} );

/* Decorations stay in CSS; meaningful labels are part of Navigation blocks. */

/* Mark cover-cropped heroes before WordPress adds responsive image attributes. */
add_filter( 'render_block_core/image', function ( $html, $block ) {
 if ( ! str_contains( $block['attrs']['className'] ?? '', 'project-hero-image' ) ) return $html;
 return preg_replace( '/class="wp-image-/', 'class="project-hero-source wp-image-', $html, 1 );
}, 10, 2 );
add_filter( 'wp_content_img_tag', function ( $image ) {
 if ( ! str_contains( $image, 'project-hero-source' ) ) return $image;
 $image = preg_replace( '/sizes="[^"]*"/', 'sizes="(max-width: 781px) 1543px, 100vw"', $image );
 return str_replace( 'loading="lazy"', 'loading="eager" fetchpriority="high"', $image );
}, 20 );

add_filter('render_block_core/paragraph', function($html,$block){
 if(($block['attrs']['className']??'')==='article-reading-time'){
  $value=get_post_meta(get_the_ID(),'native_reading_time',true);
  return '<p class="article-reading-time">'.esc_html($value).'</p>';
 }
 return $html;
},10,2);
add_filter('query_loop_block_query_vars',function($query,$block){
 if(($block->context['queryId']??0)===44){
  $ids=get_post_meta(get_queried_object_id(),'native_related_ids',true);
  $query['post__in']=is_array($ids)&&$ids?$ids:array(0);
  $query['orderby']='post__in';
 }
 return $query;
},10,2);
add_filter('render_block_core/button',function($html,$block){
 if(!is_singular(array('post','ohio_portfolio')))return $html;
 $url=rawurlencode(get_permalink());
 $routes=['https://www.linkedin.com/'=>'https://www.linkedin.com/sharing/share-offsite/?url='.$url,'https://x.com/'=>'https://x.com/intent/tweet?url='.$url,'https://www.facebook.com/'=>'https://www.facebook.com/sharer/sharer.php?u='.$url];
 foreach($routes as$from=>$to)$html=str_replace('href="'.$from.'"','href="'.esc_url($to).'"',$html);
 return $html;
},10,2);
add_filter('render_block_core/post-author',function($html){
 if(is_singular('post')&&file_exists(get_theme_file_path('assets/images/author-public.jpg')))$html=preg_replace('~<img[^>]+>~','<img src="'.esc_url(get_theme_file_uri('assets/images/author-public.jpg')).'" alt="Ramón de Moya" width="32" height="32">',$html,1);
 if(is_singular('post'))$html=preg_replace('~(<p class="wp-block-post-author__name">).*?(</p>)~','$1Ramón de Moya$2',$html);
 return $html;
});
add_action('wp_enqueue_scripts',function(){if(is_singular()&&str_contains((string)get_post_field('post_content',get_queried_object_id()),'native-service-carousel'))wp_enqueue_script('ramon-native-carousel',get_theme_file_uri('assets/carousel.js'),array(),wp_get_theme()->get('Version'),array('in_footer'=>true,'strategy'=>'defer'));});

/** Resolve preserved source routes against this installation, including plain permalinks. */
function ramon_native_local_url($url){
 static $routes=null;
 if($routes===null){$routes=array('/'=>home_url('/'));foreach(get_posts(array('post_type'=>array('page','post','ohio_portfolio'),'post_status'=>'publish','numberposts'=>-1))as$p){$source=get_post_meta($p->ID,'original_ramonmr_url',true);if($source){$path=wp_parse_url($source,PHP_URL_PATH);$routes[trailingslashit($path)]=get_permalink($p);}}$blog=get_term_by('slug','blog','category');if($blog)$routes['/blog/']=get_term_link($blog);foreach(get_terms(array('taxonomy'=>'category','hide_empty'=>false))as$t){$routes['/blog/'.$t->slug.'/']=get_term_link($t);}}
 $decoded=html_entity_decode($url,ENT_QUOTES);$host=wp_parse_url($decoded,PHP_URL_HOST);if($host&&!in_array($host,array('ramonmr.com',wp_parse_url(home_url(),PHP_URL_HOST)),true))return $url;
 $path=wp_parse_url($decoded,PHP_URL_PATH);if(wp_parse_url($decoded,PHP_URL_QUERY))return $url;if(!$path||!str_starts_with($path,'/'))return $url;
 $resolved=$routes[trailingslashit($path)]??null;if(!$resolved)return $url;$fragment=wp_parse_url($decoded,PHP_URL_FRAGMENT);return $resolved.($fragment?'#'.$fragment:'');
}
add_filter('render_block',function($html){
 $html=preg_replace_callback('~(href=["\'])([^"\']+)(["\'])~',function($m){return $m[1].esc_url(ramon_native_local_url($m[2])).$m[3];},$html);
 return preg_replace_callback('~(?:https?://[^"\'\s]+)?/wp-content/themes/ramon-native/([^"\'\s<>]+)~',function($m){return esc_url(get_theme_file_uri($m[1]));},$html);
},30);
add_filter('query_loop_block_query_vars',function($query,$block){
 if(get_queried_object_id()!==(int)get_option('page_on_front'))return $query;
 // Home projects: always use the latest three published by date.
 if(($block->context['queryId']??0)===2){
  unset($query['post__in']);
  $query['post_type']='ohio_portfolio';$query['post_status']='publish';
  $query['posts_per_page']=3;$query['orderby']='date';$query['order']='DESC';
  return $query;
 }
 $key=($block->context['queryId']??0)===1?'native_home_news':'';
 if($key){$ids=get_post_meta(get_queried_object_id(),$key,true);if(is_array($ids)&&$ids){$query['post__in']=$ids;$query['orderby']='post__in';}}
 return $query;
},20,2);
add_filter('comment_form_defaults',function($args){$args['title_reply']='Contestar';$args['label_submit']='Publicar el comentario';$args['comment_notes_before']='<p class="comment-notes">Tu dirección de correo electrónico no será publicada. Los campos obligatorios están marcados con *</p>';$args['comment_field']='<p class="comment-form-comment"><label for="comment">Comentario *</label><textarea id="comment" name="comment" rows="8" maxlength="65525" required></textarea></p>';return $args;});
add_filter('comment_form_default_fields',function($fields){$fields['author']='<p class="comment-form-author"><label for="author">Nombre *</label><input id="author" name="author" type="text" autocomplete="name" required></p>';$fields['email']='<p class="comment-form-email"><label for="email">Correo electrónico *</label><input id="email" name="email" type="email" autocomplete="email" required></p>';$fields['url']='<p class="comment-form-url"><label for="url">Web</label><input id="url" name="url" type="url" autocomplete="url"></p>';unset($fields['cookies']);return $fields;});
add_filter('comment_form_fields',function($fields){$comment=$fields['comment']??'';unset($fields['comment']);$fields['comment']=$comment;return $fields;});

add_filter('render_block_core/comments-title',function($html){$n=get_comments_number();return $n?'<h4 class="wp-block-comments-title">'.esc_html($n.' '.($n===1?'comentario':'comentarios')).'</h4>':'';});
add_filter('comment_reply_link',function($html){return str_replace('Reply','Responder',$html);});

/* Public source comment portraits, independent of private email addresses. */
add_filter('get_avatar_data',function($args,$identity){if(!($identity instanceof WP_Comment))return $args;$post=get_post_meta($identity->comment_post_ID,'ramon_package_post_id',true)?:$identity->comment_post_ID;$rows=json_decode(file_get_contents(get_theme_file_path('assets/comment-avatars.json')),true)?:array();foreach($rows as$r){if((int)$r['post']===(int)$post&&trim(str_replace(' dice:','',$r['author']))===$identity->comment_author){$args['url']=get_theme_file_uri('assets/images/comment-avatars/'.$r['file']);$args['found_avatar']=true;break;}}return $args;},10,2);

add_filter('render_block_core/query-title',function($html,$block){if(($block['attrs']['type']??'')==='search')return '<h1 class="wp-block-query-title">Results for: '.esc_html(get_search_query()).'</h1>';return $html;},10,2);

/* Keep public emoji portable without remote image calls. */
add_filter('emoji_svg_url',function(){return get_theme_file_uri('assets/images/emoji/');});
/* Public consent UI wording preserved independently of the bench locale. */
add_filter('gettext',function($translated,$text,$domain){if($domain!=='complianz-gdpr')return $translated;$labels=['Always active'=>'Siempre activo','Manage services'=>'Gestionar los servicios','Manage options'=>'Administrar opciones','Read more about these purposes'=>'Leer más sobre estos propósitos'];return $labels[$text]??$translated;},10,3);
/* Demo posts on a clean import are not part of the preserved site listings. */
add_filter('query_loop_block_query_vars',function($query,$block){$type=$query['post_type']??'post';if($type==='post'||(is_array($type)&&in_array('post',$type,true))){$sample=get_page_by_path('hello-world',OBJECT,'post');if($sample&&!get_post_meta($sample->ID,'original_ramonmr_id',true)&&!get_post_meta($sample->ID,'ramon_package_post_id',true))$query['post__not_in']=array_merge($query['post__not_in']??[],[$sample->ID]);}return $query;},30,2);
/* Public structured data follows the destination installation, not old host URLs. */
add_filter('rank_math/json_ld',function($data){$stored=get_post_meta(get_queried_object_id(),'native_public_schema',true);if(!is_array($stored)||!$stored)return $data;$graph=[];foreach($stored as$doc)if(isset($doc['@graph']))$graph=array_merge($graph,$doc['@graph']);if(!$graph)return $data;$walk=function($value)use(&$walk){if(is_array($value)){foreach($value as&$v)$v=$walk($v);return $value;}if(!is_string($value))return $value;if(str_starts_with($value,'https://ramonmr.com/wp-content/uploads/')){static $media=null;if($media===null){$media=[];foreach(get_posts(['post_type'=>'attachment','post_status'=>'inherit','numberposts'=>-1])as$a){$src=get_post_meta($a->ID,'ramon_source_url',true);if($src)$media[$src]=wp_get_attachment_url($a->ID);}}return $media[$value]??$value;}if(str_starts_with($value,'https://ramonmr.com')){if(str_starts_with($value,'https://ramonmr.com/?s=')||str_starts_with($value,'https://ramonmr.com/#')||$value==='https://ramonmr.com')return str_replace('https://ramonmr.com',untrailingslashit(home_url('/')),$value);return ramon_native_local_url($value);}return $value;};$out=[];foreach($walk($graph)as$i=>$node)$out['preserved'.$i]=$node;return $out;},90);

/* Form assets follow actual rendered blocks, including template parts and synced patterns.
 * Block themes render their template before wp_head/enqueue; classic themes fail open.
 * Core and vendor files are not changed. */
add_filter( 'render_block', function ( $html ) {
 if ( strpos( (string) $html, 'wpcf7-form' ) !== false || strpos( (string) $html, 'class="wpcf7"' ) !== false ) {
  $GLOBALS['ramon_native_has_cf7'] = true;
 }
 return $html;
}, 999 );
function ramon_native_needs_form_assets() {
 if ( is_admin() || ! function_exists( 'wp_is_block_theme' ) || ! wp_is_block_theme() ) return true;
 return ! empty( $GLOBALS['ramon_native_has_cf7'] );
}
add_action( 'wp_enqueue_scripts', function () {
 if ( ramon_native_needs_form_assets() ) return;
 wp_dequeue_style( 'contact-form-7' );
 wp_dequeue_script( 'contact-form-7' );
 wp_dequeue_script( 'swv' );
 wp_dequeue_script( 'google-recaptcha' );
 wp_dequeue_script( 'wpcf7-recaptcha' );
}, 110 );

/* v1.6.60: reCAPTCHA (CF7) loads on first user interaction instead of on every page load. CF7 config untouched. */
add_action('wp_enqueue_scripts',function(){
 if(!ramon_native_needs_form_assets() || !class_exists('WPCF7_RECAPTCHA'))return;
 $service=WPCF7_RECAPTCHA::get_instance();
 $key=method_exists($service,'get_sitekey')?$service->get_sitekey():null;
 if(!$key)return;
 $GLOBALS['ramon_recaptcha_sitekey']=$key;
 wp_dequeue_script('google-recaptcha');
 wp_dequeue_script('wpcf7-recaptcha');
},100);
add_action('wp_footer',function(){
 $key=$GLOBALS['ramon_recaptcha_sitekey']??null;
 if(!$key)return;
 ?>
<script>(function(){var key=<?php echo wp_json_encode($key); ?>,loaded=null;
function load(){if(loaded)return loaded;loaded=new Promise(function(ok,ko){var s=document.createElement('script');s.src='https://www.google.com/recaptcha/api.js?render='+key;s.async=true;s.onload=function(){window.grecaptcha&&grecaptcha.ready(function(){ok()})};s.onerror=ko;document.head.appendChild(s)});return loaded}
['pointerdown','touchstart','scroll','keydown','focusin'].forEach(function(ev){window.addEventListener(ev,function(){load()},{once:true,passive:true})});
function arm(){if(typeof wpcf7==='undefined'||typeof wpcf7.submit!=='function'||wpcf7.submit.__rc){return}var orig=wpcf7.submit;var wrapped=function(form,data){data=data||{};load().then(function(){return grecaptcha.execute(key,{action:'contactform'})}).then(function(token){var fields=(form.tagName==='FORM'?form:document).querySelectorAll('input[name="_wpcf7_recaptcha_response"]');for(var i=0;i<fields.length;i++)fields[i].value=token;orig(form,data)}).catch(function(e){console.error(e)})};wrapped.__rc=true;wpcf7.submit=wrapped}
document.addEventListener('DOMContentLoaded',arm);arm();var tries=0;var iv=setInterval(function(){if(typeof wpcf7!=='undefined'&&typeof wpcf7.submit==='function'&&wpcf7.submit.__rc){clearInterval(iv);return}arm();if(++tries>60)clearInterval(iv)},250);})();</script>
 <?php
},5);

/* v1.6.62: reCAPTCHA badge only visible while a CF7 form is on screen (Google allows hiding it elsewhere when it stays visible in the form context). */
add_action('wp_head',function(){
 if(empty($GLOBALS['ramon_recaptcha_sitekey']))return;
 echo '<style>.grecaptcha-badge{visibility:hidden;opacity:0;transition:opacity .25s}.grecaptcha-badge.rc-on{visibility:visible;opacity:1}</style>'."\n";
},2);
add_action('wp_footer',function(){
 if(empty($GLOBALS['ramon_recaptcha_sitekey']))return;
 ?>
<script>(function(){function badge(){return document.querySelector('.grecaptcha-badge')}
function show(on){var b=badge();if(b)b.classList.toggle('rc-on',!!on)}
var bd=null;
function badge(){if(!bd)bd=document.querySelector('.grecaptcha-badge');return bd}
function update(){var b=badge();if(!b)return;var vis=false;document.querySelectorAll('form.wpcf7-form').forEach(function(f){var r=f.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)vis=true});b.classList.toggle('rc-on',vis)}
window.addEventListener('scroll',function(){requestAnimationFrame(update)},{passive:true});
window.addEventListener('resize',update);
setInterval(update,1000);
})();</script>
 <?php
},6);

/* v1.6.59: preload the hero LCP image (CSS background, discovered late by the browser). */
add_action('wp_head',function(){
 if(is_front_page())echo '<link rel="preload" as="image" href="'.esc_url(get_theme_file_uri('assets/images/hero-cv-portrait.webp')).'" fetchpriority="high">'."\n";
 if(is_page(338))echo '<link rel="preload" as="image" href="'.esc_url(get_theme_file_uri('assets/images/hero-cv-likeness.webp')).'" fetchpriority="high" media="(min-width:782px)">'."\n";
},1);

/* v1.6.58: Article schema for portfolio entries (Rank Math has no Titles & Meta tab for ohio_portfolio). */
add_filter('rank_math/json_ld',function($data){
 if(!function_exists('is_singular')||!is_singular('ohio_portfolio'))return $data;
 $post=get_queried_object();
 if(!($post instanceof WP_Post))return $data;
 $desc=get_post_meta($post->ID,'rank_math_description',true);
 if(!$desc)$desc=has_excerpt($post)?get_the_excerpt($post):wp_strip_all_tags(get_the_title($post));
 $img=get_the_post_thumbnail_url($post,'full');
 $node=[
  '@type'=>'Article',
  '@id'=>get_permalink($post).'#article',
  'headline'=>wp_strip_all_tags(get_the_title($post)),
  'description'=>$desc,
  'datePublished'=>get_post_time('c',true,$post),
  'dateModified'=>get_post_modified_time('c',true,$post),
  'mainEntityOfPage'=>['@type'=>'WebPage','@id'=>get_permalink($post)],
  'author'=>['@type'=>'Person','name'=>'Ramón de Moya','url'=>untrailingslashit(home_url('/'))],
 ];
 if($img)$node['image']=$img;
 $data['portfolio-article']=$node;
 return $data;
},95);
/* Closed project discussions do not leave an empty visual section. */
add_filter('render_block_core/comments',function($html,$block){if(str_contains($block['attrs']['className']??'','portfolio-native-comments')&&!comments_open())return '';return $html;},20,2);
/* Keep the original project type and public routes when Ohio's theme filters are absent. */
add_filter('register_post_type_args',function($args,$type){if($type!=='ohio_portfolio')return $args;$args['rewrite']=array_merge(is_array($args['rewrite']??null)?$args['rewrite']:[],['slug'=>'portfolio','with_front'=>false]);$args['show_in_rest']=true;return $args;},100,2);
add_action('init',function(){
 if(!post_type_exists('ohio_portfolio'))register_post_type('ohio_portfolio',['labels'=>['name'=>'Proyectos','singular_name'=>'Proyecto'],'public'=>true,'show_in_rest'=>true,'has_archive'=>false,'rewrite'=>['slug'=>'portfolio','with_front'=>false],'supports'=>['title','editor','thumbnail','excerpt','revisions','custom-fields']]);
 if(!taxonomy_exists('ohio_portfolio_category'))register_taxonomy('ohio_portfolio_category',['ohio_portfolio'],['label'=>'Categorías de proyecto','public'=>true,'hierarchical'=>true,'show_in_rest'=>true,'rewrite'=>['slug'=>'portfolio-category']]);
 if(!taxonomy_exists('ohio_portfolio_tags'))register_taxonomy('ohio_portfolio_tags',['ohio_portfolio'],['label'=>'Etiquetas de proyecto','public'=>true,'show_in_rest'=>true,'rewrite'=>['slug'=>'portfolio-tag']]);
},50);
/* Flush after the next request loads the new theme's type filters, never on every request. */
add_action('after_switch_theme',function(){flush_rewrite_rules(false);});

/* Version por fecha de archivo para los JS del tema que cambian a menudo (header.js y tabs.min.js). */
function ramon_native_file_version( $src ) {
 foreach ( array( 'header.js', 'tabs.min.js', 'site.min.css', 'reveal.js' ) as $f ) {
  if ( strpos( (string) $src, '/assets/' . $f ) !== false ) {
   $t = @filemtime( get_theme_file_path( 'assets/' . $f ) );
   return $t ? (string) $t : '';
  }
 }
 return '';
}

/* Cache-busting: a global optimizer strips ?ver= from every asset; re-append the theme version for this theme's own assets only. */
add_filter( 'style_loader_src', 'ramon_native_asset_version', 9999 );
add_filter( 'script_loader_src', 'ramon_native_asset_version', 9999 );
function ramon_native_asset_version( $src ) {
 if ( strpos( (string) $src, '/themes/ramon-native/' ) === false ) return $src;
 $fv = ramon_native_file_version( (string) $src );
 $v = $fv !== '' ? $fv : wp_get_theme()->get( 'Version' );
 return add_query_arg( 'ver', $v, remove_query_arg( 'ver', $src ) );
}

/* Same cache-bust at tag level, in case the global stripper removes ver after the src filters. */
add_filter( 'style_loader_tag', 'ramon_native_asset_version_tag', 9999 );
add_filter( 'script_loader_tag', 'ramon_native_asset_version_tag', 9999 );
function ramon_native_asset_version_tag( $tag ) {
 $v = wp_get_theme()->get( 'Version' );
 return preg_replace_callback( '~(href|src)=([\'"])([^\'"]*/themes/ramon-native/[^\'"]*)\2~', function ( $m ) use ( $v ) {
  $fv = ramon_native_file_version( $m[3] );
  $asset_v = $fv !== '' ? $fv : $v;
  $url = add_query_arg( 'ver', $asset_v, remove_query_arg( 'ver', html_entity_decode( $m[3] ) ) );
  return $m[1] . '=' . $m[2] . esc_url( $url ) . $m[2];
 }, $tag );
}

/* Footer: anio dinamico en el copyright (sin tocar el HTML del template part). */
add_filter( 'render_block_core/template-part', 'ramon_native_footer_year', 10, 2 );
function ramon_native_footer_year( $html, $block ) {
 if ( ( $block['attrs']['slug'] ?? '' ) !== 'footer' ) return $html;
 return preg_replace( '/© \d{4},/', '© ' . gmdate( 'Y' ) . ',', $html );
}

/* v1.6.13: fade al hacer scroll + hovers (seguro: sweep revela lo ya pasado; sin IO/reduced-motion todo visible). */
add_action( 'wp_footer', 'ramon_native_reveal_js', 100 );
function ramon_native_reveal_js() {
 ?>
<script>
(function(){if(!('IntersectionObserver' in window))return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var els=Array.prototype.slice.call(document.querySelectorAll('.section,.method-card,.project-card,.small-card'));function show(el){el.classList.add('in-view');}function sweep(){els.forEach(function(el){if(el.classList.contains('in-view'))return;if(el.getBoundingClientRect().top<window.innerHeight*0.98)show(el);});}document.body.classList.add('io');var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);o.unobserve(e.target);}})},{rootMargin:'0px 0px -5% 0px'});els.forEach(function(el){if(el.getBoundingClientRect().top>=window.innerHeight*0.95){o.observe(el);}else{show(el);}});var t;window.addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(sweep,120);},{passive:true});sweep();})();
</script>
 <?php
}

/* Project prev/next navigation as visual cards (single ohio_portfolio). */
add_shortcode( 'native_project_nav', function () {
 if ( ! is_singular( 'ohio_portfolio' ) ) return '';
 $prev = get_adjacent_post( false, '', true );
 $next = get_adjacent_post( false, '', false );
 if ( ! $prev && ! $next ) return '';
 $arrow_svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 12h15M13 5.5 19.5 12 13 18.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 $card = function ( $post, $dir ) use ( $arrow_svg ) {
  $img = get_the_post_thumbnail( $post->ID, 'large', array( 'class' => 'project-nav-card-img', 'loading' => 'lazy' ) );
  $label = 'prev' === $dir ? 'Proyecto anterior' : 'Proyecto siguiente';
  return '<a class="project-nav-card project-nav-card-' . $dir . '" href="' . esc_url( get_permalink( $post ) ) . '">'
   . '<span class="project-nav-card-arrow" aria-hidden="true">' . $arrow_svg . '</span>'
   . '<span class="project-nav-card-media">' . $img . '</span>'
   . '<span class="project-nav-card-body"><span class="project-nav-card-label">' . esc_html( $label ) . '</span>'
   . '<span class="project-nav-card-title">' . esc_html( get_the_title( $post ) ) . '</span></span>'
   . '</a>';
 };
 $out = '<div class="project-nav-cards content-width">';
 if ( $prev ) $out .= $card( $prev, 'prev' );
 if ( $next ) $out .= $card( $next, 'next' );
 return $out . '</div>';
} );

/* 1.6.55 - Permitir subidas de capturas largas sin el reescalado automático de WP (big image 2560) */
add_filter( 'big_image_size_threshold', '__return_false' );

/* v1.6.65: fade-in de tarjetas al hacer scroll (respeta prefers-reduced-motion via CSS) */
add_action('wp_enqueue_scripts',function(){wp_enqueue_script('ramon-native-reveal',get_theme_file_uri('assets/reveal.js'),array(),wp_get_theme()->get('Version'),array('in_footer'=>true,'strategy'=>'defer'));});
/* Project cards: bottom titles, no redundant category label. Home and portfolio only. */
add_action('wp_head', function(){ if(!is_front_page() && !is_page(249)) return; ?>
<style id="ramon-project-card-ui">
body:is(.home,.page-id-249) .native-project-grid .project-overlay{display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;text-align:left;inset:0;padding:24px;background:linear-gradient(180deg,transparent 35%,rgba(0,0,0,.82) 100%);color:#fff}
body:is(.home,.page-id-249) .native-project-grid .project-overlay .wp-block-post-terms{display:none}
body:is(.home,.page-id-249) .native-project-grid .project-overlay .wp-block-post-title{margin:0;font-size:20px;line-height:1.25;text-shadow:0 1px 3px #0006;text-wrap:balance;max-width:100%}
@media(max-width:781px){body:is(.home,.page-id-249) .native-project-grid .project-overlay{padding:16px 14px}body:is(.home,.page-id-249) .native-project-grid .project-overlay .wp-block-post-title{font-size:17px;line-height:1.3}}
</style>
<?php });
/* Submenu glass is on the container only, not duplicated on its items. */
add_action('wp_head',function(){ ?>
<style id="ramon-submenu-single-glass">
.site-header .main-nav .wp-block-navigation__submenu-container .wp-block-navigation-item,.site-header .main-nav .wp-block-navigation__submenu-container .wp-block-navigation-item__content{background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important}
</style>
<?php });
/* Navigation: exact page plus section parent, with readable hover and keyboard focus. */
add_filter('render_block_core/navigation',function($html){
 $path=trailingslashit(wp_parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH)?:'/');
 return preg_replace_callback('~<a\b([^>]*?)href=([\'"])([^\'"]+)\2([^>]*)>~',function($m)use($path){
  $href=html_entity_decode($m[3],ENT_QUOTES);
  if(wp_parse_url($href,PHP_URL_HOST)!==wp_parse_url(home_url('/'),PHP_URL_HOST))return $m[0];
  $route=trailingslashit(wp_parse_url($href,PHP_URL_PATH)?:'/');
  $exact=$route===$path;
  $section=($route==='/blog/'&&(is_singular('post')||is_category()||str_starts_with($path,'/blog/')))
   ||($route==='/portfolio/'&&(is_singular('ohio_portfolio')||str_starts_with($path,'/portfolio/')))
   ||($route==='/servicios/'&&str_starts_with($path,'/servicios/'));
  if(!$exact&&!$section)return $m[0];
  $tag=$m[0];
  $tag=preg_replace('/class=([\'"])(.*?)\1/', 'class="$2 rm-nav-active"', $tag, 1);
  if($exact&&!str_contains($tag,'aria-current='))$tag=substr($tag,0,-1).' aria-current="page">';
  return $tag;
 },$html);
},50);
add_action('wp_head',function(){ ?>
<style id="ramon-navigation-state">
.site-header .header-row::before{background:rgba(255,255,255,.84)}
.site-header .main-nav .wp-block-navigation-item__content{color:#1d1d1f!important;opacity:1!important;transition:color .18s ease}
.site-header .main-nav .wp-block-navigation-item__content:hover{color:#595959!important;opacity:1!important}
.site-header .main-nav .wp-block-navigation-item__content.rm-nav-active{color:#004EFF!important;opacity:1!important}
.site-header .main-nav .wp-block-navigation-item:has(>.rm-nav-active){color:#004EFF}
.site-header .main-nav .wp-block-navigation-item__content:focus-visible,.site-header .main-nav .wp-block-navigation__submenu-icon:focus-visible{outline:2px solid #004EFF;outline-offset:4px;border-radius:4px}
</style>
<?php });
/* Blog archive header: remove English template label and fixed empty space. */
add_filter('render_block_core/group',function($html,$block){
 if(!str_contains($block['attrs']['className']??'','archive-header'))return $html;
 return preg_replace('~<p\b[^>]*>\s*(?:Category|Tag|Archive|Author|Date)\s*</p>~i','',$html);
},50,2);
add_action('wp_head',function(){ if(!is_archive())return; ?>
<style id="ramon-blog-archive-spacing">
.native-landing:has(.listing-grid.native-news-grid) .listing-header{height:auto!important;min-height:0;padding-top:160px;padding-bottom:40px}
.native-landing:has(.listing-grid.native-news-grid) .listing-content{padding-top:0!important;margin-top:0}
@media(max-width:781px){.native-landing:has(.listing-grid.native-news-grid) .listing-header{padding-top:130px;padding-bottom:28px}}
</style>
<?php });
/* Blog cards: title, metadata, category, and bottom reading link. */
add_action('wp_head',function(){ ?>
<style id="ramon-blog-card-ui">
.native-news-grid .news-overlay{display:grid!important;grid-template-columns:max-content 1fr;grid-template-rows:auto auto auto 1fr;align-content:stretch;align-items:start;justify-content:stretch;gap:12px 6px;padding:24px!important;background:linear-gradient(180deg,rgba(11,16,30,.84),rgba(11,16,30,.70) 65%,rgba(11,16,30,.88))!important;color:#fff!important;inset:0}
.native-news-grid .news-overlay .wp-block-post-title{order:0;grid-column:1/-1;margin:0!important;font-size:22px!important;line-height:1.3!important;text-wrap:balance;color:#fff!important}
.native-news-grid .news-overlay .wp-block-post-title a{color:#fff!important}
.native-news-grid .news-overlay .wp-block-post-date{order:1;margin:0!important;font-size:13px;color:#eef2ff!important}
.native-news-grid .news-overlay .article-reading-time{order:2;margin:0!important;font-size:13px;color:#eef2ff!important}
.native-news-grid .news-overlay .article-reading-time::before{content:"• ";color:#b4c7ff}
.native-news-grid .news-overlay .wp-block-post-terms{order:3;grid-column:1/-1;margin:0!important;font-size:13px}
.native-news-grid .news-overlay .wp-block-post-terms a{display:inline-block;background:rgba(255,255,255,.16);color:#fff!important;padding:6px 10px;border-radius:7px}
.native-news-grid .news-overlay .wp-block-read-more{order:4;align-self:end;grid-column:1/-1;margin:auto 0 0!important;padding-top:18px;color:#fff!important;font-size:16px}
.native-news-grid .news-overlay a:focus-visible{outline:2px solid #fff;outline-offset:4px;border-radius:3px}
@media(max-width:781px){.native-news-grid .news-overlay{padding:22px 18px!important}.native-news-grid .news-overlay .wp-block-post-title{font-size:23px!important}}
</style>
<?php });

/* Home cards use the same metadata and reading link as archive cards. */
add_filter('render_block_core/group',function($html,$block,$instance){
 if(!str_contains($block['attrs']['className']??'','news-overlay')) return $html;
 $post_id=$instance->context['postId']??get_the_ID();
 if(get_post_type($post_id)!=='post')return $html;
 if(!str_contains($html,'article-reading-time')){
  $reading=get_post_meta($post_id,'native_reading_time',true);
  if($reading) $html=preg_replace('/(<div[^>]*class="[^"]*wp-block-post-date[^>]*>.*?<\/div>)/s','$1<p class="article-reading-time">'.esc_html($reading).'</p>',$html,1);
 }
 if(!str_contains($html,'wp-block-read-more')){
  $html=preg_replace('/<\/div>\s*$/','<a class="wp-block-read-more" href="'.esc_url(get_permalink($post_id)).'">Leer más →<span class="screen-reader-text">: '.esc_html(get_the_title($post_id)).'</span></a></div>',$html,1);
 }
 return $html;
},20,3);