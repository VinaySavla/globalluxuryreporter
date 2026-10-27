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
function get_post_type() { return 'glr_report'; }
function get_post_status() { global $fixture_post; return $fixture_post->post_status ?? 'draft'; }
function get_post_type_object($name) { global $fixture_types; return $fixture_types[$name] ?? null; }
function wp_max_upload_size() { return 64 * 1024 * 1024; }
function admin_url($path) { return 'https://cms.example/wp-admin/' . $path; }
function wp_nonce_url($url, $action) { return htmlspecialchars($url . '&_wpnonce=test', ENT_QUOTES); }
$preview_caps = [];
function current_user_can($capability, ...$args) { global $preview_caps; return in_array($capability, $preview_caps, true); }
function get_post($id) { global $fixture_post; return $id ? ($fixture_post ?? (object)['ID' => $id, 'post_type' => 'glr_report']) : null; }
function get_post_meta($id, $key, $single) { global $fixture_meta; return $fixture_meta[$key] ?? ''; }
function update_post_meta($id, $key, $value) { global $fixture_meta; $fixture_meta[$key] = $value; }
function wp_verify_nonce($nonce, $action) { return $nonce === 'valid'; }
function wp_is_post_revision($id) { return false; }
function wp_unslash($value) { return $value; }
function sanitize_text_field($value) { return trim(strip_tags($value)); }
function sanitize_email($value) { return trim($value); }
function is_email($value) { return filter_var($value, FILTER_VALIDATE_EMAIL); }
function wp_generate_uuid4() { return 'test-generated-id'; }
function wp_set_object_terms(...$args) {}
function get_current_user_id() { return 1; }
function set_transient($key, $value, $ttl) { global $fixture_notice; $fixture_notice = $value; }
function wp_update_post($data, $wp_error) {
    global $fixture_post, $fixture_updates, $actions;
    $fixture_updates[] = $data; $fixture_post->post_status = $data['post_status'];
    $actions['save_post_glr_report'][0]($data['ID']);
    return $data['ID'];
}
function absint($value) { return abs((int)$value); }
function wp_die($message, $title = '', $args = []) { throw new RuntimeException($message, $args['response'] ?? 500); }
function check_admin_referer($action) { throw new RuntimeException($action, 403); }
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
ob_start(); $actions['post_edit_form_tag'][0](); $form_attributes = ob_get_clean();
expect(strpos($form_attributes, 'enctype="multipart/form-data"') !== false, 'Report saves must send selected cover-image files');
expect(isset($actions['admin_post_glr_report_preview']) && !isset($actions['admin_post_nopriv_glr_report_preview']), 'Report previews must require a logged-in session');
$report = (object)['ID' => 6, 'post_type' => 'glr_report'];
expect(!glr_can_preview_report($report) && !glr_can_preview_report(null), 'Anonymous or missing reports must not be previewable');
$preview_caps = ['edit_post'];
expect(!glr_can_preview_report($report), 'Editors must not receive administrator previews');
$preview_caps = ['manage_options'];
expect(!glr_can_preview_report($report), 'Administrator capability alone must not bypass report edit permission');
$preview_caps[] = 'edit_post';
expect(glr_can_preview_report($report), 'Administrators who can edit the report must be allowed');
expect(!glr_can_preview_report((object)['ID' => 6, 'post_type' => 'page']), 'Other post types must not use report previews');
$_SERVER['REQUEST_METHOD'] = 'GET';
try { $actions['admin_post_glr_report_preview'][0](); throw new RuntimeException('GET unexpectedly allowed'); }
catch (RuntimeException $error) { expect($error->getCode() === 405, 'Preview must require POST'); }
$_SERVER['REQUEST_METHOD'] = 'POST'; $_POST['post_id'] = '6'; $preview_caps = [];
try { $actions['admin_post_glr_report_preview'][0](); throw new RuntimeException('Anonymous preview unexpectedly allowed'); }
catch (RuntimeException $error) { expect($error->getCode() === 403 && $error->getMessage() === 'Forbidden', 'Preview handler must check capabilities before accessing content'); }
$preview_caps = ['manage_options', 'edit_post'];
try { $actions['admin_post_glr_report_preview'][0](); throw new RuntimeException('Missing nonce unexpectedly allowed'); }
catch (RuntimeException $error) { expect($error->getMessage() === 'glr_report_preview_6', 'Preview nonce must be bound to the requested report'); }
$_POST = []; $preview_caps = [];
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
$editor_settings = call_user_func($filters['tiny_mce_before_init'][0], [], 'content');
expect(strpos($editor_settings['toolbar1'], 'fontsizeselect') !== false && strpos($editor_settings['toolbar2'], 'glr_table') !== false && $editor_settings['wordpress_adv_hidden'] === false, 'Report editor must expose formatting and table controls');
expect(call_user_func($filters['tiny_mce_before_init'][0], ['original' => true], 'excerpt') === ['original' => true], 'Other editors must stay unchanged');
expect(isset($actions['wp_ajax_glr_editor_upload']) && !isset($actions['wp_ajax_nopriv_glr_editor_upload']), 'Inline uploads must require an authenticated WordPress session');
$preview = glr_editor_asset(['id' => 'image-1', 'filename' => 'Example.jpg', 'type' => 'image/jpeg']);
expect(strpos($preview['preview'], '&id=image-1&_wpnonce=test') !== false && strpos($preview['preview'], '&amp;') === false, 'JSON image preview URLs must not contain HTML entities');
expect(strpos($editor_settings['toolbar1'], 'glr_media') === 0, 'Upload media must be inside the visual toolbar');
expect(glr_media_kind('video/mp4') === 'video' && glr_media_kind('audio/mpeg') === 'audio' && glr_media_kind('application/pdf') === 'document', 'Media must use the appropriate player or download link');
expect(!in_array('text/html', glr_upload_mimes(), true) && !in_array('image/svg+xml', glr_upload_mimes(), true), 'Executable document types must stay blocked');
foreach (['mp4', 'mp3', 'pdf', 'docx', 'xlsx', 'pptx', 'zip'] as $extension) expect(isset(glr_upload_mimes()[$extension]) || $extension === 'mp4', 'Common media types must be supported');
expect(glr_byte_range('bytes=0-9', 100) === [0, 9], 'Media must support a bounded byte range');
expect(glr_byte_range('bytes=95-', 100) === [95, 99], 'Media must support open-ended byte ranges');
expect(glr_byte_range('bytes=-10', 100) === [90, 99], 'Media must support suffix byte ranges');
expect(glr_byte_range('bytes=0-999', 100) === [0, 99], 'Byte ranges must stop at the end of the file');
foreach (['bytes=100-', 'bytes=-0', 'bytes=10-1', 'bytes=0-1,3-4', 'bytes=-'] as $invalid_range) expect(glr_byte_range($invalid_range, 100) === false, 'Invalid or unsatisfiable ranges must fail');
foreach ($routes as $path => $methods) foreach ($methods as $route) expect($route['permission_callback'] === 'glr_permission', 'Every GLR endpoint must authenticate');
class SubscriberDatabase {
    public $prefix = 'test_';
    public $record;
    public function prepare($sql, ...$args) { return $sql; }
    public function query($sql) { return true; }
    public function get_var($sql) { return $this->record ? json_encode($this->record) : null; }
    public function insert($table, $data) { $this->record = json_decode($data['data'], true); return 1; }
    public function update($table, $data, $where) { $this->record = json_decode($data['data'], true); return 1; }
}
$wpdb = new SubscriberDatabase();
$new_subscriber = new WP_REST_Request();
$new_subscriber->set_param('email', 'new@example.invalid');
$new_subscriber->set_param('status', 'pending');
$new_subscriber->set_param('consent_ip_hash', str_repeat('c', 64));
$create = $routes['/subscribers']['POST']['callback'];
expect($create($new_subscriber)->data['data']['status'] === 'active', 'New subscribers must start active even for the older frontend');
expect($wpdb->record['consent_ip_hash'] === str_repeat('c', 64), 'New subscriptions must retain supplied consent metadata');
$wpdb->record['status'] = 'unsubscribed';
expect($create($new_subscriber)->data['data']['status'] === 'unsubscribed', 'Repeated registration must not silently reverse an unsubscribe');
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

