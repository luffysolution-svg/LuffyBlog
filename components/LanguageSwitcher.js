import { useRouter } from 'next/router'

const LANGUAGE_LABELS = {
  en: 'EN',
  'en-US': 'EN',
  zh: '中',
  'zh-CN': '中',
  'zh-HK': '繁',
  'zh-TW': '繁'
}

/**
 * 多数据库站点的语言入口。
 * 各语言数据库可能没有相同 slug，因此切换后统一进入目标语言首页。
 */
export default function LanguageSwitcher() {
  const router = useRouter()
  const locales = router.locales || []

  if (locales.length < 2) {
    return null
  }

  return (
    <div
      className='mx-1 flex items-center rounded-full border border-current border-opacity-20 p-0.5 text-xs'
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
            disabled={active}
            onClick={() => {
              void router.push('/', '/', { locale })
            }}
            className={`h-7 min-w-[1.75rem] rounded-full px-1.5 transition-colors ${
              active
                ? 'bg-hexo-theme-color text-white'
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
