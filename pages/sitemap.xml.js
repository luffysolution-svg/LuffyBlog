// pages/sitemap.xml.js
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import {
  buildSitemapLoc,
  normalizeSitemapBaseUrl,
  normalizeSitemapLocale,
  toSitemapDateString
} from '@/lib/sitemap-utils'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import { getServerSideSitemap } from 'next-sitemap'

export const getServerSideProps = async ctx => {
  let fields = []
  const siteIds = BLOG.NOTION_PAGE_ID.split(',')
  for (const locale of (process.env.NEXT_PUBLIC_SITE_LOCALES || '').split(',').map(value => value.trim()).filter(Boolean)) {
    if (locale !== BLOG.LANG && !siteIds.some(siteId => extractLangPrefix(siteId) === locale)) siteIds.push(`${locale}:${extractLangId(siteIds[0])}`)
  }

  for (let index = 0; index < siteIds.length; index++) {
    const siteId = siteIds[index]
    const id = extractLangId(siteId)
    const locale = extractLangPrefix(siteId)
    // 第一个id站点默认语言
    const siteData = await fetchGlobalAllData({
      pageId: id,
      from: 'sitemap.xml',
      locale
    })
    const link = siteConfig(
      'LINK',
      siteData?.siteInfo?.link,
      siteData.NOTION_CONFIG
    )
    const localeFields = generateLocalesSitemap(link, siteData.allPages, locale, siteData.NOTION_CONFIG)
    fields = fields.concat(localeFields)
  }

  fields = getUniqueFields(fields)

  // 缓存
  ctx.res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=59'
  )
  return getServerSideSitemap(ctx, fields)
}

function generateLocalesSitemap(link, allPages, locale, NOTION_CONFIG = {}) {
  const normalizedLink = normalizeSitemapBaseUrl(link)
  const normalizedLocale = normalizeSitemapLocale(locale)
  const dateNow = toSitemapDateString(new Date())

  const defaultFields = [
    {
      loc: buildSitemapLoc({ baseUrl: normalizedLink, locale: normalizedLocale }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'archive'
      }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'category'
      }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'rss/feed.xml'
      }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'search'
      }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'tag'
      }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    }
  ].filter(field => Boolean(field?.loc))
  for (const [slug, enabled] of [['series', NOTION_CONFIG.SERIES_ENABLE], ['projects', NOTION_CONFIG.PROJECTS_ENABLE]]) {
    if (enabled !== false) defaultFields.push({ loc: buildSitemapLoc({ baseUrl: normalizedLink, locale: normalizedLocale, slug }), lastmod: dateNow, changefreq: 'weekly', priority: '0.7' })
  }

  const postFields =
    allPages
      ?.filter(p => p.status === BLOG.NOTION_PROPERTY_NAME.status_publish)
      ?.filter(p => !['Project', 'Translation'].includes(p.type) && !(p.type === 'Series' && NOTION_CONFIG.SERIES_ENABLE === false))
      // 过滤掉外部链接(http开头)和锚点链接(#开头)
      ?.filter(p => p.slug && !p.slug.startsWith('http') && !p.slug.startsWith('#'))
      ?.map(post => {
        const loc = buildSitemapLoc({
          baseUrl: normalizedLink,
          locale: normalizedLocale,
          slug: post.type === 'Series' ? post.href : post?.slug
        })
        if (!loc) return null

        return {
          loc,
          lastmod: toSitemapDateString(post?.publishDay, dateNow),
          changefreq: 'daily',
          priority: '0.7'
        }
      })
      ?.filter(Boolean) ?? []

  return defaultFields.concat(postFields)
}

function getUniqueFields(fields) {
  const uniqueFieldsMap = new Map()

  fields.forEach(field => {
    const existingField = uniqueFieldsMap.get(field.loc)

    if (!existingField || new Date(field.lastmod) > new Date(existingField.lastmod)) {
      uniqueFieldsMap.set(field.loc, field)
    }
  })

  return Array.from(uniqueFieldsMap.values())
}

export default () => { }
