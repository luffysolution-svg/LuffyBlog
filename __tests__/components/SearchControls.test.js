import SearchInput from '@/themes/hexo/components/SearchInput'
import SearchNav from '@/themes/hexo/components/SearchNav'
import SearchButton from '@/themes/hexo/components/SearchButton'
import { siteConfig } from '@/lib/config'
import english from '@/lib/lang/en-US'
import { useRouter } from 'next/router'
import { act, fireEvent, render, screen } from '@testing-library/react'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, fallback) => fallback)
}))
jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ locale: english, lang: 'en-US', NOTION_CONFIG: {} })
}))
jest.mock('@/themes/hexo', () => ({
  useHexoGlobal: () => ({ searchModal: { current: null } })
}))

let router
beforeEach(() => {
  window.history.replaceState({}, '', '/search')
  router = {
    pathname: '/search',
    query: {},
    push: jest.fn().mockResolvedValue(true)
  }
  useRouter.mockReturnValue(router)
  siteConfig.mockImplementation((key, fallback) => fallback)
})

test('submits an encoded query while keeping the selected filters', async () => {
  router.query = { category: '科研工具', tag: '教程' }
  window.history.replaceState({}, '', '/search?category=科研工具&tag=教程')
  render(<SearchInput autoFocus />)
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: ' C++ & AI ' }
  })
  await act(async () => fireEvent.submit(screen.getByRole('search')))
  expect(router.push).toHaveBeenCalledWith(
    {
      pathname: '/search',
      query: { s: 'C++ & AI', category: '科研工具', tag: '教程' }
    },
    undefined,
    { shallow: true }
  )
  fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' })
  expect(screen.getByRole('searchbox')).toHaveValue('')
})

test('Chinese composition Enter does not submit a partial keyword', () => {
  render(<SearchInput autoFocus />)
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    isComposing: true,
    bubbles: true,
    cancelable: true
  })
  fireEvent(screen.getByRole('searchbox'), event)
  expect(event.defaultPrevented).toBe(true)
  expect(router.push).not.toHaveBeenCalled()
})

test('filters keep the keyword and reset links discard search parameters', () => {
  router.query = { s: 'AI', tag: '教程' }
  window.history.replaceState({}, '', '/search?s=AI&tag=教程')
  render(
    <SearchNav
      keyword='AI'
      categoryOptions={[{ name: '科研工具', count: 2 }]}
      tagOptions={[{ name: '教程', count: 2 }]}
    />
  )
  fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), {
    target: { value: '科研工具' }
  })
  expect(router.push).toHaveBeenCalledWith(
    {
      pathname: '/search',
      query: { s: 'AI', category: '科研工具', tag: '教程' }
    },
    undefined,
    { shallow: true }
  )
  expect(
    screen.getByRole('link', { name: english.SEARCH.RESET })
  ).toHaveAttribute('href', '/search')
})

test('disabled search features hide filters, highlights and shortcut hints', () => {
  siteConfig.mockImplementation((key, fallback) =>
    key.endsWith('_ENABLE') ? false : fallback
  )
  render(
    <SearchNav
      keyword='AI'
      postCount={1}
      posts={[{ id: 'one', title: 'AI tools', href: '/article/one' }]}
    />
  )
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  expect(document.querySelector('mark')).toBeNull()
  expect(
    screen.queryByText(english.SEARCH.SHORTCUT_HINT)
  ).not.toBeInTheDocument()
})

test('keeps a just-submitted keyword when a filter changes before route props update', () => {
  window.history.replaceState({}, '', '/search?s=Obsidian')
  render(<SearchNav categoryOptions={[{ name: '科研工具', count: 2 }]} />)
  fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), {
    target: { value: '科研工具' }
  })
  expect(router.push).toHaveBeenCalledWith(
    { pathname: '/search', query: { s: 'Obsidian', category: '科研工具' } },
    undefined,
    { shallow: true }
  )
})

test('search shortcuts work from the page and leave text editing alone', () => {
  render(
    <>
      <SearchButton />
      <input aria-label='Comment' />
      <div contentEditable suppressContentEditableWarning>
        <span data-testid='editor'>Editable content</span>
      </div>
    </>
  )
  fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true })
  expect(router.push).toHaveBeenCalledWith('/search')
  router.push.mockClear()
  fireEvent.keyDown(screen.getByRole('textbox'), { key: '/' })
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'k', metaKey: true })
  fireEvent.keyDown(screen.getByTestId('editor'), { key: '/' })
  expect(router.push).not.toHaveBeenCalled()
  fireEvent.keyDown(document.body, { key: '/' })
  expect(router.push).toHaveBeenCalledWith('/search')
})
