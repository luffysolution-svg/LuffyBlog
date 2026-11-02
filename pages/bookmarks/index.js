import BLOG from '@/blog.config'
import { convertVal, siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { DynamicLayout } from '@/themes/theme'

export default function Bookmarks(props) {
  return (
    <DynamicLayout
      theme={siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)}
      layoutName='LayoutBookmarks'
      {...props}
    />
  )
}

export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from: 'bookmarks', locale })
  if (!convertVal(props.NOTION_CONFIG?.BOOKMARK_ENABLE ?? BLOG.BOOKMARK_ENABLE)) {
    return { notFound: true, revalidate: 60 }
  }
  props.posts = (props.allPages || [])
    .filter(post => post.type === 'Post' && post.status === 'Published')
    .map(({ id, title = '', summary = '', href }) => ({
      id,
      title,
      summary,
      href
    }))
  delete props.allPages
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
