import LazyImage from '@/components/LazyImage'
import SmartLink from '@/components/SmartLink'
import { useGlobal } from '@/lib/global'

export default function ContentCollections({
  title,
  description,
  collections = [],
  kind,
  series
}) {
  const { locale } = useGlobal()
  const labels = locale.COLLECTIONS

  return (
    <section className='mt-8 mb-10 rounded-xl bg-white px-5 py-8 text-gray-800 dark:bg-hexo-black-gray dark:text-gray-100 md:px-10'>
      {series && (
        <SmartLink
          href='/series'
          className='mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:underline dark:text-gray-300'
        >
          <i aria-hidden='true' className='fas fa-arrow-left' />
          {labels.SERIES}
        </SmartLink>
      )}
      <h1 className='text-3xl font-bold leading-tight'>{title}</h1>
      {description && (
        <p className='mt-4 max-w-2xl leading-relaxed text-gray-600 dark:text-gray-300'>
          {description}
        </p>
      )}

      {series ? (
        <ol className='mt-8 divide-y divide-gray-200 dark:divide-gray-700'>
          {series.articles.map((article, index) => (
            <li key={article.id} className='flex gap-5 py-6'>
              <span className='pt-1 text-sm tabular-nums text-gray-500 dark:text-gray-400'>
                {index + 1}
              </span>
              <div className='min-w-0'>
                <h2 className='text-lg font-semibold'>
                  <SmartLink href={article.href} className='hover:underline'>
                    {article.title}
                  </SmartLink>
                </h2>
                {article.summary && (
                  <p className='mt-2 leading-relaxed text-gray-600 dark:text-gray-300'>
                    {article.summary}
                  </p>
                )}
              </div>
            </li>
          ))}
          {series.articles.length === 0 && (
            <li className='py-8 text-gray-600 dark:text-gray-300'>
              {labels.EMPTY_SERIES}
            </li>
          )}
        </ol>
      ) : (
        <div className='mt-8 divide-y divide-gray-200 dark:divide-gray-700'>
          {collections.map(item => (
            <article
              key={item.id}
              className='flex flex-col gap-5 py-7 sm:flex-row sm:items-start'
            >
              {item.pageCoverThumbnail && (
                <div className='h-36 w-full shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-40'>
                  <LazyImage
                    src={item.pageCoverThumbnail}
                    alt=''
                    className='h-full w-full object-cover'
                  />
                </div>
              )}
              <div className='min-w-0 flex-1'>
                <h2 className='text-xl font-semibold leading-snug'>
                  {kind === 'series' ? (
                    <SmartLink href={item.href} className='hover:underline'>
                      {item.title}
                    </SmartLink>
                  ) : (
                    item.title
                  )}
                </h2>
                {item.projectStatus && (
                  <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>
                    {item.projectStatus}
                  </p>
                )}
                {item.summary && (
                  <p className='mt-3 leading-relaxed text-gray-600 dark:text-gray-300'>
                    {item.summary}
                  </p>
                )}
                <div className='mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm'>
                  {kind === 'series' ? (
                    <SmartLink
                      href={item.href}
                      className='inline-flex items-center gap-2 font-medium hover:underline'
                    >
                      {item.articles.length} {labels.ARTICLES}
                      <i aria-hidden='true' className='fas fa-arrow-right' />
                    </SmartLink>
                  ) : (
                    <>
                      {item.projectUrl && (
                        <a
                          href={item.projectUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-2 hover:underline'
                        >
                          {labels.VISIT}
                          <i
                            aria-hidden='true'
                            className='fas fa-arrow-up-right-from-square'
                          />
                        </a>
                      )}
                      {item.repository && (
                        <a
                          href={item.repository}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-2 hover:underline'
                        >
                          <i aria-hidden='true' className='fab fa-github' />
                          {labels.SOURCE}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
          {collections.length === 0 && (
            <p className='py-8 text-gray-600 dark:text-gray-300'>
              {labels.EMPTY}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
