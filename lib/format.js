export function formatReportDate(value, options = {}) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: options.short ? 'short' : 'long',
    year: 'numeric'
  }).format(new Date(value));
}

export function reportMeta(report, options = {}) {
  return `${options.includeAuthor === false ? '' : `By ${report.author} · `}${formatReportDate(report.published_at, { short: true })} · ${report.reading_time || 5} min read`;
}
