<?php
// Isolated WordPress boundary checks; no database, WordPress install or network is modified.
define('ABSPATH', __DIR__ . '/');
$actions = []; $filters = []; $routes = [];
function add_action($name, $callback, ...$args) { global $actions; $actions[$name][] = $callback; }
function add_filter($name, $callback, ...$args) { global $filters; $filters[$name][] = $callback; }
function register_activation_hook(...$args) {}
function register_rest_route($namespace, $path, $options) { global $routes; $routes[$path][$options['methods']] = $options; }
function __return_false() { return false; }
function __return_empty_array() { return []; }
class WP_Error {
    public $data;
    public function __construct($code, $message, $data) { $this->data = $data; }
}
function is_wp_error($value) { return $value instanceof WP_Error; }
class WP_REST_Response {
    public $data;
    public function __construct($data) { $this->data = $data; }
    public function header($key, $value) {}
}
function rest_ensure_response($value) { return new WP_REST_Response($value); }
function wp_json_encode($value) { return json_encode($value); }
class WP_REST_Request implements ArrayAccess {
    private $params = [];
    public function get_param($key) { return $this->params[$key] ?? null; }
    public function set_param($key, $value) { $this->params[$key] = $value; }
    public function get_json_params() { return $this->params; }
    public function offsetExists($key): bool { return isset($this->params[$key]); }
    public function offsetGet($key): mixed { return $this->get_param($key); }
    public function offsetSet($key, $value): void { $this->set_param($key, $value); }
    public function offsetUnset($key): void { unset($this->params[$key]); }
}
class WP_Query {
    public static $last_args;
    public $posts = [];
    public $found_posts = 0;
    public function __construct($args) { self::$last_args = $args; }
}
function expect($condition, $message) { if (!$condition) throw new RuntimeException($message); }
require dirname(__DIR__) . '/glr-cms/glr-cms.php';
expect(glr_service_allowed() === false, 'Anonymous CMS access must fail');
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer invalid';
expect(glr_service_allowed() === false, 'Invalid key must fail');
expect(glr_permission()->data['status'] === 401, 'Authentication failure must be 401');
$request = new WP_REST_Request();
$request->set_param('limit', '-1'); $request->set_param('featured', 'false'); $request->set_param('category', 'travel');
glr_query($request);
$args = WP_Query::$last_args;
expect($args['post_status'] === ['publish', 'future'], 'Draft and archived content must never be queried');
expect($args['date_query'][0]['column'] === 'post_date_gmt' && $args['date_query'][0]['inclusive'] === true, 'Scheduled publications must use the GMT cutoff');
expect(strtotime($args['date_query'][0]['before'] . ' UTC') <= time(), 'Future content must be excluded');
expect($args['posts_per_page'] === -1, 'Unlimited featured query must not truncate');
expect($args['meta_query'][0]['value'] === '0', 'Featured=false must filter explicitly');
expect($args['tax_query'][0]['terms'] === 'travel', 'Category must constrain the query');
$request->set_param('limit', '1000'); glr_query($request);
expect(WP_Query::$last_args['posts_per_page'] === 24, 'Public pagination must be bounded');
expect(call_user_func($filters['comments_open'][0]) === false, 'Comments must be closed');
expect(call_user_func($filters['pings_open'][0]) === false, 'Pingbacks must be closed');
$closed = call_user_func($filters['wp_insert_post_data'][0], ['comment_status' => 'open', 'ping_status' => 'open']);
expect($closed['comment_status'] === 'closed' && $closed['ping_status'] === 'closed', 'New and edited posts must force comments closed');
expect(call_user_func($filters['rest_pre_insert_comment'][0])->data['status'] === 403, 'REST comment submission must fail');
$blocked = false;
try { glr_store_asset(['id' => 'test'], '<svg onload="alert(1)"></svg>'); } catch (InvalidArgumentException $e) { $blocked = true; }
expect($blocked, 'Executable image formats must be rejected');
foreach ($actions['rest_api_init'] as $register) $register();
foreach (array_keys($routes) as $path) expect(strpos($path, '/migration/') !== 0, 'Retired import and audit endpoints must stay removed');
foreach ($routes as $path => $methods) foreach ($methods as $route) expect($route['permission_callback'] === 'glr_permission', 'Every GLR endpoint must authenticate');
class SubscriberDatabase {
    public $prefix = 'test_';
    public $record;
    public function prepare($sql, ...$args) { return $sql; }
    public function query($sql) { return true; }
    public function get_var($sql) { return json_encode($this->record); }
    public function update($table, $data, $where) { $this->record = json_decode($data['data'], true); return 1; }
}
$wpdb = new SubscriberDatabase();
$wpdb->record = ['id' => 'subscriber-test', 'email' => 'nobody@example.invalid', 'status' => 'pending', 'confirmation_nonce_hash' => str_repeat('a', 64), 'confirmation_expires_at' => gmdate('c', time() + 60)];
$request = new WP_REST_Request();
foreach (['id' => 'subscriber-test', 'status' => 'active', 'expected_nonce_hash' => str_repeat('b', 64)] as $key => $value) $request->set_param($key, $value);
$activate = $routes['/subscribers/(?P<id>[a-zA-Z0-9-]{1,128})']['PATCH']['callback'];
expect($activate($request)->data['status'] === 409, 'A replaced confirmation nonce must not activate');
expect($wpdb->record['status'] === 'pending', 'Rejected activation must not mutate state');
$request->set_param('expected_nonce_hash', str_repeat('a', 64));
expect($activate($request) instanceof WP_REST_Response && $wpdb->record['status'] === 'active', 'Valid pending subscriber must activate');
$wpdb->record['status'] = 'unsubscribed';
expect($activate($request)->data['status'] === 409 && $wpdb->record['status'] === 'unsubscribed', 'Stale confirmation must never reverse unsubscribe');
$wpdb->record['status'] = 'pending'; $wpdb->record['confirmation_expires_at'] = gmdate('c', time() - 60);
expect($activate($request)->data['status'] === 409, 'Expired confirmation must not activate');
echo "GLR CMS publication, authentication, comments, uploads and subscription state contracts passed.\n";
