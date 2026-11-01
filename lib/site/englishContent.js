export function getTranslationPageId(value) {
  if (typeof value !== 'string') return ''
  const match = value.match(
    /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i
  )
  if (!match) return ''
  const id = match[0].replace(/-/g, '').toLowerCase()
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
}

export function localizeSiteData(data, locale) {
  if (!/^en(?:-|$)/i.test(locale || '')) return data
  const config = data.NOTION_CONFIG || {}
  Object.entries(config).forEach(([key, value]) => {
    if (key.endsWith('_EN')) config[key.slice(0, -3)] = value
  })
  const pages = data.allPages || []
  const metadata = new Map(
    pages.flatMap(page => [
      [page.slug, page],
      [page.id, page]
    ])
  )
  const categories = config.CATEGORY_TRANSLATIONS || {}
  const tags = config.TAG_TRANSLATIONS || {}
  const localize = page => {
    if (!page) return page
    const source =
      page.title_en || page.translation_en
        ? page
        : metadata.get(page.id) || metadata.get(page.slug) || page
    if (source.title_en) {
      page.source_title = page.source_title || page.title
      page.title = source.title_en
      if (page.name) page.name = source.title_en
    }
    if (source.summary_en) page.summary = source.summary_en
    page.categoryLabel = categories[page.category] || page.category || ''
    if (page.tagItems)
      page.tagItems = page.tagItems.map(tag => ({
        ...tag,
        label: tags[tag.name] || tag.name
      }))
    if (source.translation_en_status === 'Published') {
      page.contentId = getTranslationPageId(source.translation_en)
      page.contentLastEditedDate = source.translation_en_edited
    }
    page.subMenus?.forEach(localize)
    return page
  }
  for (const field of [
    'allPages',
    'latestPosts',
    'allNavPages',
    'allLinkPages',
    'customNav',
    'customMenu'
  ])
    data[field]?.forEach(localize)
  localize(data.notice)
  data.categoryOptions =
    data.categoryOptions?.map(category => ({
      ...category,
      label: categories[category.name] || category.name
    })) || []
  data.tagOptions =
    data.tagOptions?.map(tag => ({
      ...tag,
      label: tags[tag.name] || tag.name
    })) || []
  if (data.siteInfo) {
    if (config.TITLE_EN) data.siteInfo.title = config.TITLE_EN
    if (config.DESCRIPTION_EN) data.siteInfo.description = config.DESCRIPTION_EN
  }
  return data
}
