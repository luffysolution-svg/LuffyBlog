import { useRouter } from 'next/router'

const LANGUAGE_LABELS = {
  en: 'EN',
  'en-US': 'EN',
  zh: '中',
  'zh-CN': '中文',
  'zh-HK': '繁',
  'zh-TW': '繁'
}

/**
 * 保留当前文章、专题和查询条件的语言入口。
 */
export default function LanguageSwitcher() {
  const router = useRouter()
  const locales = router.locales || []

  if (locales.length < 2) {
    return null
  }

  return (
    <div
      className='mx-1 inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-current border-opacity-20 p-0.5 text-xs'
      role='group'
      aria-label='语言 / Language'
    >
      {locales.map(locale => {
        const active = locale === router.locale
        return (
          <button
            key={locale}
            type='button'
            aria-pressed={active}
            aria-label={`切换到 ${locale}`}
            lang={locale}
            disabled={active}
            onClick={() => {
              void router.push(router.asPath || '/', router.asPath || '/', {
                locale
              })
            }}
            className={`inline-flex h-8 w-auto min-w-[2.5rem] shrink-0 items-center justify-center rounded-full px-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              active
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10'
            } disabled:cursor-default`}
          >
            {LANGUAGE_LABELS[locale] || locale.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
