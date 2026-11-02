export const READER_STORAGE_KEY = 'luffyblog:reader:v1'
export const READER_CHANGE_EVENT = 'luffyblog:reader-change'

export function readReaderState() {
  try {
    const state = JSON.parse(localStorage.getItem(READER_STORAGE_KEY))
    return {
      bookmarks: Array.isArray(state?.bookmarks)
        ? state.bookmarks.filter(id => typeof id === 'string')
        : [],
      progress:
        state?.progress && typeof state.progress === 'object'
          ? state.progress
          : {}
    }
  } catch {
    return { bookmarks: [], progress: {} }
  }
}

export function updateReaderState(update) {
  try {
    localStorage.setItem(
      READER_STORAGE_KEY,
      JSON.stringify(update(readReaderState()))
    )
    window.dispatchEvent(new Event(READER_CHANGE_EVENT))
    return true
  } catch {
    return false
  }
}

export function toggleBookmark(id) {
  return updateReaderState(state => ({
    ...state,
    bookmarks: state.bookmarks.includes(id)
      ? state.bookmarks.filter(bookmark => bookmark !== id)
      : [id, ...state.bookmarks]
  }))
}

export function getReadingPosition(article, scrollY, viewportHeight) {
  const top = article.getBoundingClientRect().top + scrollY
  const offset = Math.max(0, scrollY - top + 96)
  const length = Math.max(0, article.offsetHeight - viewportHeight + 96)
  return {
    offset: Math.min(offset, length),
    percent: length > 0 ? Math.min(1, offset / length) : 1
  }
}
