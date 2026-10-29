import sanitizeHtml from 'sanitize-html';
import { DomUtils, parseDocument } from 'htmlparser2';

const ALLOWED_TAGS = [
  'p', 'br', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's',
  'blockquote', 'ul', 'ol', 'li', 'a', 'hr', 'figure', 'figcaption', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'pre', 'code', 'span', 'sub', 'sup', 'video', 'audio', 'source'
];

const ASSET_TRANSFORMS = new Set(['width', 'height', 'quality', 'fit', 'format']);
const INLINE_TAGS = new Set(['br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'span', 'sub', 'sup', 'code']);

function normalizeReportParagraphs(html) {
  const output = [];
  let paragraph = '';
  const flush = () => {
    if (DomUtils.textContent(parseDocument(paragraph)).trim()) output.push(`<p>${paragraph.trim()}</p>`);
    else if (paragraph.trim()) output.push(paragraph.trim());
    paragraph = '';
  };

  for (const node of parseDocument(html).children) {
    if (node.type === 'text') {
      for (const part of node.data.split(/(\r?\n[\t ]*\r?\n)/)) {
        if (/^\r?\n[\t ]*\r?\n$/.test(part)) flush();
        else paragraph += DomUtils.getOuterHTML({ ...node, data: part });
      }
    } else if (INLINE_TAGS.has(node.name)) {
      paragraph += DomUtils.getOuterHTML(node);
    } else {
      flush();
      output.push(DomUtils.getOuterHTML(node));
    }
  }
  flush();
  return output.join('');
}

function proxyAssetUrl(source) {
  if (!source) return source;

  try {
    const url = new URL(source, 'http://cms.local');
    const match = url.pathname.match(/^\/(?:api\/)?assets\/([a-zA-Z0-9-]{1,128})(?:\.(?:jpe?g|png|webp|gif|avif))?$/i);
    if (!match) return source;

    const query = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      if (ASSET_TRANSFORMS.has(key)) query.set(key, value);
    }

    return `/api/assets/${encodeURIComponent(match[1])}${query.size ? `?${query}` : ''}`;
  } catch {
    return source;
  }
}

export function sanitizeReportHtml(content) {
  const safeHtml = sanitizeHtml(String(content ?? ''), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'name', 'target', 'title', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      video: ['src', 'controls', 'preload', 'poster', 'width', 'height', 'aria-label'],
      audio: ['src', 'controls', 'preload', 'aria-label'],
      source: ['src', 'type'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      ol: ['start'],
      '*': ['style']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowedStyles: {
      '*': {
        'text-align': [/^(?:left|right|center|justify)$/],
        'font-family': [/^(?:arial,\s*helvetica,\s*sans-serif|georgia,\s*palatino,\s*serif|["']?times new roman["']?,\s*times,\s*serif|verdana,\s*geneva,\s*sans-serif|["']?courier new["']?,\s*courier,\s*monospace)$/i],
        'font-size': [/^(?:10|12|14|16|18|24|36)pt$/],
        'padding-left': [/^(?:0|40|80|120|160|200)px$/],
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,.%]+\)$/i],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,.%]+\)$/i]
      }
    },
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: { ...attributes, href: proxyAssetUrl(attributes.href), ...(attributes.target === '_blank' ? { rel: 'noopener noreferrer' } : {}) }
      }),
      video: (tagName, attributes) => ({ tagName, attribs: { ...attributes, src: proxyAssetUrl(attributes.src), ...(attributes.poster ? { poster: proxyAssetUrl(attributes.poster) } : {}), controls: '', preload: 'metadata' } }),
      audio: (tagName, attributes) => ({ tagName, attribs: { ...attributes, src: proxyAssetUrl(attributes.src), controls: '', preload: 'metadata' } }),
      source: (tagName, attributes) => ({ tagName, attribs: { ...attributes, src: proxyAssetUrl(attributes.src) } }),
      img: (tagName, attributes) => ({
        tagName,
        attribs: { ...attributes, src: proxyAssetUrl(attributes.src), loading: attributes.loading || 'lazy' }
      })
    }
  });
  return normalizeReportParagraphs(safeHtml);
}
