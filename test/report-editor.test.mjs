import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('editor previews private images but saves stable frontend URLs', () => {
  let setup, parse, serialize, table, upload, getContent;
  const context = {
    glrReportEditor: { assets: [{ id: 'image-1', filename: 'Image.jpg', preview: 'https://cms.example/admin-post.php?nonce=private' }] },
    document: {}, location: { origin: 'https://cms.example' }, URL, URLSearchParams,
    jQuery: value => typeof value === 'function' ? undefined : { on: (_event, callback) => { setup = callback; } }
  };
  vm.runInNewContext(readFileSync(new URL('../wordpress/glr-cms/report-editor.js', import.meta.url), 'utf8'), context);
  let inserted = '';
  const editor = { id: 'content', addButton: (name, button) => { if (name === 'glr_table') table = button; else if (name === 'glr_media') upload = button; }, on: (name, callback) => { if (name === 'PreInit') callback(); else if (name === 'GetContent') getContent = callback; }, parser: { addNodeFilter: (_tag, callback) => { parse = callback; } }, serializer: { addNodeFilter: (_tag, callback) => { serialize = callback; } }, windowManager: { open: options => { table = options; }, alert: () => {} }, insertContent: html => { inserted = html; } };
  setup(null, editor);
  assert.equal(upload.text, 'Upload media');
  const attributes = new Map([['src', '/api/assets/image-1']]);
  const node = { attr: (key, value) => value === undefined ? attributes.get(key) : attributes.set(key, value) };
  parse([node]);
  assert.equal(attributes.get('src'), context.glrReportEditor.assets[0].preview);
  assert.equal(attributes.get('data-mce-src'), '/api/assets/image-1');
  serialize([node]);
  assert.equal(attributes.get('src'), '/api/assets/image-1');
  attributes.set('src', 'https://legacy-cms.example/assets/image-1.jpg?width=200');
  parse([node]);
  assert.equal(attributes.get('src'), context.glrReportEditor.assets[0].preview);
  assert.equal(attributes.get('data-mce-src'), '/api/assets/image-1?width=200');
  assert.equal(attributes.get('width'), '200');
  serialize([node]);
  assert.equal(attributes.get('src'), '/api/assets/image-1?width=200');
  const content = { content: '<video src="' + context.glrReportEditor.assets[0].preview + '"></video>' };
  getContent(content);
  assert.equal(content.content, '<video src="/api/assets/image-1"></video>');
  const linkAttributes = new Map([['href', '/api/assets/image-1']]);
  const link = { name: 'a', attr: (key, value) => value === undefined ? linkAttributes.get(key) : linkAttributes.set(key, value) };
  parse([link]); serialize([link]);
  assert.equal(linkAttributes.get('href'), '/api/assets/image-1');
  table.onclick();
  table.onsubmit({ data: { rows: '2', columns: '3' } });
  assert.equal((inserted.match(/<td>/g) || []).length, 6);
  let prevented = false;
  table.onsubmit({ data: { rows: '999999', columns: '3' }, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal((inserted.match(/<td>/g) || []).length, 6);
});

test('administrator preview submits unsaved visual or code content without saving the report', () => {
  for (const visual of [true, false]) {
    let click, submitted, removed = false;
    const button = { dataset: { url: 'https://cms.example/wp-admin/admin-post.php', id: '6', nonce: 'report-nonce' }, addEventListener: (_event, callback) => { click = callback; } };
    const fields = { post_title: 'Unsaved title', excerpt: 'Unsaved summary', glr_author: 'Writer', glr_category: '3' };
    const context = {
      glrReportEditor: { assets: [] },
      tinymce: { get: () => ({ isHidden: () => !visual, getContent: () => '<p>Unsaved visual content</p>' }) },
      document: {
        getElementById: id => id === 'glr-preview-report' ? button : id === 'content' ? { value: '<p>Unsaved code content</p>' } : null,
        querySelector: selector => ({ value: fields[selector.match(/name="([^"]+)"/)[1]] || '' }),
        createElement: tag => tag === 'form' ? { inputs: [], append(input) { this.inputs.push(input); }, submit() { submitted = Object.fromEntries(this.inputs.map(input => [input.name, input.value])); assert.equal(this.target, '_blank'); assert.equal(this.action, button.dataset.url); }, remove() { removed = true; } } : {},
        body: { append() {} }
      },
      jQuery: value => typeof value === 'function' ? value() : { on() {} }
    };
    vm.runInNewContext(readFileSync(new URL('../wordpress/glr-cms/report-editor.js', import.meta.url), 'utf8'), context);
    click.call(button);
    assert.equal(submitted.action, 'glr_report_preview');
    assert.equal(submitted.post_id, '6');
    assert.equal(submitted._wpnonce, 'report-nonce');
    assert.equal(submitted.post_title, 'Unsaved title');
    assert.equal(submitted.glr_category, '3');
    assert.equal(submitted.post_content, visual ? '<p>Unsaved visual content</p>' : '<p>Unsaved code content</p>');
    assert.equal(removed, true);
  }
});
