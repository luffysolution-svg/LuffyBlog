import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getSeriesCollections } from '@/lib/site/contentCollections'
import { DynamicLayout } from '@/themes/theme'

export default function SeriesIndex(props) {
  return (
    <DynamicLayout
      theme={siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)}
      layoutName='LayoutCollections'
      {...props}
    />
  )
}

export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from: 'series-index', locale })
  if (!siteConfig('SERIES_ENABLE', true, props.NOTION_CONFIG))
    return { notFound: true, revalidate: 60 }
  const english = /^en(?:-|$)/i.test(locale || '')
  props.collections = getSeriesCollections(props.allPages)
  props.collectionKind = 'series'
  props.collectionTitle = siteConfig(
    english ? 'SERIES_TITLE_EN' : 'SERIES_TITLE',
    english ? 'Article series' : '专题系列',
    props.NOTION_CONFIG
  )
  props.collectionDescription = siteConfig(
    english ? 'SERIES_DESCRIPTION_EN' : 'SERIES_DESCRIPTION',
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
