<?php
/**
 * Plugin Name: GLR Editorial CMS
 * Description: Private editorial backend for the existing Global Luxury Reporter frontend.
 * Version: 1.5.0
 */
if (!defined('ABSPATH')) exit;

function glr_table($name) { global $wpdb; return $wpdb->prefix . 'glr_' . $name; }
function glr_error($message, $status = 400) { return new WP_Error('glr_error', $message, ['status' => $status]); }
function glr_service_allowed() {
    $config = __DIR__ . '/service-key.php';
    $hash = is_file($config) ? require $config : '';
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    return is_string($hash) && strlen($hash) === 64 && preg_match('/^Bearer (\S+)$/', $header, $match) && hash_equals($hash, hash('sha256', $match[1]));
}
function glr_permission() { return glr_service_allowed() ? true : glr_error('Authentication required', 401); }
function glr_private_directory() {
    // Outside public_html: neither originals nor resized images have public upload URLs.
    $document_root = dirname(rtrim(ABSPATH, '/\\'));
    if (basename($document_root) !== 'public_html') throw new RuntimeException('Install GLR WordPress in public_html/cms');
    $directory = dirname($document_root) . '/glr-private-media';
    if (!is_dir($directory) && !wp_mkdir_p($directory)) throw new RuntimeException('Cannot create private media storage');
    return $directory;
}
function glr_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    $records = glr_table('records');
    $attempts = glr_table('attempts');
    dbDelta("CREATE TABLE $records (
        kind varchar(20) NOT NULL,
        id varchar(128) NOT NULL,
        email varchar(254) DEFAULT NULL,
        data longtext NOT NULL,
        PRIMARY KEY  (kind,id),
        UNIQUE KEY subscriber_email (email)
    ) $charset;");
    dbDelta("CREATE TABLE $attempts (
        id bigint unsigned NOT NULL AUTO_INCREMENT,
        scope varchar(50) NOT NULL,
        key_hash char(64) NOT NULL,
        expires_at bigint NOT NULL,
        PRIMARY KEY  (id),
        KEY lookup_attempts (scope,key_hash,expires_at),
        KEY expiry (expires_at)
    ) $charset;");
    update_option('default_comment_status', 'closed');
    update_option('default_ping_status', 'closed');
    update_option('blog_public', '0');
    update_option('blogname', 'Global Luxury Reporter — Editorial');
    if (!get_role('glr_editor')) add_role('glr_editor', 'GLR Editor', ['read' => true, 'edit_posts' => true, 'edit_others_posts' => true, 'publish_posts' => true, 'delete_posts' => true, 'delete_others_posts' => true, 'edit_published_posts' => true, 'delete_published_posts' => true, 'manage_categories' => true, 'manage_glr_records' => true]);
    get_role('administrator')->add_cap('manage_glr_records');
    glr_private_directory();
}
register_activation_hook(__FILE__, 'glr_install');

add_action('init', function () {
    register_post_status('glr_archived', ['label' => 'Archived', 'public' => false, 'internal' => false, 'show_in_admin_all_list' => true, 'show_in_admin_status_list' => true, 'label_count' => _n_noop('Archived <span class="count">(%s)</span>', 'Archived <span class="count">(%s)</span>')]);
    register_post_type('glr_report', ['labels' => ['name' => 'Reports', 'singular_name' => 'Report', 'add_new_item' => 'Add report'], 'public' => false, 'show_ui' => true, 'show_in_rest' => false, 'menu_icon' => 'dashicons-media-document', 'supports' => ['title', 'editor', 'excerpt', 'revisions'], 'rewrite' => false]);
    register_taxonomy('glr_category', 'glr_report', ['label' => 'GLR Categories', 'public' => false, 'show_ui' => true, 'show_admin_column' => true, 'meta_box_cb' => false, 'rewrite' => false]);
});
// Enforce the no-comments rule for administrators, anonymous visitors and API callers.
add_filter('comments_open', '__return_false', PHP_INT_MAX);
add_filter('pings_open', '__return_false', PHP_INT_MAX);
add_filter('comments_array', '__return_empty_array', PHP_INT_MAX);
add_filter('preprocess_comment', function () { wp_die('Comments are disabled.', '', ['response' => 403]); });
add_filter('xmlrpc_enabled', '__return_false');
add_filter('xmlrpc_methods', function ($methods) {
    foreach (array_keys($methods) as $method) if (stripos($method, 'comment') !== false || stripos($method, 'pingback') !== false) unset($methods[$method]);
    return $methods;
});
add_filter('wp_insert_post_data', function ($data) { $data['comment_status'] = 'closed'; $data['ping_status'] = 'closed'; return $data; });
add_filter('rest_pre_insert_comment', function () { return glr_error('Comments are disabled', 403); });
add_filter('rest_authentication_errors', function ($error) {
    if (is_wp_error($error) || is_user_logged_in() || glr_service_allowed()) return $error;
    return glr_error('Private editorial API', 401);
}, 110);
add_action('admin_menu', function () { remove_menu_page('edit-comments.php'); remove_menu_page('edit.php'); remove_menu_page('edit.php?post_type=page'); });
add_action('admin_bar_menu', function ($bar) { $bar->remove_node('new-post'); $bar->remove_node('new-page'); }, 100);
add_action('wp_dashboard_setup', function () { remove_meta_box('dashboard_quick_press', 'dashboard', 'side'); });
add_action('init', function () {
    foreach (['post', 'page'] as $name) { $type = get_post_type_object($name); if ($type) $type->cap->create_posts = 'do_not_allow'; }
}, 20);
add_action('load-post-new.php', function () {
    if (in_array($_GET['post_type'] ?? 'post', ['post', 'page'], true)) wp_die('Use Reports → Add report for GLR articles.', '', ['response' => 403]);
});
add_action('template_redirect', function () { status_header(404); nocache_headers(); exit('GLR editorial backend.'); });

