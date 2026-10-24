import 'server-only';
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'br', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's',
  'blockquote', 'ul', 'ol', 'li', 'a', 'hr', 'figure', 'figcaption', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'pre', 'code', 'span'
];

const ASSET_TRANSFORMS = new Set(['width', 'height', 'quality', 'fit', 'format']);

function proxyAssetUrl(source) {
  if (!source) return source;

  try {
    const url = new URL(source, 'http://cms.local');
    const match = url.pathname.match(/^\/(?:api\/)?assets\/([a-zA-Z0-9-]{1,128})$/);
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
  return sanitizeHtml(String(content ?? ''), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'name', 'target', 'title', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
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
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,.%]+\)$/i],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,.%]+\)$/i]
      }
    },
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: attributes.target === '_blank'
          ? { ...attributes, rel: 'noopener noreferrer' }
          : attributes
      }),
      img: (tagName, attributes) => ({
        tagName,
        attribs: { ...attributes, src: proxyAssetUrl(attributes.src), loading: attributes.loading || 'lazy' }
      })
    }
  });
}
