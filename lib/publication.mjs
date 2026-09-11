export function addPublishedReportFilters(params, prefix = 'filter') {
  params.set(`${prefix}[status][_eq]`, 'published');
  params.set(`${prefix}[published_at][_lte]`, '$NOW');
  return params;
}