function glr_record($kind, $id) {
    global $wpdb;
    $json = $wpdb->get_var($wpdb->prepare('SELECT data FROM ' . glr_table('records') . ' WHERE kind=%s AND id=%s', $kind, (string)$id));
    return $json === null ? null : json_decode($json, true);
}
function glr_put_record($kind, $record, $insert_only = false) {
    global $wpdb;
    $table = glr_table('records');
    $row = ['kind' => $kind, 'id' => (string)$record['id'], 'email' => $kind === 'subscriber' ? $record['email'] : null, 'data' => wp_json_encode($record)];
    $result = $insert_only ? $wpdb->insert($table, $row) : $wpdb->replace($table, $row);
    if ($result === false) throw new RuntimeException('Unable to store record');
    return $record;
}
function glr_records($kind) {
    global $wpdb;
    return array_map(function ($json) { return json_decode($json, true); }, $wpdb->get_col($wpdb->prepare('SELECT data FROM ' . glr_table('records') . ' WHERE kind=%s ORDER BY id', $kind)));
}
function glr_category($term) {
    return ['id' => get_term_meta($term->term_id, 'glr_source_id', true) ?: $term->term_id, 'name' => html_entity_decode($term->name, ENT_QUOTES | ENT_HTML5, 'UTF-8'), 'slug' => $term->slug, 'description' => $term->description, 'cover_image' => get_term_meta($term->term_id, 'glr_cover_image', true), 'sort' => (int)get_term_meta($term->term_id, 'glr_sort', true)];
}
function glr_categories() {
    $terms = get_terms(['taxonomy' => 'glr_category', 'hide_empty' => false]);
    if (is_wp_error($terms)) throw new RuntimeException('Cannot read categories');
    $items = array_map('glr_category', $terms);
    usort($items, function ($a, $b) { return ($a['sort'] <=> $b['sort']) ?: strcmp($a['name'], $b['name']); });
    return $items;
}
function glr_report($post, $include_content = false) {
    $terms = wp_get_object_terms($post->ID, 'glr_category');
    $item = ['id' => get_post_meta($post->ID, 'glr_source_id', true) ?: $post->ID, 'title' => $post->post_title, 'slug' => $post->post_name, 'excerpt' => $post->post_excerpt, 'category' => $terms && !is_wp_error($terms) ? glr_category($terms[0]) : null, 'published_at' => str_replace(' ', 'T', $post->post_date_gmt) . 'Z', 'date_updated' => str_replace(' ', 'T', $post->post_modified_gmt) . 'Z'];
    foreach (['cover_image', 'cover_alt', 'author', 'reading_time', 'featured', 'editor_pick', 'popularity'] as $key) $item[$key] = get_post_meta($post->ID, 'glr_' . $key, true);
    foreach (['featured', 'editor_pick'] as $key) $item[$key] = (bool)$item[$key];
    foreach (['reading_time', 'popularity'] as $key) $item[$key] = (int)$item[$key];
    if ($include_content) $item['content'] = $post->post_content;
    return $item;
}
function glr_query($request, $include_content = false) {
    $limit = (string)$request->get_param('limit') === '-1' ? -1 : min(24, max(1, (int)($request->get_param('limit') ?: 9)));
    // Include due scheduled posts even when shared hosting's WP-Cron has not run yet.
    $args = ['post_type' => 'glr_report', 'post_status' => ['publish', 'future'], 'posts_per_page' => $limit, 'paged' => max(1, (int)$request->get_param('page')), 'orderby' => 'date', 'order' => 'DESC', 'date_query' => [['column' => 'post_date_gmt', 'before' => gmdate('Y-m-d H:i:s'), 'inclusive' => true]]];
    if ($request->get_param('slug')) $args['name'] = (string)$request->get_param('slug');
    if ($request->get_param('category')) $args['tax_query'] = [['taxonomy' => 'glr_category', 'field' => 'slug', 'terms' => (string)$request->get_param('category')]];
    if ($request->get_param('featured') !== null) $args['meta_query'] = [['key' => 'glr_featured', 'value' => $request->get_param('featured') === 'true' ? '1' : '0']];
    if ($request->get_param('search')) $args['s'] = (string)$request->get_param('search');
    $query = new WP_Query($args);
    return ['data' => array_map(function ($post) use ($include_content) { return glr_report($post, $include_content); }, $query->posts), 'meta' => ['total_count' => (int)$query->found_posts, 'page' => $args['paged'], 'limit' => $limit === -1 ? count($query->posts) : $limit]];
}
function glr_asset_is_public($id) {
    foreach (glr_categories() as $category) if ($category['cover_image'] === $id) return true;
    $request = new WP_REST_Request(); $request->set_param('limit', '-1');
    foreach (glr_query($request, true)['data'] as $report) if ($report['cover_image'] === $id || strpos($report['content'], $id) !== false) return true;
    return false;
}
function glr_upload_mimes() {
    return ['jpg|jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif', 'avif' => 'image/avif', 'mp4|m4v' => 'video/mp4', 'webm' => 'video/webm', 'ogv' => 'video/ogg', 'mov' => 'video/quicktime', 'mp3' => 'audio/mpeg', 'm4a' => 'audio/mp4', 'wav' => 'audio/wav', 'ogg|oga' => 'audio/ogg', 'flac' => 'audio/flac', 'aac' => 'audio/aac', 'pdf' => 'application/pdf', 'doc' => 'application/msword', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'xls' => 'application/vnd.ms-excel', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'ppt' => 'application/vnd.ms-powerpoint', 'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'odt' => 'application/vnd.oasis.opendocument.text', 'ods' => 'application/vnd.oasis.opendocument.spreadsheet', 'odp' => 'application/vnd.oasis.opendocument.presentation', 'rtf' => 'application/rtf', 'txt' => 'text/plain', 'csv' => 'text/csv', 'zip' => 'application/zip'];
}
function glr_media_limit() { return min(64 * 1024 * 1024, wp_max_upload_size()); }
function glr_media_kind($type) {
    foreach (['image', 'video', 'audio'] as $kind) if (strpos($type, $kind . '/') === 0) return $kind;
    return 'document';
}
function glr_store_asset($file, $bytes) {
    $id = (string)($file['id'] ?? wp_generate_uuid4());
    if (!preg_match('/^[a-zA-Z0-9-]{1,128}$/', $id) || !$bytes || strlen($bytes) > glr_media_limit()) throw new InvalidArgumentException('Invalid media file or upload limit exceeded');
    $info = @getimagesizefromstring($bytes);
    $type = $info['mime'] ?? ($file['validated_type'] ?? '');
    if (!in_array($type, array_values(glr_upload_mimes()), true) || (glr_media_kind($type) === 'image' && !$info)) throw new InvalidArgumentException('Unsupported media file');
    $sha = hash('sha256', $bytes);
    if (isset($file['sha256']) && !hash_equals($file['sha256'], $sha)) throw new InvalidArgumentException('Image checksum mismatch');
    $existing = glr_record('asset', $id);
    if ($existing) { if ($existing['sha256'] !== $sha) throw new RuntimeException('Asset ID collision'); return $existing; }
    $path = glr_private_directory() . '/' . $id;
    if (file_put_contents($path, $bytes, LOCK_EX) !== strlen($bytes)) throw new RuntimeException('Image write failed');
    chmod($path, 0600);
    return glr_put_record('asset', ['id' => $id, 'filename' => sanitize_file_name($file['filename'] ?? $id), 'type' => $type, 'bytes' => strlen($bytes), 'sha256' => $sha]);
}

add_action('rest_api_init', function () {
    $route = function ($path, $methods, $callback) { register_rest_route('glr/v1', $path, ['methods' => $methods, 'permission_callback' => 'glr_permission', 'callback' => function ($request) use ($callback) { try { $result = $callback($request); if (is_wp_error($result)) return $result; $response = rest_ensure_response($result); $response->header('Cache-Control', 'private, no-store, max-age=0'); return $response; } catch (InvalidArgumentException $error) { return glr_error($error->getMessage(), 422); } catch (Throwable $error) { error_log('GLR CMS: ' . $error->getMessage()); return glr_error('CMS operation failed', 503); } }]); };
    $route('/health', 'GET', function () { global $wpdb; $wpdb->get_var('SELECT COUNT(*) FROM ' . glr_table('records')); return $wpdb->last_error ? glr_error('Database unavailable', 503) : ['status' => 'ok']; });
    $route('/reports', 'GET', function ($r) { return glr_query($r, (bool)$r->get_param('slug')); });
    $route('/categories', 'GET', function () { return ['data' => glr_categories()]; });
    $route('/sitemap', 'GET', function () { $r = new WP_REST_Request(); $r->set_param('limit', '-1'); return ['categories' => glr_categories(), 'reports' => glr_query($r)['data']]; });
    $route('/inquiries', 'POST', function ($r) {
        $p = $r->get_json_params();
        $name = sanitize_text_field($p['name'] ?? ''); $email = strtolower(sanitize_email($p['email'] ?? '')); $message = sanitize_textarea_field($p['message'] ?? '');
        if (strlen($name) < 2 || strlen($name) > 100 || !is_email($email) || strlen($message) < 10 || strlen($message) > 3000) return glr_error('Invalid enquiry', 422);
        return ['data' => glr_put_record('inquiry', ['id' => wp_generate_uuid4(), 'name' => $name, 'email' => $email, 'message' => $message, 'status' => 'new', 'date_created' => gmdate('c')], true)];
    });
    $route('/subscribers', 'GET', function ($r) { global $wpdb; $email = strtolower((string)$r->get_param('email')); $json = $wpdb->get_var($wpdb->prepare('SELECT data FROM ' . glr_table('records') . ' WHERE kind=%s AND email=%s', 'subscriber', $email)); return ['data' => $json ? [json_decode($json, true)] : []]; });
    $route('/subscribers', 'POST', function ($r) {
        global $wpdb; $p = $r->get_json_params(); $email = strtolower(sanitize_email($p['email'] ?? ''));
        if (!is_email($email)) return glr_error('Invalid email', 422);
        $existing = $wpdb->get_var($wpdb->prepare('SELECT data FROM ' . glr_table('records') . ' WHERE email=%s', $email));
        if ($existing) return ['data' => json_decode($existing, true)];
        return ['data' => glr_put_record('subscriber', ['id' => wp_generate_uuid4(), 'email' => $email, 'status' => 'active', 'source' => 'website_dialog', 'consent_ip_hash' => preg_match('/^[a-f0-9]{64}$/', $p['consent_ip_hash'] ?? '') ? $p['consent_ip_hash'] : null, 'consent_version' => '2026-09-11', 'date_created' => gmdate('c')], true)];
    });
    $route('/subscribers/(?P<id>[a-zA-Z0-9-]{1,128})', 'GET', function ($r) { $item = glr_record('subscriber', $r['id']); return $item ? ['data' => $item] : glr_error('Subscriber not found', 404); });
    $route('/subscribers/(?P<id>[a-zA-Z0-9-]{1,128})', 'PATCH', function ($r) {
        global $wpdb;
        // Lock the row so activation cannot overwrite an unsubscribe arriving concurrently.
        $wpdb->query('START TRANSACTION');
        try {
            $json = $wpdb->get_var($wpdb->prepare('SELECT data FROM ' . glr_table('records') . ' WHERE kind=%s AND id=%s FOR UPDATE', 'subscriber', $r['id']));
            if (!$json) { $wpdb->query('ROLLBACK'); return glr_error('Subscriber not found', 404); }
            $item = json_decode($json, true); $p = $r->get_json_params();
            if (($p['status'] ?? '') === 'active' && ($item['status'] !== 'pending' || ($p['expected_nonce_hash'] ?? '') !== ($item['confirmation_nonce_hash'] ?? null) || strtotime($item['confirmation_expires_at'] ?? '') <= time())) { $wpdb->query('ROLLBACK'); return glr_error('Confirmation no longer valid', 409); }
            $allowed = ['status', 'confirmation_nonce_hash', 'confirmation_expires_at', 'consent_ip_hash', 'consent_version', 'confirmed_at', 'unsubscribed_at'];
            foreach ($allowed as $key) if (array_key_exists($key, $p)) $item[$key] = $p[$key];
            if (!in_array($item['status'], ['pending', 'active', 'unsubscribed'], true)) { $wpdb->query('ROLLBACK'); return glr_error('Invalid subscriber status', 422); }
            $item['date_updated'] = gmdate('c');
            if ($wpdb->update(glr_table('records'), ['data' => wp_json_encode($item)], ['kind' => 'subscriber', 'id' => $r['id']]) === false) throw new RuntimeException('Subscriber write failed');
            $wpdb->query('COMMIT'); return ['data' => $item];
        } catch (Throwable $error) { $wpdb->query('ROLLBACK'); throw $error; }
    });
    $route('/rate-limit', 'POST', function ($r) {
        global $wpdb; $p = $r->get_json_params(); $table = glr_table('attempts');
        if (!preg_match('/^[a-f0-9]{64}$/', $p['key_hash'] ?? '') || !preg_match('/^[a-zA-Z0-9-]{1,50}$/', $p['scope'] ?? '')) return glr_error('Invalid rate limit', 422);
        $wpdb->query($wpdb->prepare("DELETE FROM $table WHERE expires_at < %d LIMIT 1000", time()));
        if ($wpdb->insert($table, ['scope' => $p['scope'], 'key_hash' => $p['key_hash'], 'expires_at' => time() + min(86400, max(1, (int)$p['window_seconds']))]) === false) throw new RuntimeException('Rate limit write failed');
        $count = (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE scope=%s AND key_hash=%s AND expires_at>%d", $p['scope'], $p['key_hash'], time()));
        return ['limited' => $count > max(1, (int)$p['max'])];
    });
    $route('/assets/(?P<id>[a-zA-Z0-9-]{1,128})', 'GET', function ($r) {
        $file = glr_record('asset', $r['id']);
        if (!$file || !glr_asset_is_public($r['id'])) return glr_error('Asset not found', 404);
        return ['glr_stream' => $r['id'], 'type' => $file['type'], 'filename' => $file['filename']];
    });

});

add_filter('rest_pre_serve_request', function ($served, $result, $request) {
    $data = $result->get_data();
    if (strpos($request->get_route(), '/glr/v1/assets/') !== 0 || !is_array($data) || empty($data['glr_stream'])) return $served;
    $path = glr_private_directory() . '/' . $data['glr_stream'];
    if (!is_file($path)) { status_header(404); return true; }
    $mime = $data['type'];
    $width = min(2400, max(0, (int)$request->get_param('width')));
    $height = min(2400, max(0, (int)$request->get_param('height')));
    $quality = min(90, max(20, (int)($request->get_param('quality') ?: 80)));
    $format = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'avif' => 'image/avif'][$request->get_param('format') ?? ''] ?? $mime;
    $temporary = null;
    if (glr_media_kind($mime) === 'image' && ($width || $height || $request->get_param('format') || $request->get_param('quality'))) {
        $editor = wp_get_image_editor($path);
        if (!is_wp_error($editor)) {
            $editor->set_quality($quality);
            $resized = ($width || $height) ? $editor->resize($width ?: null, $height ?: null, $request->get_param('fit') === 'cover') : true;
            if (!is_wp_error($resized)) {
                $output = $editor->save(glr_private_directory() . '/' . wp_generate_uuid4(), $format);
                if (!is_wp_error($output)) { $path = $output['path']; $mime = $output['mime-type']; $temporary = $path; }
            }
        }
    }
    glr_stream_media($path, $mime, $data['filename'], $temporary ? '' : $request->get_header('range'));
    if ($temporary) unlink($temporary); return true;
}, 10, 3);

function glr_byte_range($header, $size) {
    if (!$header) return [0, $size - 1];
    if ($size < 1 || strlen($header) > 100 || !preg_match('/^bytes=(\d*)-(\d*)$/', $header, $match) || ($match[1] === '' && $match[2] === '')) return false;
    if ($match[1] === '') { $length = (int)$match[2]; return $length > 0 ? [max(0, $size - $length), $size - 1] : false; }
    $start = (int)$match[1]; $end = $match[2] === '' ? $size - 1 : min((int)$match[2], $size - 1);
    return $start < $size && $start <= $end ? [$start, $end] : false;
}
function glr_stream_media($path, $type, $filename, $range = '') {
    $size = filesize($path); $bounds = glr_byte_range($range, $size);
    header('Content-Type: ' . $type); header('Cache-Control: private, no-store, max-age=0'); header('X-Content-Type-Options: nosniff'); header('Accept-Ranges: bytes');
    $disposition = glr_media_kind($type) === 'document' ? 'attachment' : 'inline';
    header('Content-Disposition: ' . $disposition . "; filename*=UTF-8''" . rawurlencode($filename));
    if ($bounds === false) { status_header(416); header('Content-Range: bytes */' . $size); header('Content-Length: 0'); return; }
    [$start, $end] = $bounds;
    if ($range) { status_header(206); header("Content-Range: bytes $start-$end/$size"); }
    $remaining = max(0, $end - $start + 1); header('Content-Length: ' . $remaining);
    $stream = fopen($path, 'rb');
    if (!$stream) throw new RuntimeException('Cannot open media file');
    fseek($stream, $start);
    while ($remaining > 0 && !feof($stream) && !connection_aborted()) { $chunk = fread($stream, min(65536, $remaining)); if ($chunk === false || $chunk === '') break; echo $chunk; $remaining -= strlen($chunk); }
    fclose($stream);
}
function glr_uploaded_media($key, $images_only = false) {
    if (empty($_FILES[$key]['tmp_name'])) return null;
    $upload = $_FILES[$key];
    if ($upload['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($upload['tmp_name'])) throw new RuntimeException('Upload failed. Check the file size and try again.');
    if (filesize($upload['tmp_name']) > glr_media_limit()) throw new InvalidArgumentException('Upload limit exceeded');
    $checked = wp_check_filetype_and_ext($upload['tmp_name'], $upload['name'], glr_upload_mimes());
    if (!$checked['ext'] || !$checked['type'] || ($images_only && glr_media_kind($checked['type']) !== 'image')) throw new InvalidArgumentException($images_only ? 'Choose a supported image' : 'Unsupported file type or file contents');
    return glr_store_asset(['filename' => $upload['name'], 'validated_type' => $checked['type']], file_get_contents($upload['tmp_name']))['id'];
}
add_action('post_edit_form_tag', function () { if (get_post_type() === 'glr_report') echo ' enctype="multipart/form-data"'; });
add_action('add_meta_boxes', function () {
    add_meta_box('glr-editorial', 'Editorial details', function ($post) {
        wp_nonce_field('glr_save_report', 'glr_nonce');
        $categories = get_terms(['taxonomy' => 'glr_category', 'hide_empty' => false]);
        $assigned = wp_get_object_terms($post->ID, 'glr_category', ['fields' => 'ids']);
        echo '<p><label>Category <select name="glr_category"><option value="">Choose category</option>';
        foreach ($categories as $term) echo '<option value="' . (int)$term->term_id . '" ' . selected($assigned[0] ?? 0, $term->term_id, false) . '>' . esc_html($term->name) . '</option>';
        echo '</select></label></p>';
        foreach (['author' => 'Author / byline', 'cover_alt' => 'Cover image description', 'reading_time' => 'Reading time (minutes)', 'popularity' => 'Most Read ranking score'] as $key => $label) {
            $type = in_array($key, ['reading_time', 'popularity'], true) ? 'number' : 'text';
            echo '<p><label>' . esc_html($label) . '<br><input class="widefat" type="' . $type . '" name="glr_' . $key . '" value="' . esc_attr(get_post_meta($post->ID, 'glr_' . $key, true)) . '"></label></p>';
        }
        foreach (['featured' => 'Featured on homepage', 'editor_pick' => "Editor's Pick"] as $key => $label) echo '<p><label><input type="checkbox" name="glr_' . $key . '" value="1" ' . checked(get_post_meta($post->ID, 'glr_' . $key, true), 1, false) . '> ' . esc_html($label) . '</label></p>';
        $cover_id = get_post_meta($post->ID, 'glr_cover_image', true);
        $cover = $cover_id ? glr_record('asset', $cover_id) : null;
        echo '<p>Cover image: <code id="glr-cover-id">' . esc_html($cover_id) . '</code></p><input type="hidden" name="glr_cover_image" id="glr-cover-image" value="' . esc_attr($cover_id) . '"><div id="glr-cover-preview">';
        if ($cover && glr_media_kind($cover['type']) === 'image') echo '<img src="' . esc_url(glr_editor_asset($cover)['preview']) . '" alt="Current cover" style="max-width:200px;max-height:140px">';
        echo '</div><p><label>Upload cover image (optional)<br><input type="file" id="glr-cover-upload" name="glr_cover_upload" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"></label></p><p><button type="button" class="button" id="glr-choose-cover">Choose cover from media</button> <button type="button" class="button" id="glr-remove-cover">Remove cover</button></p><p>Cover image and Excerpt are optional. Upload a cover or choose an existing image, then save with Update status. Use Upload media in the editor toolbar for inline images, video, audio or downloadable files.</p>';
    }, 'glr_report', 'normal', 'high');
});
function glr_report_missing_fields($post, $category_id) {
    $required = ['Title' => trim($post->post_title), 'Category' => $category_id, 'Author / byline' => trim(get_post_meta($post->ID, 'glr_author', true)), 'Article body' => trim($post->post_content)];
    if (get_post_meta($post->ID, 'glr_cover_image', true)) $required['Cover image description'] = trim(get_post_meta($post->ID, 'glr_cover_alt', true));
    return array_keys(array_filter($required, function ($value) { return !$value; }));
}
function glr_cover_selection($id) {
    if ($id === '') return '';
    if (!is_string($id) || !preg_match('/^[a-zA-Z0-9-]{1,128}$/', $id)) throw new InvalidArgumentException('Choose a valid cover image from GLR Media.');
    $file = glr_record('asset', $id);
    if (!$file || glr_media_kind($file['type']) !== 'image') throw new InvalidArgumentException('The cover must be an existing image from GLR Media.');
    return $id;
}
add_action('save_post_glr_report', function ($id) {
    static $changing_status = false;
    if ($changing_status || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)) return;
    if (empty($_POST['glr_nonce']) || !wp_verify_nonce($_POST['glr_nonce'], 'glr_save_report') || !current_user_can('edit_post', $id) || wp_is_post_revision($id)) return;
    foreach (['author', 'cover_alt'] as $key) update_post_meta($id, 'glr_' . $key, sanitize_text_field(wp_unslash($_POST['glr_' . $key] ?? '')));
    foreach (['reading_time', 'popularity'] as $key) update_post_meta($id, 'glr_' . $key, max($key === 'reading_time' ? 1 : 0, (int)($_POST['glr_' . $key] ?? 0)));
    foreach (['featured', 'editor_pick'] as $key) update_post_meta($id, 'glr_' . $key, isset($_POST['glr_' . $key]) ? 1 : 0);
    $category_id = (int)($_POST['glr_category'] ?? 0);
    wp_set_object_terms($id, $category_id ? [$category_id] : [], 'glr_category');
    try {
        if (array_key_exists('glr_cover_image', $_POST)) update_post_meta($id, 'glr_cover_image', glr_cover_selection(wp_unslash($_POST['glr_cover_image'])));
        $image = glr_uploaded_media('glr_cover_upload', true); if ($image) update_post_meta($id, 'glr_cover_image', $image);
    }
    catch (Throwable $error) { set_transient('glr_notice_' . get_current_user_id(), $error->getMessage(), 60); }
    $post = get_post($id);
    $missing = glr_report_missing_fields($post, $category_id);
    if (in_array($post->post_status, ['publish', 'future'], true) && $missing) {
        $changing_status = true;
        try { $result = wp_update_post(['ID' => $id, 'post_status' => 'draft'], true); }
        finally { $changing_status = false; }
        if (is_wp_error($result)) wp_die('Unable to save the report as a draft. Please reload and check its status.', '', ['response' => 500]);
        set_transient('glr_notice_' . get_current_user_id(), 'Report was not published. Saved as Draft. Complete these fields and publish again: ' . implode(', ', $missing) . '.', 60);
    }
});
add_filter('redirect_post_location', function ($location, $id) {
    return get_post_type($id) === 'glr_report' && get_post_status($id) === 'draft' ? add_query_arg('message', 10, $location) : $location;
}, 10, 2);
add_action('admin_notices', function () { $key = 'glr_notice_' . get_current_user_id(); $notice = get_transient($key); if ($notice) { delete_transient($key); echo '<div class="notice notice-warning"><p>' . esc_html($notice) . '</p></div>'; } });
add_filter('wp_editor_settings', function ($settings, $id) { if (get_post_type() === 'glr_report') $settings['media_buttons'] = false; return $settings; }, 10, 2);
add_filter('tiny_mce_before_init', function ($settings, $id) {
    if (get_post_type() !== 'glr_report' || $id !== 'content') return $settings;
    $settings['toolbar1'] = 'glr_media,formatselect,fontselect,fontsizeselect,bold,italic,underline,strikethrough,forecolor,backcolor';
    $settings['toolbar2'] = 'bullist,numlist,blockquote,alignleft,aligncenter,alignright,alignjustify,outdent,indent,link,unlink,glr_table,hr';
    $settings['toolbar3'] = 'undo,redo,pastetext,removeformat,charmap,subscript,superscript,wp_help,fullscreen';
    $settings['wordpress_adv_hidden'] = false;
    $settings['block_formats'] = 'Paragraph=p;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre';
    $settings['font_formats'] = 'Arial=arial,helvetica,sans-serif;Georgia=georgia,palatino,serif;Times New Roman=times new roman,times,serif;Verdana=verdana,geneva,sans-serif;Courier New=courier new,courier,monospace';
    $settings['fontsize_formats'] = '10pt 12pt 14pt 16pt 18pt 24pt 36pt';
    return $settings;
}, 10, 2);
function glr_editor_asset($file) {
    return ['id' => $file['id'], 'filename' => $file['filename'], 'type' => $file['type'], 'kind' => glr_media_kind($file['type']), 'preview' => html_entity_decode(wp_nonce_url(admin_url('admin-post.php?action=glr_media_preview&id=' . rawurlencode($file['id'])), 'glr_preview'), ENT_QUOTES | ENT_HTML5, 'UTF-8')];
}
function glr_can_preview_report($post) {
    return $post && $post->post_type === 'glr_report' && current_user_can('manage_options') && current_user_can('edit_post', $post->ID);
}
add_action('post_submitbox_misc_actions', function ($post) {
    if (!glr_can_preview_report($post)) return;
    echo '<div class="misc-pub-section"><button type="button" class="button" id="glr-preview-report" data-url="' . esc_url(admin_url('admin-post.php')) . '" data-id="' . (int)$post->ID . '" data-nonce="' . esc_attr(wp_create_nonce('glr_report_preview_' . $post->ID)) . '">Preview report</button><p class="description">Opens current editor content privately without saving. Save a new cover image first.</p></div>';
});
function glr_report_preview_html($html) {
    $tags = new WP_HTML_Tag_Processor(wp_kses_post($html));
    while ($tags->next_tag()) {
        foreach (['src', 'href', 'poster'] as $attribute) {
            $url = $tags->get_attribute($attribute);
            if (!is_string($url)) continue;
            $path = wp_parse_url($url, PHP_URL_PATH);
            if (is_string($path) && preg_match('~^/(?:api/)?assets/([a-zA-Z0-9-]{1,128})(?:\.(?:jpe?g|png|webp|gif|avif))?$~i', $path, $match)) {
                $file = glr_record('asset', $match[1]);
                if ($file) $tags->set_attribute($attribute, glr_editor_asset($file)['preview']);
                else $tags->remove_attribute($attribute);
            }
        }
        if ($tags->get_attribute('target') === '_blank') $tags->set_attribute('rel', 'noopener noreferrer');
        if (in_array($tags->get_tag(), ['VIDEO', 'AUDIO'], true)) {
            $tags->set_attribute('controls', true); $tags->set_attribute('preload', 'metadata'); $tags->remove_attribute('autoplay');
        }
    }
    return $tags->get_updated_html();
}
add_action('admin_post_glr_report_preview', function () {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') wp_die('Use Preview report in the editor.', '', ['response' => 405]);
    $id = isset($_POST['post_id']) && is_scalar($_POST['post_id']) ? absint($_POST['post_id']) : 0;
    $post = $id ? get_post($id) : null;
    if (!glr_can_preview_report($post)) wp_die('Forbidden', '', ['response' => 403]);
    check_admin_referer('glr_report_preview_' . $id);
    $fields = [];
    foreach (['post_title', 'post_content', 'excerpt', 'glr_author', 'glr_cover_alt', 'glr_reading_time', 'glr_category'] as $key) {
        if (isset($_POST[$key]) && !is_string($_POST[$key])) wp_die('Invalid preview fields.', '', ['response' => 400]);
        $fields[$key] = wp_unslash($_POST[$key] ?? '');
    }
    $body = glr_report_preview_html($fields['post_content']);
    $cover = glr_record('asset', get_post_meta($id, 'glr_cover_image', true));
    $category = get_term(absint($fields['glr_category']), 'glr_category');
    nocache_headers();
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: private, no-store, max-age=0');
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('Referrer-Policy: no-referrer');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Preview: ' . esc_html(sanitize_text_field($fields['post_title'])) . '</title><style>body{margin:0;background:#faf9f6;color:#252525;font:18px/1.7 Georgia,serif}aside{padding:12px 24px;background:#222;color:#fff;font:14px/1.5 Arial,sans-serif}main{max-width:800px;margin:48px auto;padding:0 24px 64px}h1{font-size:clamp(32px,6vw,52px);line-height:1.15}img,video{max-width:100%;height:auto}audio{max-width:100%}figure{margin:24px 0}figcaption{font-size:14px}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #ccc;padding:8px}a{color:#675021}blockquote{border-left:3px solid #aa9158;padding-left:20px}pre{overflow:auto}.meta{font:14px/1.6 Arial,sans-serif}.excerpt{font-size:22px}</style></head><body><aside>Administrator preview · Unsaved editor content · This does not publish or save the report. Newly selected cover images require saving first.</aside><main>';
    if ($category && !is_wp_error($category)) echo '<p class="meta">' . esc_html($category->name) . '</p>';
    echo '<h1>' . esc_html(sanitize_text_field($fields['post_title'])) . '</h1><p class="meta">' . esc_html(sanitize_text_field($fields['glr_author'])) . ' · ' . max(1, absint($fields['glr_reading_time'])) . ' min read</p><p class="excerpt">' . esc_html(sanitize_textarea_field($fields['excerpt'])) . '</p>';
    if ($cover && glr_media_kind($cover['type']) === 'image') echo '<figure><img src="' . esc_url(glr_editor_asset($cover)['preview']) . '" alt="' . esc_attr(sanitize_text_field($fields['glr_cover_alt'])) . '"></figure>';
    echo '<article>' . wpautop($body) . '</article></main></body></html>';
    exit;
});
add_action('admin_enqueue_scripts', function () {
    $screen = get_current_screen();
    if (!$screen || $screen->base !== 'post' || $screen->post_type !== 'glr_report') return;
    wp_enqueue_script('glr-report-editor', plugins_url('report-editor.js', __FILE__), ['jquery', 'editor', 'quicktags'], '1.5.0', false);
    wp_localize_script('glr-report-editor', 'glrReportEditor', ['ajaxUrl' => admin_url('admin-ajax.php'), 'nonce' => wp_create_nonce('glr_editor_media'), 'accept' => '.' . str_replace('|', ',.', implode('|', array_keys(glr_upload_mimes()))), 'maxBytes' => glr_media_limit(), 'assets' => array_map('glr_editor_asset', glr_records('asset'))]);
});
add_action('edit_form_after_title', function ($post) {
    if ($post->post_type !== 'glr_report') return;
    echo '<dialog id="glr-image-picker" aria-labelledby="glr-image-title" style="width:min(760px,90vw);max-height:85vh;overflow:auto"><h2 id="glr-image-title">Upload or insert media</h2><p><label>Upload file <input id="glr-inline-upload" type="file"></label> <button type="button" class="button" id="glr-upload-image">Upload</button></p><p id="glr-media-message" role="status" aria-live="polite"></p><p>Images, video, audio, PDF, Office/OpenDocument files, text, CSV and ZIP. Maximum upload: ' . esc_html(size_format(glr_media_limit())) . '.</p><div id="glr-image-library" style="display:flex;flex-wrap:wrap;gap:12px"></div><div id="glr-media-preview"></div><p><label>Description / link text (alt text for images)<br><input id="glr-image-alt" class="widefat" type="text"></label></p><p><label>Caption (optional)<br><input id="glr-image-caption" class="widefat" type="text"></label></p><p><button type="button" class="button button-primary" id="glr-insert-image" disabled>Insert media</button> <button type="button" class="button" id="glr-cancel-image">Cancel</button></p></dialog>';
});
add_action('wp_ajax_glr_editor_upload', function () {
    if (!current_user_can('edit_posts')) wp_send_json_error(['message' => 'Forbidden'], 403);
    check_ajax_referer('glr_editor_media', 'nonce');
    try {
        $id = glr_uploaded_media('glr_asset_upload', ($_POST['glr_cover_only'] ?? '') === '1');
        if (!$id) wp_send_json_error(['message' => 'Choose a file to upload.'], 422);
        wp_send_json_success(glr_editor_asset(glr_record('asset', $id)));
    } catch (Throwable $error) { wp_send_json_error(['message' => $error->getMessage()], 422); }
});
function glr_report_status_options() {
    $statuses = ['draft' => 'Draft', 'pending' => 'Pending Review', 'glr_archived' => 'Archived'];
    if (current_user_can('publish_posts')) $statuses['publish'] = 'Published';
    if (get_post_status() === 'future') $statuses['future'] = 'Scheduled';
    if (get_post_status() === 'private') $statuses['private'] = 'Private';
    return $statuses;
}
add_action('post_submitbox_misc_actions', function ($post) {
    if ($post->post_type !== 'glr_report' || !current_user_can('edit_post', $post->ID)) return;
    // Core's status OK button never saves and its script removes Published for drafts.
    echo '<style>#submitdiv #minor-publishing-actions,#submitdiv .misc-pub-post-status,#submitdiv #publishing-action{display:none!important}</style><div class="misc-pub-section" id="glr-status-controls"><label for="glr-report-status">Status</label><p><select id="glr-report-status" name="post_status" class="widefat">';
    foreach (glr_report_status_options() as $value => $label) echo '<option value="' . esc_attr($value) . '" ' . selected($post->post_status, $value, false) . '>' . esc_html($label) . '</option>';
    echo '</select></p><button type="submit" class="button button-primary" name="glr_update_report" id="glr-update-status" value="1">Update status</button><p class="description">Saves the selected status and current report edits. Published requires all editorial fields; future publication dates schedule the report.</p></div>';
}, 5);

function glr_category_fields($term = null) {
    $id = is_object($term) ? $term->term_id : 0;
    wp_nonce_field('glr_save_category', 'glr_category_nonce');
    echo '<div class="form-field"><label>Cover image ID</label><input name="glr_cover_image" value="' . esc_attr($id ? get_term_meta($id, 'glr_cover_image', true) : '') . '"><p>Upload under GLR Media and paste the image ID.</p></div><div class="form-field"><label>Display order</label><input name="glr_sort" type="number" value="' . esc_attr($id ? get_term_meta($id, 'glr_sort', true) : 0) . '"></div>';
}
add_action('glr_category_add_form_fields', 'glr_category_fields');
add_action('glr_category_edit_form_fields', 'glr_category_fields');
function glr_save_category($id) {
    if (!current_user_can('manage_categories') || empty($_POST['glr_category_nonce']) || !wp_verify_nonce($_POST['glr_category_nonce'], 'glr_save_category')) return;
    $image = sanitize_text_field(wp_unslash($_POST['glr_cover_image'] ?? ''));
    if (!$image || (($file = glr_record('asset', $image)) && glr_media_kind($file['type']) === 'image')) update_term_meta($id, 'glr_cover_image', $image);
    update_term_meta($id, 'glr_sort', (int)($_POST['glr_sort'] ?? 0));
}
add_action('created_glr_category', 'glr_save_category'); add_action('edited_glr_category', 'glr_save_category');

add_action('admin_menu', function () {
    add_menu_page('GLR Media', 'GLR Media', 'edit_posts', 'glr-media', 'glr_media_admin', 'dashicons-format-image');
    add_menu_page('GLR Enquiries', 'GLR Enquiries', 'manage_glr_records', 'glr-inquiries', function () { glr_records_admin('inquiry'); }, 'dashicons-email');
    add_menu_page('GLR Subscribers', 'GLR Subscribers', 'manage_glr_records', 'glr-subscribers', function () { glr_records_admin('subscriber'); }, 'dashicons-groups');
});
function glr_media_admin() {
    if (!current_user_can('edit_posts')) return;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_admin_referer('glr_media');
        try { glr_uploaded_media('glr_asset_upload'); } catch (Throwable $error) { echo '<div class="notice notice-error"><p>' . esc_html($error->getMessage()) . '</p></div>'; }
    }
    echo '<div class="wrap"><h1>GLR Media</h1><p>Media files are stored outside the public website directory. Only files referenced by published content are served to visitors.</p><form method="post" enctype="multipart/form-data">'; wp_nonce_field('glr_media'); echo '<input type="file" name="glr_asset_upload" required> '; submit_button('Upload media', 'primary', 'submit', false); echo '</form><table class="widefat striped"><thead><tr><th>Preview</th><th>Filename</th><th>Image ID</th><th>Website URL</th></tr></thead><tbody>';
    foreach (glr_records('asset') as $file) {
        $preview = esc_url(wp_nonce_url(admin_url('admin-post.php?action=glr_media_preview&id=' . rawurlencode($file['id'])), 'glr_preview'));
        echo '<tr><td>' . (glr_media_kind($file['type']) === 'image' ? '<img style="max-width:120px;max-height:90px" alt="" loading="lazy" src="' . $preview . '">' : '<a href="' . $preview . '">Preview / download ' . esc_html(glr_media_kind($file['type'])) . '</a>') . '</td><td>' . esc_html($file['filename']) . '</td><td><code>' . esc_html($file['id']) . '</code></td><td><code>/api/assets/' . esc_html($file['id']) . '</code></td></tr>';
    }
    echo '</tbody></table></div>';
}
add_action('admin_post_glr_media_preview', function () {
    if (!current_user_can('edit_posts')) wp_die('Forbidden', '', ['response' => 403]);
    check_admin_referer('glr_preview');
    $id = (string)($_GET['id'] ?? '');
    if (!preg_match('/^[a-zA-Z0-9-]{1,128}$/', $id) || !($file = glr_record('asset', $id))) wp_die('Not found', '', ['response' => 404]);
    $path = glr_private_directory() . '/' . $id;
    if (!is_file($path)) wp_die('Not found', '', ['response' => 404]);
    glr_stream_media($path, $file['type'], $file['filename'], $_SERVER['HTTP_RANGE'] ?? ''); exit;
});
function glr_records_admin($kind) {
    if (!current_user_can('manage_glr_records')) return;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_admin_referer('glr_records_' . $kind);
        $item = glr_record($kind, sanitize_text_field(wp_unslash($_POST['record_id'] ?? '')));
        $status = sanitize_text_field(wp_unslash($_POST['record_status'] ?? ''));
        $allowed = $kind === 'inquiry' ? ['new', 'in_progress', 'closed'] : ['pending', 'active', 'unsubscribed'];
        if ($item && in_array($status, $allowed, true)) { $item['status'] = $status; if ($status === 'unsubscribed') $item['unsubscribed_at'] = gmdate('c'); glr_put_record($kind, $item); }
    }
    echo '<div class="wrap"><h1>' . ($kind === 'inquiry' ? 'GLR Enquiries' : 'GLR Subscribers') . '</h1><table class="widefat striped"><thead><tr><th>Email / name</th><th>Details</th><th>Status</th></tr></thead><tbody>';
    foreach (glr_records($kind) as $item) {
        echo '<tr><td>' . esc_html($item['email']) . '<br>' . esc_html($item['name'] ?? '') . '</td><td><pre style="white-space:pre-wrap">' . esc_html($kind === 'inquiry' ? $item['message'] : wp_json_encode(array_diff_key($item, array_flip(['confirmation_nonce_hash', 'consent_ip_hash'])), JSON_PRETTY_PRINT)) . '</pre></td><td><form method="post">'; wp_nonce_field('glr_records_' . $kind); echo '<input type="hidden" name="record_id" value="' . esc_attr($item['id']) . '"><select name="record_status">';
        foreach ($kind === 'inquiry' ? ['new', 'in_progress', 'closed'] : ['pending', 'active', 'unsubscribed'] as $status) echo '<option ' . selected($item['status'], $status, false) . '>' . esc_html($status) . '</option>';
        echo '</select>'; submit_button('Save', 'secondary', 'submit', false); echo '</form></td></tr>';
    }
    echo '</tbody></table></div>';
}
