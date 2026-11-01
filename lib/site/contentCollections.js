function text(value) {
  return String(Array.isArray(value) ? value[0] || '' : value || '').trim()
}

function order(value) {
  return text(value) !== '' && Number.isFinite(Number(value))
    ? Number(value)
    : Number.MAX_SAFE_INTEGER
}

function summary(page) {
  return {
    id: page.id,
    title: page.title || '',
    summary: page.summary || '',
    href: page.href || `/${page.slug}`,
    slug: page.slug,
    pageCoverThumbnail: page.pageCoverThumbnail || page.pageCover || ''
  }
}

export function getSeriesCollections(allPages = []) {
  const posts = allPages.filter(
    page => page?.type === 'Post' && page.status === 'Published'
  )
  return allPages
    .filter(
      page =>
        page?.type === 'Series' &&
        page.status === 'Published' &&
        page.slug &&
        !page.slug.includes('/')
    )
    .sort((a, b) => order(a.sort_order) - order(b.sort_order))
    .map(page => {
      const names = [page.slug, page.title, page.title_en, page.source_title]
      const articles = posts
        .filter(post => names.includes(text(post.series)))
        .sort((a, b) => order(a.series_order) - order(b.series_order))
        .map(summary)
      return {
        ...summary(page),
        href: `/series/${encodeURIComponent(page.slug)}`,
        articles
      }
    })
}

function httpUrl(value) {
  try {
    const url = new URL(text(value))
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

export function getProjects(allPages = []) {
  return allPages
    .filter(page => page?.type === 'Project' && page.status === 'Published')
    .sort((a, b) => order(a.sort_order) - order(b.sort_order))
    .map(page => ({
      ...summary(page),
      projectUrl: httpUrl(page.project_url),
      repository: httpUrl(page.repository),
      projectStatus: text(page.project_status)
    }))
}
