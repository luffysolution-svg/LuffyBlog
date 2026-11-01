import SmartLink from '@/components/SmartLink'
import { useGlobal } from '@/lib/global'

export default function ArticleSeries({ series, post }) {
  const { locale } = useGlobal()
  if (!series?.articles?.length) return null
  const index = series.articles.findIndex(article => article.id === post?.id)
  if (index < 0) return null

  const previous = series.articles[index - 1]
  const next = series.articles[index + 1]
  return (
    <nav
      aria-label={locale.COLLECTIONS.SERIES}
      className='mx-5 mb-8 border-y border-gray-200 py-6 text-gray-700 dark:border-gray-700 dark:text-gray-200'
    >
      <SmartLink href={series.href} className='font-semibold hover:underline'>
        {series.title}
      </SmartLink>
      <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>
        {index + 1} / {series.articles.length}
      </p>
      <details className='mt-3'>
        <summary className='w-fit cursor-pointer text-sm'>
          {locale.COLLECTIONS.CONTENTS}
        </summary>
        <ol className='mt-3 list-inside list-decimal space-y-2 text-sm'>
          {series.articles.map(article => (
            <li key={article.id}>
              <SmartLink
                href={article.href}
                aria-current={article.id === post.id ? 'page' : undefined}
                className={
                  article.id === post.id ? 'font-semibold' : 'hover:underline'
                }
              >
                {article.title}
              </SmartLink>
            </li>
          ))}
        </ol>
      </details>
      <div className='mt-5 grid gap-4 text-sm sm:grid-cols-2'>
        {previous && (
          <SmartLink href={previous.href} className='hover:underline'>
            {locale.COMMON.PREV_POST} · {previous.title}
          </SmartLink>
        )}
        {next && (
          <SmartLink
            href={next.href}
            className='sm:col-start-2 sm:text-right hover:underline'
          >
            {locale.COMMON.NEXT_POST} · {next.title}
          </SmartLink>
        )}
      </div>
    </nav>
  )
}
