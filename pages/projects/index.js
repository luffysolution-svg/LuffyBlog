import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getProjects } from '@/lib/site/contentCollections'
import { DynamicLayout } from '@/themes/theme'

export default function ProjectsIndex(props) {
  return (
    <DynamicLayout
      theme={siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)}
      layoutName='LayoutCollections'
      {...props}
    />
  )
}

export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from: 'projects-index', locale })
  if (!siteConfig('PROJECTS_ENABLE', true, props.NOTION_CONFIG))
    return { notFound: true, revalidate: 60 }
  const english = /^en(?:-|$)/i.test(locale || '')
  props.collections = getProjects(props.allPages)
  props.collectionKind = 'projects'
  props.collectionTitle = siteConfig(
    english ? 'PROJECTS_TITLE_EN' : 'PROJECTS_TITLE',
    english ? 'Projects' : '项目展示',
    props.NOTION_CONFIG
  )
  props.collectionDescription = siteConfig(
    english ? 'PROJECTS_DESCRIPTION_EN' : 'PROJECTS_DESCRIPTION',
    '',
    props.NOTION_CONFIG
  )
  delete props.allPages
  return {
    props,
    revalidate: siteConfig(
      'NEXT_REVALIDATE_SECOND',
      BLOG.NEXT_REVALIDATE_SECOND,
      props.NOTION_CONFIG
    )
  }
}
