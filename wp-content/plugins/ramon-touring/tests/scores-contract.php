<?php
define('ABSPATH','/tmp/');define('ARRAY_A','ARRAY_A');$routes=[];
function add_action($name,$cb){$cb();}function register_rest_route($ns,$path,$x){global $routes;$routes[$x['methods'].$path]=$x['callback'];}function wp_salt($x){return 'test-secret';}function wp_generate_password($n,$s,$e){return str_repeat('x',$n);}function home_url($p){return 'https://test.invalid/';}function wp_parse_url($x,$k){return parse_url($x,$k);}function current_time($x,$utc){return gmdate('Y-m-d H:i:s');}function rest_ensure_response($x){return new Response($x);}class Response{public function __construct(public $data){}function header($a,$b){}}class WP_Error{function __construct(public $code,public $message,public $data){}}
class DB{public $prefix='wp_',$last_error='', $items=[];function get_results($q,$format){$a=$this->items;usort($a,fn($x,$y)=>$y['score']<=>$x['score']);return array_slice($a,0,10);}function get_var($q){return 0;}function insert($table,$x,$fmt){if($table!=='wp_rm_touring_scores')throw new Exception('wrong table');foreach($this->items as $y)if($y['run_hash']===$x['run_hash'])return false;$this->items[]=$x;return 1;}}
class Req{function __construct(public $body,public $origin='https://test.invalid'){}function get_header($x){return $this->origin;}function get_body(){return json_encode($this->body);}function get_json_params(){return $this->body;}}
$wpdb=new DB;require dirname(__DIR__).'/src/scores.php';
function check($x,$m){if(!$x)throw new Exception($m);echo "PASS $m\n";}
$post=$routes['POST/scores'];$payload=(time()-30).'.'.str_repeat('x',24);$token=$payload.'.'.rm_touring_run_signature($payload);$body=['alias'=>'racer','score'=>1000,'token'=>$token];
check($routes['GET/scores']()->data['scores']===[],'empty board');
check($post(new Req($body,'https://bad.invalid'))->code==='origin','reject wrong origin');
check($post(new Req($body,'http://test.invalid'))->code==='origin','reject wrong scheme');
check($post(new Req([...$body,'token'=>$token.'x']))->code==='run','reject tamper');
check($post(new Req([...$body,'alias'=>'<script>']))->code==='alias','reject html alias');
check($post(new Req([...$body,'score'=>9999999]))->code==='score','reject implausible score');
check($post(new Req([...$body,'score'=>'1000']))->code==='score','reject score string');
check($post(new Req($body))->data['saved']===true,'save valid');
check($post(new Req($body))->code==='save','reject replay');
$row=$routes['GET/scores']()->data['scores'][0];check(array_keys($row)===['alias','score','date']&&$row['alias']==='RACER','public only alias score date');
check(array_keys($wpdb->items[0])===['alias','score','created_at','run_hash'],'private stored fields minimal');

// Long runs: exact active-time distance formula used by the client, plus overtakes.
foreach([15,30,60,180,300,600,900,1800,3600] as $duration){
    $score=0.0;$speed=65.0;$dt=.1;$steps=(int)round($duration/$dt);
    for($i=0;$i<$steps;$i++){$time=($i+1)*$dt;$top=min(300,185+$time*.65);$speed=min(305,$speed+min(24,($top-$speed)*.65)*$dt);$score+=$speed/3.6*$dt*(1+floor($time/30)*.15);}
    $valid=(int)floor($score)+500*(int)floor(($duration*300/3.6)/45);
    check($valid<=rm_touring_score_ceiling($duration),'long run ceiling '.$duration.'s');
    $p=(time()-$duration).'.'.str_pad((string)$duration,24,'z');$t=$p.'.'.rm_touring_run_signature($p);
    check($post(new Req(['alias'=>'LONG','score'=>$valid,'token'=>$t]))->data['saved']===true,'long run saved '.$duration.'s');
    $bad=$post(new Req(['alias'=>'LONG','score'=>rm_touring_score_ceiling($duration)+1,'token'=>$t]));
    check($bad instanceof WP_Error && $bad->code==='score','reject over ceiling '.$duration.'s');
}
