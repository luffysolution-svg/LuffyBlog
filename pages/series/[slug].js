import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getSeriesCollections } from '@/lib/site/contentCollections'
import { DynamicLayout } from '@/themes/theme'

export default function SeriesDetail(props) {
  return (
    <DynamicLayout
      theme={siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)}
      layoutName='LayoutCollections'
      {...props}
    />
  )
}

export async function getStaticProps({ params, locale }) {
  const props = await fetchGlobalAllData({ from: 'series-detail', locale })
  if (!siteConfig('SERIES_ENABLE', true, props.NOTION_CONFIG))
    return { notFound: true, revalidate: 60 }
  props.series = getSeriesCollections(props.allPages).find(
    series => series.slug === params.slug
  )
  if (!props.series) return { notFound: true, revalidate: 60 }
  props.collectionTitle = props.series.title
  props.collectionDescription = props.series.summary
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

export async function getStaticPaths() {
  const props = await fetchGlobalAllData({ from: 'series-paths' })
  return {
    paths: getSeriesCollections(props.allPages).map(series => ({
      params: { slug: series.slug }
    })),
    fallback: 'blocking'
  }
}
