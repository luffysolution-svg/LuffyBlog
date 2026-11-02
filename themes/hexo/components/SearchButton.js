import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useHexoGlobal } from '..'

/**
 * 搜索按钮
 * @returns
 */
export default function SearchButton(props) {
  const { locale } = useGlobal()
  const router = useRouter()
  const { searchModal } = useHexoGlobal()
  const shortcutsEnabled = siteConfig('SEARCH_SHORTCUT_ENABLE', true)

  useEffect(() => {
    if (!shortcutsEnabled) return
    const onKeyDown = event => {
      if (event.isComposing || event.repeat || event.altKey || event.target.isContentEditable || event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return
      const shortcut = ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') || (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === '/')
      if (!shortcut) return
      event.preventDefault()
      const input = document.getElementById('site-search')
      if (input) input.focus()
      else if (siteConfig('ALGOLIA_APP_ID')) searchModal.current?.openSearch()
      else router.push('/search')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shortcutsEnabled, router, searchModal])

  function handleSearch() {
    if (siteConfig('ALGOLIA_APP_ID')) {
      searchModal.current.openSearch()
    } else {
      router.push('/search')
    }
  }

  return <>
        <button type='button' onClick={handleSearch} aria-label={locale.NAV.SEARCH} aria-keyshortcuts={shortcutsEnabled ? 'Control+k Meta+k /' : undefined} title={`${locale.NAV.SEARCH}${shortcutsEnabled ? ' (Ctrl / ⌘ K)' : ''}`} className='cursor-pointer dark:text-white hover:bg-black hover:bg-opacity-10 rounded-full w-10 h-10 flex justify-center items-center duration-200 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'>
            <i aria-hidden='true' className="fa-solid fa-magnifying-glass" />
        </button>
    </>
}
