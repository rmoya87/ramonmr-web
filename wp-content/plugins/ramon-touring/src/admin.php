<?php
/** Plugin settings: destination visibility via Options API. */
if (!defined('ABSPATH')) { exit; }

function rm_touring_settings_defaults(): array {
    return [
        'dest_disabled' => [],
        'exit_warn_m' => 220,
    ];
}

function rm_touring_get_settings(): array {
    $stored = get_option('rm_touring_settings', []);
    if (!is_array($stored)) { $stored = []; }
    return array_merge(rm_touring_settings_defaults(), $stored);
}

add_action('admin_menu', static function () {
    add_options_page('RM Touring Lab', 'RM Touring Lab', 'manage_options', 'rm-touring', 'rm_touring_render_settings');
});

add_action('admin_init', static function () {
    register_setting('rm_touring', 'rm_touring_settings', [
        'type' => 'array',
        'sanitize_callback' => static function ($input) {
            $out = rm_touring_settings_defaults();
            if (!is_array($input)) { return $out; }
            $out['exit_warn_m'] = max(80, min(500, (int)($input['exit_warn_m'] ?? 220)));
            $out['dest_disabled'] = array_values(array_unique(array_filter(array_map('intval', (array)($input['dest_disabled'] ?? [])))));
            return $out;
        },
        'default' => rm_touring_settings_defaults(),
    ]);
});

function rm_touring_render_settings(): void {
    if (!current_user_can('manage_options')) { return; }
    $settings = rm_touring_get_settings();
    $lang = function_exists('pll_current_language') ? (pll_current_language('slug') ?: 'es') : 'es';
    $catalog = function_exists('rm_touring_catalog') ? rm_touring_catalog($lang) : [];
    echo '<div class="wrap"><h1>RM Touring Lab</h1>';
    echo '<p>'.esc_html__('Ajustes del modo conducción. El contenido sigue viviendo en WordPress.', 'ramon-touring').'</p>';
    echo '<form method="post" action="options.php">';
    settings_fields('rm_touring');
    echo '<table class="form-table" role="presentation"><tr><th scope="row"><label for="rm_exit_warn">'.esc_html__('Distancia de aviso (m)', 'ramon-touring').'</label></th>';
    echo '<td><input name="rm_touring_settings[exit_warn_m]" id="rm_exit_warn" type="number" min="80" max="500" value="'.esc_attr((string)$settings['exit_warn_m']).'" class="small-text"></td></tr></table>';
    echo '<h2>'.esc_html__('Ocultar destinos en el juego', 'ramon-touring').'</h2><ul>';
    foreach ($catalog as $group) {
        foreach ($group['items'] as $item) {
            $id = (int)$item['id'];
            $checked = in_array($id, $settings['dest_disabled'], true) ? ' checked' : '';
            echo '<li><label><input type="checkbox" name="rm_touring_settings[dest_disabled][]" value="'.esc_attr((string)$id).'"'.$checked.'> '.esc_html($group['name'].' — '.$item['title']).'</label></li>';
        }
    }
    echo '</ul>';
    submit_button();
    echo '</form></div>';
}

function rm_touring_filter_catalog(array $groups): array {
    $disabled = rm_touring_get_settings()['dest_disabled'] ?? [];
    if (!$disabled) { return $groups; }
    foreach ($groups as &$group) {
        $group['items'] = array_values(array_filter($group['items'], static function ($item) use ($disabled) {
            return !in_array((int)$item['id'], $disabled, true);
        }));
    }
    unset($group);
    return array_values(array_filter($groups, static function ($g) { return !empty($g['items']); }));
}
