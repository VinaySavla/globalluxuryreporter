import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeReportHtml } from '../lib/report-html.js';

test('legacy bare text and editor inline formatting become styled report paragraphs', () => {
  const html = sanitizeReportHtml('<strong>Opening &amp; introduction.</strong>\r\n\r\nFirst body paragraph.\r\n\r\nSecond <em>body</em> paragraph.\r\n<h2>Section</h2>\r\nFinal paragraph.');
  assert.equal(html, '<p><strong>Opening &amp; introduction.</strong></p><p>First body paragraph.</p><p>Second <em>body</em> paragraph.</p><h2>Section</h2><p>Final paragraph.</p>');
  assert.equal(sanitizeReportHtml(html), html);
});

test('paragraph normalization preserves existing blocks, media and escaped text', () => {
  const html = sanitizeReportHtml('<p>Existing paragraph.</p>\n<h2>Heading</h2>\nUnwrapped &lt;script&gt; text.\n\n<img src="/api/assets/image-1" alt="Image"><ul><li>List entry</li></ul><blockquote><p>Quoted text.</p></blockquote><pre>Code\n\nblock</pre><table><tbody><tr><td>Cell</td></tr></tbody></table>');
  assert.ok(html.includes('<p>Unwrapped &lt;script&gt; text.</p>'));
  for (const block of ['<p>Existing paragraph.</p>', '<h2>Heading</h2>', '<ul><li>List entry</li></ul>', '<blockquote><p>Quoted text.</p></blockquote>', '<pre>Code\n\nblock</pre>', '<td>Cell</td>']) assert.ok(html.includes(block), block);
  assert.ok(!html.includes('<p><img') && !html.includes('<p><p>'));
  assert.equal(sanitizeReportHtml(html), html);
  assert.match(sanitizeReportHtml('<a name="section"></a><h2>Section</h2>'), /^<a name="section"[^>]*><\/a><h2>Section<\/h2>$/);
});

test('visual editor formatting, tables and image descriptions survive sanitization', () => {
  const html = sanitizeReportHtml('<h2>Title</h2><p style="text-align:center;padding-left:40px"><span style="font-family:georgia,palatino,serif;font-size:18pt;color:#112233;background-color:#ffffff">Text</span><sub>2</sub><sup>3</sup></p><table><tbody><tr><td>Cell</td></tr></tbody></table><figure><img src="/api/assets/test-image" alt="A descriptive view"><figcaption>Caption</figcaption></figure>');
  for (const expected of ['text-align:center', 'padding-left:40px', 'font-size:18pt', 'font-family:georgia,palatino,serif', '<sub>2</sub>', '<sup>3</sup>', '<td>Cell</td>', 'src="/api/assets/test-image"', 'alt="A descriptive view"', '<figcaption>Caption</figcaption>']) assert.ok(html.includes(expected), expected);
});

test('rich formatting still rejects scripts, event handlers and arbitrary CSS', () => {
  const html = sanitizeReportHtml('<script>alert(1)</script><p style="position:fixed;font-size:900pt;background-image:url(https://example.com/tracker)">Safe</p><img src="javascript:alert(1)" onerror="alert(1)">');
  for (const blocked of ['script', 'onerror', 'javascript:', 'position:', '900pt', 'background-image', 'tracker']) assert.ok(!html.includes(blocked), blocked);
  assert.ok(html.includes('Safe'));
});

test('old inline image URLs use the current image proxy and retain safe transforms', () => {
  const html = sanitizeReportHtml('<img src="https://legacy-cms.example/assets/image-1.jpg?width=200&amp;height=300&amp;token=old-secret" alt="Archive">');
  assert.ok(html.includes('src="/api/assets/image-1?width=200&amp;height=300"'));
  assert.ok(!html.includes('legacy-cms.example') && !html.includes('old-secret'));
});

test('video, audio and document links survive with safe player controls', () => {
  const html = sanitizeReportHtml('<video src="/api/assets/video-1" autoplay onplay="bad()"><source src="/api/assets/video-2" type="video/mp4"></video><audio src="/api/assets/audio-1" controls></audio><a href="/assets/document-1">Download PDF</a>');
  for (const expected of ['<video', '<audio', '<source', 'controls', 'preload="metadata"', 'href="/api/assets/document-1"']) assert.ok(html.includes(expected), expected);
  assert.ok(!html.includes('autoplay') && !html.includes('onplay'));
  const unsafe = sanitizeReportHtml('<video src="javascript:bad()"><source src="data:text/html,bad"></video><iframe src="https://example.com"></iframe>');
  assert.ok(!unsafe.includes('javascript:') && !unsafe.includes('data:') && !unsafe.includes('iframe'));
});
