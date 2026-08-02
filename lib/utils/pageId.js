/**
 * 截取page-id的语言前缀
 * notionPageId的格式可以是 en:xxxxx
 * @param {*} str
 * @returns en|zh|xx
 */
function extractLangPrefix(str) {
  const match = str.match(/^(.+?):/)
  if (match?.[1]) {
    return match[1]
  } else {
    return ''
  }
}

/**
 * 截取page-id的id
 * notionPageId的格式可以是 en:xxxxx   * @param {*} str
 * @returns xxxxx
 */
function extractLangId(str) {
  // 使用正则表达式匹配字符串
  const match = str.match(/:\s*(.+)/)
  // 如果匹配成功，则返回匹配到的内容
  if (match?.[1]) {
    return match[1]
  } else {
    // 如果没有匹配到，则返回空字符串或者其他你想要返回的值
    return str
  }
}

/**
 * 在不覆盖现有数据源的前提下，为多语言站点追加一个数据库。
 * 已存在同语言前缀时保持原配置，避免生成重复 locale。
 */
function appendLocalePageId(pageIds, locale, pageId) {
  const current = String(pageIds || '').trim()
  const nextLocale = String(locale || '').trim()
  const nextPageId = String(pageId || '').trim()

  if (!nextLocale || !nextPageId) {
    return current
  }

  const entries = current
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)

  if (entries.some(entry => extractLangPrefix(entry) === nextLocale)) {
    return entries.join(',')
  }

  return [...entries, `${nextLocale}:${nextPageId}`].join(',')
}

/**
 * 列表中用过来区分page只需要端的id足够
 */

function getShortId(uuid) {
  if (!uuid?.includes('-')) {
    return uuid
  }
  return uuid.substring(14)
}

module.exports = {
  extractLangPrefix,
  extractLangId,
  appendLocalePageId,
  getShortId
}
