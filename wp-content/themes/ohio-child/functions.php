<?php

add_action( 'wp_enqueue_scripts', 'ohio_child_local_enqueue_parent_styles' );
function ohio_child_local_enqueue_parent_styles() {
	wp_enqueue_style( 'parent-style', get_template_directory_uri() . '/style.css' );
}

/* Permiso de nuevos formatos para ser subido a WP */
function agrega_mime_type ( $mime_types ) {
 $mime_types['webp'] = 'image/webp';
 $mime_types['svg'] = 'image/svg+xml';
 return $mime_types;}
add_filter('upload_mimes', 'agrega_mime_type', 1, 1);

/* Sección Mi cuenta - Unificando contenido de pestañas */
// Primero ocultamos la pestaña a mover
 
add_filter( 'woocommerce_account_menu_items', 'ayudawp_mover_direcciones', 999 );
  
function ayudawp_mover_direcciones( $items ) {
	unset($items['downloads']);
	unset($items['dashboard']);
	return $items;
} 
 
// Luego mostramos el contenido de las direcciones en otra pestaña (edit-account en este ejemplo)
 
add_action( 'woocommerce_account_edit-account_endpoint', 'woocommerce_account_edit_address' );

/* Auto Complete all WooCommerce orders.*/
add_action( 'woocommerce_thankyou', 'custom_woocommerce_auto_complete_order' );
function custom_woocommerce_auto_complete_order( $order_id ) { 
    if ( ! $order_id ) {
        return;
    }

    $order = wc_get_order( $order_id );
    $order->update_status( 'completed' );
}
/*** Quitar ficheros contacform en paginas que no se muestra */ 
add_filter ('wpcf7_load_js', '__return_false');
add_filter ('wpcf7_load_css', '__return_false');

/*** Quitar version WP */ 
remove_action ('wp_head', 'wp_generator');

/*** Change number of upsells output */
add_filter( 'woocommerce_upsell_display_args', 'wc_change_number_related_products', 20 );

function wc_change_number_related_products( $args ) {
	$args['posts_per_page'] = 4;
	$args['columns'] = 4; //change number of upsells here
	return $args;
}

add_filter('wp_get_attachment_image_attributes', 'change_attachement_image_attributes', 20, 2);

function change_attachement_image_attributes( $attr, $attachment ){
// Get post parent
$parent = get_post_field( 'post_parent', $attachment);

// Get post type to check if it's product

$type = get_post_field( 'post_type', $parent);
if( $type != 'product' ){
    return $attr;
}

/// Get title
$title = get_post_field( 'post_title', $parent);

if( $attr['alt'] == ''){
    $attr['alt'] = $title;
    $attr['title'] = $title;
}

return $attr;
}
