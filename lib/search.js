export function searchParam(value) {
  return String(Array.isArray(value) ? value[0] || '' : value || '').trim()
}

function values(value) {
  return (Array.isArray(value) ? value : [value]).filter(Boolean).map(String)
}

export function filterSearchPosts(
  posts = [],
  { keyword = '', category = '', tag = '' } = {}
) {
  const query = searchParam(keyword).toLocaleLowerCase()
  return posts.filter(post => {
    const categories = values(post.category)
    const tags = values(post.tags)
    if (category && !categories.includes(category)) return false
    if (tag && !tags.includes(tag)) return false
    const content = [
      post.title,
      post.summary,
      post.categoryLabel,
      ...categories,
      ...tags,
      ...(post.tagItems || []).map(item => item.label),
      ...(post.results || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
    return !query || content.includes(query)
  })
}
