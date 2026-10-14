<?php
/** Isolated arcade scores. No account, email, cookies or visitor IP in score records. */
if (!defined('ABSPATH')) { exit; }
function rm_touring_scores_table() { global $wpdb; return $wpdb->prefix . 'rm_touring_scores'; }
function rm_touring_scores_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table=rm_touring_scores_table();$charset=$wpdb->get_charset_collate();
    dbDelta("CREATE TABLE $table (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        alias varchar(12) NOT NULL,
        score bigint(20) unsigned NOT NULL,
        created_at datetime NOT NULL,
        run_hash char(64) NOT NULL,
        score_version smallint unsigned NOT NULL DEFAULT 1,
        PRIMARY KEY  (id),
        UNIQUE KEY run_hash (run_hash),
        KEY score (score),
        KEY score_version (score_version)
    ) $charset;");
}
function rm_touring_run_signature($payload) { return hash_hmac('sha256',$payload,wp_salt('auth')); }
/**
 * Conservative ceiling for client rules (arcade top 195+0.85*t, max 305 km/h).
 * Not proof a score was earned.
 */
function rm_touring_score_ceiling($elapsed) {
    $blocks=intdiv($elapsed,30);$tail=$elapsed%30;
    $weighted_seconds=30*($blocks+.15*$blocks*($blocks-1)/2)+$tail*(1+.15*$blocks);
    $max_distance=305/3.6*$elapsed;
    $max_passes=12+ceil($max_distance/40);
    return (int)ceil(305/3.6*$weighted_seconds+500*$max_passes+2000);
}
function rm_touring_score_error($code,$message,$status=400) { return new WP_Error($code,$message,['status'=>$status]); }
add_action('rest_api_init',static function(){
    register_rest_route('ramon-touring/v1','/scores',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>static function($request){
        global $wpdb;$table=rm_touring_scores_table();
        $version=max(1,(int)$request->get_param('version'));
        // Prefer current score rules; fall back to all rows if column missing on old installs.
        $has_version=$wpdb->get_var($wpdb->prepare('SHOW COLUMNS FROM '.$table.' LIKE %s','score_version'));
        if($has_version){
            $rows=$wpdb->get_results($wpdb->prepare("SELECT alias, score, created_at FROM $table WHERE score_version=%d ORDER BY score DESC, id ASC LIMIT 10",$version),ARRAY_A);
            if(!$rows && $version>1){
                $rows=$wpdb->get_results("SELECT alias, score, created_at FROM $table ORDER BY score DESC, id ASC LIMIT 10",ARRAY_A);
            }
        }else{
            $rows=$wpdb->get_results("SELECT alias, score, created_at FROM $table ORDER BY score DESC, id ASC LIMIT 10",ARRAY_A);
        }
        if($wpdb->last_error){return rm_touring_score_error('unavailable','Scores unavailable',503);}
        return rest_ensure_response(['scores'=>array_map(static function($row){return ['alias'=>$row['alias'],'score'=>(int)$row['score'],'date'=>substr($row['created_at'],0,10)];},$rows?:[]),'score_version'=>$version]);
    }]);
    register_rest_route('ramon-touring/v1','/run',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>static function(){
        $payload=time().'.'.wp_generate_password(24,false,false);$response=rest_ensure_response(['token'=>$payload.'.'.rm_touring_run_signature($payload)]);$response->header('Cache-Control','no-store, private');return $response;
    }]);
    register_rest_route('ramon-touring/v1','/scores',['methods'=>'POST','permission_callback'=>'__return_true','callback'=>static function($request){
        global $wpdb;$origin=$request->get_header('origin');
        if(!$origin || rtrim(strtolower($origin),'/')!==strtolower(wp_parse_url(home_url('/'),PHP_URL_SCHEME).'://'.wp_parse_url(home_url('/'),PHP_URL_HOST).(wp_parse_url(home_url('/'),PHP_URL_PORT)?':'.wp_parse_url(home_url('/'),PHP_URL_PORT):''))){return rm_touring_score_error('origin','Invalid origin',403);}
        $body=$request->get_json_params();
        if(!is_array($body)||strlen((string)$request->get_body())>1024){return rm_touring_score_error('payload','Invalid payload');}
        $alias=strtoupper(trim((string)($body['alias']??'')));$token=(string)($body['token']??'');$score=$body['score']??null;
        $score_version=isset($body['score_version'])?(int)$body['score_version']:1;
        if($score_version<1||$score_version>2){return rm_touring_score_error('version','Unsupported score version');}
        if(!preg_match('/^[A-Z0-9][A-Z0-9 _-]{1,10}[A-Z0-9]$/D',$alias)){return rm_touring_score_error('alias','Use 3-12 letters or numbers');}
        $parts=explode('.',$token);if(count($parts)!==3||!preg_match('/^[0-9]+$/D',$parts[0])||strlen($parts[1])!==24||!hash_equals(rm_touring_run_signature($parts[0].'.'.$parts[1]),$parts[2])){return rm_touring_score_error('run','Invalid run',403);}
        $elapsed=time()-(int)$parts[0];
        if($elapsed<15||$elapsed>3600||!is_int($score)||$score<1||$score>rm_touring_score_ceiling($elapsed)){return rm_touring_score_error('score','Invalid score');}
        $table=rm_touring_scores_table();$run_hash=hash('sha256',$token);
        if((int)$wpdb->get_var("SELECT COUNT(*) FROM $table WHERE created_at > UTC_TIMESTAMP() - INTERVAL 1 MINUTE")>=30){return rm_touring_score_error('busy','Try again shortly',429);}
        $has_version=$wpdb->get_var($wpdb->prepare('SHOW COLUMNS FROM '.$table.' LIKE %s','score_version'));
        if($has_version){
            $saved=$wpdb->insert($table,['alias'=>$alias,'score'=>$score,'created_at'=>current_time('mysql',true),'run_hash'=>$run_hash,'score_version'=>$score_version],['%s','%d','%s','%s','%d']);
        }else{
            $saved=$wpdb->insert($table,['alias'=>$alias,'score'=>$score,'created_at'=>current_time('mysql',true),'run_hash'=>$run_hash],['%s','%d','%s','%s']);
        }
        if(!$saved){return rm_touring_score_error('save','Score not saved or run already used',409);}
        return rest_ensure_response(['saved'=>true,'score_version'=>$score_version]);
    }]);
});
