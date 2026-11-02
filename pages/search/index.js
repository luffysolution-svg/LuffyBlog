import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { filterSearchPosts, searchParam } from '@/lib/search'
import { DynamicLayout } from '@/themes/theme'
import { useRouter } from 'next/router'

/**
 * 搜索路由
 * @param {*} props
 * @returns
 */
const Search = props => {
  const { posts = [] } = props

  const router = useRouter()
  const keyword = searchParam(router.query.s)
  const filtersEnabled = siteConfig('SEARCH_FILTER_ENABLE', true, props.NOTION_CONFIG)
  const category = filtersEnabled ? searchParam(router.query.category) : ''
  const tag = filtersEnabled ? searchParam(router.query.tag) : ''
  const filteredPosts = keyword || category || tag
    ? filterSearchPosts(posts, { keyword, category, tag })
    : []

  props = { ...props, posts: filteredPosts, keyword, postCount: filteredPosts.length }

  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSearch' {...props} />
}

/**
 * 浏览器前端搜索
 */
export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({
    from: 'search-props',
    locale
  })
  const { allPages } = props
  props.posts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  return {
    props,
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

export default Search
