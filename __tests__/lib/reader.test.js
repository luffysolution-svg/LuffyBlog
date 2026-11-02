import {
  getReadingPosition,
  readReaderState,
  READER_STORAGE_KEY,
  toggleBookmark,
  updateReaderState
} from '@/lib/reader'

beforeEach(() => {
  localStorage.clear()
})

test('bookmarks persist between reads and can be removed without losing progress', () => {
  updateReaderState(state => ({
    ...state,
    progress: { 'en:one': { offset: 500, percent: 0.4 } }
  }))
  expect(toggleBookmark('one')).toBe(true)
  toggleBookmark('two')
  expect(readReaderState().bookmarks).toEqual(['two', 'one'])
  toggleBookmark('one')
  expect(readReaderState()).toEqual({
    bookmarks: ['two'],
    progress: { 'en:one': { offset: 500, percent: 0.4 } }
  })
})

test('progress writes merge with the latest bookmarks and other language positions', () => {
  toggleBookmark('one')
  for (const language of ['en', 'zh-CN']) {
    updateReaderState(state => ({
      ...state,
      progress: {
        ...state.progress,
        [`${language}:one`]: { offset: 600, percent: 0.5 }
      }
    }))
  }
  expect(readReaderState().bookmarks).toEqual(['one'])
  expect(Object.keys(readReaderState().progress)).toEqual([
    'en:one',
    'zh-CN:one'
  ])
})

test('invalid saved JSON can be replaced and storage failure is reported', () => {
  localStorage.setItem(READER_STORAGE_KEY, '{broken')
  expect(readReaderState()).toEqual({ bookmarks: [], progress: {} })
  expect(toggleBookmark('one')).toBe(true)
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage unavailable')
  })
  expect(toggleBookmark('two')).toBe(false)
  expect(readReaderState().bookmarks).toEqual(['one'])
})

test('reading percentage measures the article and clamps at the end', () => {
  const article = {
    offsetHeight: 4000,
    getBoundingClientRect: () => ({ top: -404 })
  }
  expect(getReadingPosition(article, 1000, 1000)).toEqual({
    offset: 500,
    percent: 500 / 3096
  })
  expect(
    getReadingPosition(
      { ...article, getBoundingClientRect: () => ({ top: -5000 }) },
      5600,
      1000
    )
  ).toEqual({ offset: 3096, percent: 1 })
})
