import { filterSearchPosts, searchParam } from '@/lib/search'

const posts = [
  {
    id: 'one',
    title: 'Obsidian and C++',
    category: '知识管理',
    tags: ['教程', '工具']
  },
  {
    id: 'two',
    title: 'OBSIDIAN setup',
    summary: 'A note workflow',
    category: ['科研工具'],
    tags: ['教程']
  },
  {
    id: 'three',
    title: 'Zotero',
    category: '科研工具',
    tags: ['工具'],
    categoryLabel: 'Research tools'
  }
]

test('combines a keyword, category and exact tag across scalar and array categories', () => {
  expect(
    filterSearchPosts(posts, {
      keyword: ' obsidian ',
      category: '科研工具',
      tag: '教程'
    }).map(post => post.id)
  ).toEqual(['two'])
  expect(
    filterSearchPosts(posts, { category: '科研工具' }).map(post => post.id)
  ).toEqual(['two', 'three'])
  expect(filterSearchPosts(posts, { tag: '教' })).toEqual([])
})

test('treats special characters literally and searches localized metadata', () => {
  expect(
    filterSearchPosts(posts, { keyword: 'C++' }).map(post => post.id)
  ).toEqual(['one'])
  expect(
    filterSearchPosts(posts, { keyword: 'Research tools' }).map(post => post.id)
  ).toEqual(['three'])
  expect(
    filterSearchPosts([{ id: 'empty' }], { keyword: 'undefined' })
  ).toEqual([])
})

test('normalizes empty or repeated URL parameters', () => {
  expect(searchParam([' Obsidian ', 'Zotero'])).toBe('Obsidian')
  expect(searchParam(undefined)).toBe('')
  expect(searchParam('   ')).toBe('')
})