$fixture_post = (object)['ID' => 6, 'post_type' => 'glr_report', 'post_status' => 'publish', 'post_title' => 'Complete report', 'post_content' => '<p>Body</p>', 'post_excerpt' => 'Summary'];
$fixture_meta = ['glr_cover_image' => 'image-1', 'glr_author' => 'Writer', 'glr_cover_alt' => 'Cover'];
expect(glr_report_missing_fields($fixture_post, 3) === [], 'Complete reports must pass publication checks');
$fixture_post->post_excerpt = ' ';
expect(glr_report_missing_fields($fixture_post, 3) === [], 'Blank excerpts must never block publication');
expect(glr_report_missing_fields($fixture_post, 0) === ['Category'], 'Publication feedback must name only required fields');
$fixture_post->post_content = ' ';
$_POST = ['glr_nonce' => 'valid', 'glr_category' => '3', 'glr_author' => 'Writer', 'glr_cover_alt' => 'Cover'];
$preview_caps = ['edit_post']; $fixture_updates = [];
$actions['save_post_glr_report'][0](6);
expect($fixture_post->post_status === 'draft' && count($fixture_updates) === 1, 'Incomplete publications must use the WordPress status API exactly once without recursion');
expect(strpos($fixture_notice, 'Article body') !== false && strpos($fixture_notice, 'Excerpt') === false && strpos($fixture_notice, 'not published') !== false, 'Failed publication must explain only missing required fields');
$fixture_post->post_content = '<p>Body</p>'; $fixture_post->post_excerpt = '';
$fixture_meta['glr_cover_image'] = ''; $fixture_meta['glr_cover_alt'] = '';
$_POST['glr_cover_image'] = ''; $_POST['glr_cover_alt'] = '';
foreach (['publish', 'future', 'draft', 'pending', 'glr_archived'] as $status) {
    $fixture_post->post_status = $status; $fixture_updates = [];
    $actions['save_post_glr_report'][0](6);
    expect($fixture_post->post_status === $status && !$fixture_updates, 'Empty excerpts, covers and unused cover descriptions must allow every report status');
}
$wpdb->record = ['id' => 'image-1', 'type' => 'image/jpeg'];
expect(glr_cover_selection('image-1') === 'image-1', 'Existing GLR images can be selected as covers');
expect(glr_cover_selection('') === '', 'Cover selection can be cleared');
foreach ([null, [], '../image'] as $invalid_cover) {
    try { glr_cover_selection($invalid_cover); throw new RuntimeException('Invalid cover unexpectedly allowed'); }
    catch (InvalidArgumentException $error) {}
}
$wpdb->record = ['id' => 'document-1', 'type' => 'application/pdf'];
try { glr_cover_selection('document-1'); throw new RuntimeException('Document cover unexpectedly allowed'); }
catch (InvalidArgumentException $error) {}
$wpdb->record = ['id' => 'image-1', 'type' => 'image/jpeg'];
$_POST['glr_cover_image'] = 'image-1'; $_POST['glr_cover_alt'] = 'Cover';
$fixture_post->post_status = 'publish'; $actions['save_post_glr_report'][0](6);
expect($fixture_meta['glr_cover_image'] === 'image-1' && $fixture_post->post_status === 'publish', 'Selected media must persist on the report');
$_POST['glr_cover_image'] = ''; $_POST['glr_cover_alt'] = '';
$actions['save_post_glr_report'][0](6);
expect($fixture_meta['glr_cover_image'] === '' && $fixture_post->post_status === 'publish', 'Removing a cover must persist without unpublishing the report');
$removed_nodes = [];
$bar = new class { function remove_node($id) { global $removed_nodes; $removed_nodes[] = $id; } };
$actions['admin_bar_menu'][0]($bar);
expect($removed_nodes === ['new-post', 'new-page'], 'Unused Posts and Pages toolbar creation links must be removed');
$fixture_types = [];
foreach (['post', 'page', 'glr_report'] as $name) $fixture_types[$name] = (object)['cap' => (object)['create_posts' => 'edit_posts']];
$actions['init'][1]();
expect($fixture_types['post']->cap->create_posts === 'do_not_allow' && $fixture_types['page']->cap->create_posts === 'do_not_allow', 'Native post/page creation must be disabled');
expect($fixture_types['glr_report']->cap->create_posts === 'edit_posts', 'Report creation must remain available');
$preview_caps = ['publish_posts'];
foreach (['draft', 'pending', 'glr_archived', 'publish'] as $status) {
    $fixture_post->post_status = $status;
    expect(glr_report_status_options()['publish'] === 'Published', 'Published must remain available across repeated status changes');
}
$preview_caps = [];
expect(!isset(glr_report_status_options()['publish']), 'The status selector must not offer publishing to users without permission');
echo "GLR CMS publication, authentication, comments, uploads and subscription state contracts passed.\n";
