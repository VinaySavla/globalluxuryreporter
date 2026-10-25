/* global jQuery, glrReportEditor, tinymce, QTags */
(function () {
  'use strict';
  const assets = new Map(glrReportEditor.assets.map(asset => [asset.id, asset]));
  let openPicker = () => {};
  let bookmark;
  const assetId = source => {
    try { return new URL(source, location.origin).pathname.match(/^\/(?:api\/)?assets\/([a-zA-Z0-9-]{1,128})(?:\.(?:jpe?g|png|webp|gif|avif))?$/i)?.[1]; }
    catch { return null; }
  };
  jQuery(document).on('tinymce-editor-setup', function (_event, editor) {
    if (editor.id !== 'content') return;
    editor.addButton('glr_media', { text: 'Upload media', icon: 'upload', tooltip: 'Upload or insert media', onclick: () => { bookmark = editor.selection.getBookmark(); openPicker(); } });
    editor.on('GetContent', function (event) {
      if (typeof event.content !== 'string') return;
      // TinyMCE's media plugin may serialize its own preview markup after node filters.
      for (const asset of assets.values()) for (const preview of [asset.preview, asset.preview.replace(/&/g, '&amp;')]) event.content = event.content.split(preview).join('/api/assets/' + asset.id);
    });
    editor.addButton('glr_table', {
      text: 'Table', tooltip: 'Insert table',
      onclick: function () {
        editor.windowManager.open({
          title: 'Insert table',
          body: [{ type: 'textbox', name: 'rows', label: 'Rows (1–20)', value: '3' }, { type: 'textbox', name: 'columns', label: 'Columns (1–10)', value: '3' }],
          onsubmit: function (event) {
            const rows = Number(event.data.rows), columns = Number(event.data.columns);
            if (!Number.isInteger(rows) || rows < 1 || rows > 20 || !Number.isInteger(columns) || columns < 1 || columns > 10) {
              event.preventDefault(); editor.windowManager.alert('Choose 1–20 rows and 1–10 columns.'); return;
            }
            editor.insertContent('<table><tbody>' + Array.from({ length: rows }, () => '<tr>' + '<td>&nbsp;</td>'.repeat(columns) + '</tr>').join('') + '</tbody></table><p></p>');
          }
        });
      }
    });
    editor.on('PreInit', function () {
      // Preview unpublished media privately; save only the frontend's stable URLs.
      editor.parser.addNodeFilter('img,video,audio,source,a', function (nodes) {
        nodes.forEach(node => {
          const attribute = node.name === 'a' ? 'href' : 'src';
          const asset = assets.get(assetId(node.attr(attribute)));
          if (asset) {
            const original = new URL(node.attr(attribute), location.origin), query = new URLSearchParams();
            for (const [key, value] of original.searchParams) if (['width', 'height', 'quality', 'fit', 'format'].includes(key)) query.set(key, value);
            for (const key of ['width', 'height']) {
              const value = Number(query.get(key));
              if (!node.attr(key) && Number.isInteger(value) && value >= 16 && value <= 2400) node.attr(key, String(value));
            }
            node.attr(attribute, asset.preview); node.attr('data-mce-' + attribute, '/api/assets/' + asset.id + (query.size ? '?' + query : ''));
          }
        });
      });
      editor.serializer.addNodeFilter('img,video,audio,source,a', function (nodes) {
        nodes.forEach(node => {
          const attribute = node.name === 'a' ? 'href' : 'src';
          for (const asset of assets.values()) {
            if (node.attr(attribute) === asset.preview) { node.attr(attribute, node.attr('data-mce-' + attribute) || '/api/assets/' + asset.id); break; }
          }
        });
      });
    });
  });
  jQuery(function () {
    document.getElementById('glr-preview-report')?.addEventListener('click', function () {
      const form = document.createElement('form');
      form.method = 'POST'; form.action = this.dataset.url; form.target = '_blank'; form.rel = 'noopener';
      const values = { action: 'glr_report_preview', post_id: this.dataset.id, _wpnonce: this.dataset.nonce };
      for (const name of ['post_title', 'excerpt', 'glr_author', 'glr_cover_alt', 'glr_reading_time', 'glr_category']) values[name] = document.querySelector('[name="' + name + '"]')?.value || '';
      const editor = typeof tinymce !== 'undefined' && tinymce.get('content');
      values.post_content = editor && !editor.isHidden() ? editor.getContent() : document.getElementById('content').value;
      for (const [name, value] of Object.entries(values)) {
        const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = value; form.append(input);
      }
      document.body.append(form); form.submit(); form.remove();
    });
    const dialog = document.getElementById('glr-image-picker');
    if (!dialog) return;
    const library = document.getElementById('glr-image-library');
    const insert = document.getElementById('glr-insert-image');
    const message = document.getElementById('glr-media-message');
    const preview = document.getElementById('glr-media-preview');
    document.getElementById('glr-inline-upload').accept = glrReportEditor.accept;
    let selected = null;
    function renderLibrary() {
      library.replaceChildren();
      for (const asset of assets.values()) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'button';
        button.style.cssText = 'height:auto;max-width:150px;white-space:normal;padding:6px';
        button.setAttribute('aria-pressed', String(selected?.id === asset.id));
        if (asset.kind === 'image') {
          const image = document.createElement('img'); image.src = asset.preview; image.alt = ''; image.loading = 'lazy'; image.style.cssText = 'width:130px;height:90px;object-fit:contain;display:block'; button.append(image);
        } else { const type = document.createElement('strong'); type.textContent = (asset.kind || 'document').toUpperCase(); button.append(type, document.createElement('br')); }
        button.append(document.createTextNode(asset.filename));
        button.addEventListener('click', () => { selected = asset; insert.disabled = false; renderLibrary(); showPreview(); });
        library.append(button);
      }
      if (!assets.size) library.textContent = 'No media yet. Upload a file above.';
    }
    function showPreview() {
      preview.replaceChildren();
      if (selected && ['video', 'audio'].includes(selected.kind)) {
        const player = document.createElement(selected.kind); player.controls = true; player.preload = 'metadata'; player.src = selected.preview; player.style.maxWidth = '100%'; preview.append(player);
      }
    }
    openPicker = () => {
      selected = null; insert.disabled = true; message.textContent = '';
      document.getElementById('glr-image-alt').value = ''; document.getElementById('glr-image-caption').value = '';
      renderLibrary(); showPreview(); dialog.showModal();
    };
    if (typeof QTags !== 'undefined') QTags.addButton('glr_media', 'Upload media', openPicker, '', '', 'Upload or insert media', 1, 'content');
    dialog.addEventListener('close', () => preview.replaceChildren());
    document.getElementById('glr-cancel-image').addEventListener('click', () => dialog.close());
    document.getElementById('glr-upload-image').addEventListener('click', async function () {
      const file = document.getElementById('glr-inline-upload').files[0];
      if (!file) { message.textContent = 'Choose a file first.'; return; }
      if (file.size > glrReportEditor.maxBytes) { message.textContent = 'This file exceeds the upload limit shown above.'; return; }
      const data = new FormData(); data.set('action', 'glr_editor_upload'); data.set('nonce', glrReportEditor.nonce); data.set('glr_asset_upload', file);
      this.disabled = true; message.textContent = 'Uploading media…';
      try {
        const response = await fetch(glrReportEditor.ajaxUrl, { method: 'POST', body: data, credentials: 'same-origin' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.data?.message || 'Upload failed. Reload the editor and try again.');
        assets.set(result.data.id, result.data); selected = result.data; insert.disabled = false; renderLibrary(); showPreview(); message.textContent = 'File uploaded. Add a description, then select Insert media.';
      } catch (error) { message.textContent = error.message; }
      finally { this.disabled = false; }
    });
    insert.addEventListener('click', function () {
      if (!selected) return;
      const kind = selected.kind || 'image';
      const media = document.createElement(kind === 'document' ? 'a' : kind === 'image' ? 'img' : kind);
      const url = '/api/assets/' + selected.id, description = document.getElementById('glr-image-alt').value;
      if (kind === 'document') { media.href = url; media.textContent = description || selected.filename; }
      else { media.src = url; if (kind === 'image') media.alt = description; else { media.controls = true; media.preload = 'metadata'; media.setAttribute('aria-label', description || selected.filename); const fallback = document.createElement('a'); fallback.href = url; fallback.textContent = 'Download ' + selected.filename; media.append(fallback); } }
      const caption = document.getElementById('glr-image-caption').value;
      let html = media.outerHTML;
      if (caption) { const figure = document.createElement('figure'); const text = document.createElement('figcaption'); text.textContent = caption; figure.append(media, text); html = figure.outerHTML; }
      const editor = typeof tinymce !== 'undefined' && tinymce.get('content');
      if (editor && !editor.isHidden()) { editor.focus(); if (bookmark) editor.selection.moveToBookmark(bookmark); editor.insertContent(html); }
      else { window.wpActiveEditor = 'content'; QTags.insertContent(html); }
      dialog.close();
    });
  });
}());
