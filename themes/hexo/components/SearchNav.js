import SearchHighlight from '@/components/SearchHighlight'
import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { searchParam } from '@/lib/search'
import { useRouter } from 'next/router'
import PaginationNumber from './PaginationNumber'
import SearchInput from './SearchInput'

export default function SearchNav({
  keyword = '',
  posts = [],
  categoryOptions = [],
  tagOptions = [],
  postCount = 0,
  page = 1
}) {
  const router = useRouter()
  const { locale, lang, NOTION_CONFIG } = useGlobal()
  const labels = locale.SEARCH
  const filtersEnabled = siteConfig('SEARCH_FILTER_ENABLE', true)
  const highlightEnabled = siteConfig('SEARCH_HIGHLIGHT_ENABLE', true)
  const shortcutsEnabled = siteConfig('SEARCH_SHORTCUT_ENABLE', true)
  const category = filtersEnabled ? searchParam(router.query.category) : ''
  const tag = filtersEnabled ? searchParam(router.query.tag) : ''
  const english = /^en(?:-|$)/i.test(lang)
  const hint = siteConfig(
    english ? 'SEARCH_HINT_EN' : 'SEARCH_HINT',
    labels.HINT
  )
  const recommendations = siteConfig('SEARCH_RECOMMEND_WORDS', [])
  const words = Array.isArray(recommendations)
    ? recommendations.filter(word => typeof word === 'string' && word.trim())
    : []
  const hasQuery = Boolean(keyword || category || tag)
  const perPage = siteConfig('POSTS_PER_PAGE', 12, NOTION_CONFIG)
  const legacyPagination =
    router.pathname !== '/search' && posts.length < postCount
  const highlight = text => (
    <SearchHighlight text={text} keyword={keyword} enabled={highlightEnabled} />
  )

  const changeFilter = (key, value) => {
    const query = Object.fromEntries(
      new URLSearchParams(window.location.search)
    )
    delete query.keyword
    delete query.page
    if (router.pathname !== '/search' && keyword) query.s = keyword
    if (value) query[key] = value
    else delete query[key]
    router.push({ pathname: '/search', query }, undefined, {
      shallow: router.pathname === '/search'
    })
  }

  return (
    <section className='mx-2 mb-8 rounded-xl bg-white p-5 text-gray-800 dark:bg-hexo-black-gray dark:text-gray-100 md:p-8'>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <h1 className='text-3xl font-bold'>{locale.NAV.SEARCH}</h1>
        {shortcutsEnabled && (
          <span className='text-sm text-gray-600 dark:text-gray-300'>
            {labels.SHORTCUT_HINT}{' '}
            <kbd className='rounded border border-gray-300 px-1.5 py-0.5 dark:border-gray-600'>
              Ctrl / ⌘ K
            </kbd>
          </span>
        )}
      </div>
      <SearchInput currentSearch={keyword} autoFocus />
      {hint && (
        <p className='mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300'>
          {hint}
        </p>
      )}
      {words.length > 0 && (
        <div className='mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
          <span className='text-gray-600 dark:text-gray-300'>
            {labels.RECOMMENDED}
          </span>
          {words.map(word => (
            <Link
              key={word}
              shallow={router.pathname === '/search'}
              href={{
                pathname: '/search',
                query: {
                  s: word,
                  ...(category ? { category } : {}),
                  ...(tag ? { tag } : {})
                }
              }}
              className='inline-flex min-h-11 items-center font-medium underline underline-offset-4 hover:text-indigo-700 dark:hover:text-indigo-300'
            >
              {word}
            </Link>
          ))}
        </div>
      )}
      {filtersEnabled && (
        <div className='mt-5 grid gap-4 sm:grid-cols-2'>
          {[
            {
              key: 'category',
              label: locale.COMMON.CATEGORY,
              value: category,
              options: categoryOptions,
              all: labels.ALL_CATEGORIES
            },
            {
              key: 'tag',
              label: locale.COMMON.TAGS,
              value: tag,
              options: tagOptions,
              all: labels.ALL_TAGS
            }
          ].map(filter => (
            <label
              key={filter.key}
              className='flex flex-col gap-2 text-sm font-medium'
            >
              {filter.label}
              <select
                name={filter.key}
                value={filter.value}
                onChange={event => changeFilter(filter.key, event.target.value)}
                className='min-h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-base font-normal text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
              >
                <option value=''>{filter.all}</option>
                {filter.options.map(option => (
                  <option key={option.name} value={option.name}>
                    {option.label || option.name} ({option.count})
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      {hasQuery && (
        <div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 text-sm dark:border-gray-700'>
          <p role='status' aria-live='polite'>
            {postCount} {locale.COMMON.RESULT_OF_SEARCH}
          </p>
          <Link
            href='/search'
            shallow={router.pathname === '/search'}
            className='inline-flex min-h-11 items-center underline underline-offset-4 hover:text-indigo-700 dark:hover:text-indigo-300'
          >
            {labels.RESET}
          </Link>
        </div>
      )}
      <div id='posts-wrapper'>
        {hasQuery && posts.length === 0 && (
          <p className='py-10 leading-relaxed'>{labels.EMPTY}</p>
        )}
        <div className='divide-y divide-gray-200 dark:divide-gray-700'>
          {posts.map(post => (
            <article key={post.id} className='py-6'>
              <h2 className='text-xl font-semibold leading-relaxed'>
                <Link href={post.href} className='hover:underline'>
                  {highlight(post.title)}
                </Link>
              </h2>
              <p className='mt-2 line-clamp-3 leading-relaxed text-gray-600 dark:text-gray-300'>
                {highlight(
                  post.results?.length ? post.results.join(' ') : post.summary
                )}
              </p>
              <div className='mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300'>
                {post.category && (
                  <span>
                    {highlight(
                      post.categoryLabel ||
                        (Array.isArray(post.category)
                          ? post.category.join(', ')
                          : post.category)
                    )}
                  </span>
                )}
                {(post.tagItems || []).map(item => (
                  <span key={item.name}>
                    #{highlight(item.label || item.name)}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
      {legacyPagination && (
        <PaginationNumber
          page={page}
          totalPage={Math.ceil(postCount / perPage)}
        />
      )}
    </section>
  )
}
