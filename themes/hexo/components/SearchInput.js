import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { searchParam } from '@/lib/search'
import { useRouter } from 'next/router'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'

const SearchInput = ({
  currentSearch = '',
  cRef,
  className = '',
  autoFocus = false
}) => {
  const router = useRouter()
  const { locale, lang } = useGlobal()
  const inputRef = useRef(null)
  const [value, setValue] = useState(currentSearch)
  const [loading, setLoading] = useState(false)
  const english = /^en(?:-|$)/i.test(lang)
  const placeholder = siteConfig(
    english ? 'SEARCH_PLACEHOLDER_EN' : 'SEARCH_PLACEHOLDER',
    locale.SEARCH.ARTICLES
  )

  useImperativeHandle(cRef, () => ({ focus: () => inputRef.current?.focus() }))
  useEffect(() => setValue(currentSearch), [currentSearch])
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const submit = async event => {
    event.preventDefault()
    const query = {}
    const keyword = value.trim()
    if (keyword) query.s = keyword
    if (siteConfig('SEARCH_FILTER_ENABLE', true)) {
      const filters = new URLSearchParams(window.location.search)
      for (const key of ['category', 'tag']) {
        const filter = searchParam(filters.get(key))
        if (filter) query[key] = filter
      }
    }
    setLoading(true)
    try {
      await router.push({ pathname: '/search', query }, undefined, {
        shallow: router.pathname === '/search'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      role='search'
      onSubmit={event => {
        void submit(event)
      }}
      className={`flex min-w-0 gap-2 ${className}`}
    >
      <label
        className='sr-only'
        htmlFor={autoFocus ? 'site-search' : 'drawer-search'}
      >
        {locale.SEARCH.ARTICLES}
      </label>
      <input
        id={autoFocus ? 'site-search' : 'drawer-search'}
        ref={inputRef}
        type='search'
        name='s'
        value={value}
        placeholder={placeholder}
        onChange={event => setValue(event.target.value)}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) {
            if (event.key === 'Enter') event.preventDefault()
            return
          }
          if (event.key === 'Escape') {
            setValue('')
            event.stopPropagation()
          }
        }}
        className='min-h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 text-base text-gray-900 placeholder:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-300'
      />
      <button
        type='submit'
        disabled={loading}
        className='min-h-11 shrink-0 rounded-lg bg-indigo-700 px-5 text-sm font-medium text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50'
      >
        {loading ? locale.COMMON.LOADING : locale.NAV.SEARCH}
      </button>
    </form>
  )
}

export default SearchInput
