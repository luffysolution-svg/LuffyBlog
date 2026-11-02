import { getStaticProps } from '@/pages/bookmarks'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'

jest.mock('@/lib/db/SiteDataApi', () => ({ fetchGlobalAllData: jest.fn() }))
jest.mock('@/lib/global', () => ({
  getGlobalSnapshot: () => ({ NOTION_CONFIG: { BOOKMARK_ENABLE: true } })
}))
jest.mock('@/themes/theme', () => ({ DynamicLayout: () => null }))

test.each([false, 'false'])(
  'disabling bookmarks with %s closes the route despite an earlier enabled render',
  async value => {
    fetchGlobalAllData.mockResolvedValue({
      NOTION_CONFIG: { BOOKMARK_ENABLE: value },
      allPages: []
    })
    expect(await getStaticProps({ locale: 'en' })).toEqual({
      notFound: true,
      revalidate: 60
    })
  }
)

test('the bookmark index only exposes published articles in the current language', async () => {
  fetchGlobalAllData.mockResolvedValue({
    NOTION_CONFIG: { BOOKMARK_ENABLE: true },
    allPages: [
      {
        id: 'one',
        title: 'English title',
        href: '/article/one',
        type: 'Post',
        status: 'Published'
      },
      { id: 'two', title: 'Draft', type: 'Post', status: 'Draft' },
      { id: 'three', title: 'A page', type: 'Page', status: 'Published' }
    ]
  })
  const { props } = await getStaticProps({ locale: 'en' })
  expect(props.posts).toEqual([
    { id: 'one', title: 'English title', href: '/article/one', summary: '' }
  ])
  expect(props).not.toHaveProperty('allPages')
})
