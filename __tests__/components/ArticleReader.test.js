import ArticleReader from '@/components/ArticleReader'
import BookmarkList from '@/components/BookmarkList'
import { siteConfig } from '@/lib/config'
import english from '@/lib/lang/en-US'
import { READER_STORAGE_KEY, readReaderState } from '@/lib/reader'
import { act, fireEvent, render, screen } from '@testing-library/react'

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, fallback) => fallback)
}))
jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ locale: english, lang: 'en-US' })
}))

const post = {
  id: 'one',
  title: 'An article',
  summary: 'Current summary',
  href: '/article/one'
}

beforeEach(() => {
  localStorage.clear()
  siteConfig.mockImplementation((key, fallback) => fallback)
})

afterEach(() => jest.useRealTimers())

test('a bookmark survives remounting and can be removed from the bookmarks page', () => {
  const { unmount } = render(<ArticleReader post={post} />)
  fireEvent.click(screen.getByRole('button', { name: 'Bookmark article' }))
  expect(screen.getByRole('button', { name: 'Bookmarked' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  unmount()
  render(<BookmarkList posts={[post]} />)
  expect(screen.getByRole('link', { name: post.title })).toHaveAttribute(
    'href',
    '/article/one'
  )
  fireEvent.click(
    screen.getByRole('button', { name: `Remove bookmark: ${post.title}` })
  )
  expect(
    screen.queryByRole('link', { name: post.title })
  ).not.toBeInTheDocument()
  expect(readReaderState().bookmarks).toEqual([])
})

test('offers a saved reading position without overwriting it on mount', () => {
  const saved = { offset: 1200, percent: 0.4 }
  localStorage.setItem(
    READER_STORAGE_KEY,
    JSON.stringify({ bookmarks: [], progress: { 'en-US:one': saved } })
  )
  const { unmount } = render(<ArticleReader post={post} />)
  expect(
    screen.getByRole('button', { name: 'Continue reading' })
  ).toBeInTheDocument()
  unmount()
  expect(readReaderState().progress['en-US:one']).toEqual(saved)
})

test('flushes an unsaved scroll position when leaving the article', () => {
  jest.useFakeTimers()
  const { unmount, container } = render(
    <div id='article-wrapper'>
      <ArticleReader post={post} />
      <div id='notion-article' />
    </div>
  )
  const article = container.querySelector('#notion-article')
  Object.defineProperty(article, 'offsetHeight', { value: 5000 })
  article.getBoundingClientRect = () => ({ top: -1000 })
  act(() => fireEvent.scroll(window))
  unmount()
  expect(readReaderState().progress['en-US:one'].offset).toBe(1096)
})

test('feature switches remove the tools and do not save scroll data', () => {
  siteConfig.mockReturnValue(false)
  const { container } = render(<ArticleReader post={post} />)
  fireEvent.scroll(window)
  expect(container).toBeEmptyDOMElement()
  expect(localStorage.getItem(READER_STORAGE_KEY)).toBeNull()
})

test('storage errors do not claim the article was saved', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage unavailable')
  })
  render(<ArticleReader post={post} />)
  fireEvent.click(screen.getByRole('button', { name: 'Bookmark article' }))
  expect(screen.getByRole('alert')).toHaveTextContent(
    english.READER.STORAGE_ERROR
  )
  expect(
    screen.getByRole('button', { name: 'Bookmark article' })
  ).toHaveAttribute('aria-pressed', 'false')
})
