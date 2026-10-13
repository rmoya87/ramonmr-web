<?php
/**
 * Title: Curriculum original convertido a bloques
 * Slug: ramon-native/cv
 * Categories: featured
 * Inserter: true
 */

$matches=get_posts(array('post_type'=>'page','post_status'=>'publish','meta_key'=>'ramon_package_post_id','meta_value'=>5,'posts_per_page'=>1));
if(!$matches)$matches=get_posts(array('post_type'=>'page','post_status'=>'publish','meta_key'=>'original_ramonmr_id','meta_value'=>5,'posts_per_page'=>1));
if($matches){echo $matches[0]->post_content;}else{echo '<!-- wp:paragraph --><p>Importa primero el contenido portable para usar este patrón.</p><!-- /wp:paragraph -->';}
?>
