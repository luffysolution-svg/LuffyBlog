import Link from 'next/link'
import useReaderState from '@/hooks/useReaderState'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import {
  getReadingPosition,
  readReaderState,
  toggleBookmark,
  updateReaderState
} from '@/lib/reader'
import { useEffect, useRef, useState } from 'react'

export default function ArticleReader({ post }) {
  const { locale, lang } = useGlobal()
  const labels = locale.READER
  const progressEnabled = siteConfig('READING_PROGRESS_ENABLE', true)
  const bookmarksEnabled = siteConfig('BOOKMARK_ENABLE', true)
  const { bookmarks, ready } = useReaderState()
  const [resume, setResume] = useState(null)
  const [storageError, setStorageError] = useState(false)
  const pendingPosition = useRef(null)
  const progressKey = `${lang}:${post.id}`
  const bookmarked = bookmarks.includes(post.id)

  useEffect(() => {
    setResume(null)
    setStorageError(false)
    if (!progressEnabled) return
    const saved = readReaderState().progress[progressKey]
    if (saved?.offset > 120 && saved.percent > 0 && saved.percent < 0.98) {
      setResume(saved)
    }

    let timer
    pendingPosition.current = null
    const save = () => {
      clearTimeout(timer)
      if (!pendingPosition.current) return
      updateReaderState(state => ({
        ...state,
        progress: { ...state.progress, [progressKey]: pendingPosition.current }
      }))
      pendingPosition.current = null
    }
    const onScroll = () => {
      const article = document.querySelector('#article-wrapper #notion-article')
      if (!article) return
      const position = getReadingPosition(
        article,
        window.scrollY,
        window.innerHeight
      )
      // Ignore initial scrolling around the article header when returning to a page.
      if (position.offset <= 120) return
      pendingPosition.current = { ...position, updatedAt: Date.now() }
      clearTimeout(timer)
      timer = setTimeout(save, 800)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onVisibility)
      save()
    }
  }, [progressEnabled, progressKey])

  const continueReading = () => {
    const offset = resume.offset
    setResume(null)
    requestAnimationFrame(() => {
      const article = document.querySelector('#article-wrapper #notion-article')
      if (!article) return
      const top = article.getBoundingClientRect().top + window.scrollY
      const maximum = Math.max(
        0,
        article.offsetHeight - window.innerHeight + 96
      )
      window.scrollTo({
        top: top + Math.min(offset, maximum) - 96,
        behavior: 'instant'
      })
    })
  }

  const startOver = () => {
    pendingPosition.current = null
    updateReaderState(state => {
      const progress = { ...state.progress }
      delete progress[progressKey]
      return { ...state, progress }
    })
    setResume(null)
  }

  if (!bookmarksEnabled && (!progressEnabled || !resume)) return null

  return (
    <div className='mb-6 border-b border-gray-200 pb-5 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200'>
      {bookmarksEnabled && (
        <div className='flex flex-wrap items-center gap-3'>
          <button
            type='button'
            disabled={!ready}
            aria-pressed={bookmarked}
            onClick={() => setStorageError(!toggleBookmark(post.id))}
            className='inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800'
          >
            <i
              aria-hidden='true'
              className={`${bookmarked ? 'fas' : 'far'} fa-bookmark`}
            />
            {bookmarked ? labels.SAVED : labels.SAVE}
          </button>
          <Link
            href='/bookmarks'
            className='inline-flex min-h-11 items-center underline underline-offset-4 hover:text-indigo-700 dark:hover:text-indigo-300'
          >
            {labels.BOOKMARKS}
          </Link>
          <span role='status' className='sr-only'>
            {bookmarked ? labels.SAVED : ''}
          </span>
        </div>
      )}
      {progressEnabled && resume && (
        <div
          className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-1'
          role='status'
        >
          <span>
            {labels.LAST_POSITION} {Math.round(resume.percent * 100)}%
          </span>
          <button
            type='button'
            onClick={continueReading}
            className='min-h-11 font-medium underline underline-offset-4 hover:text-indigo-700 dark:hover:text-indigo-300'
          >
            {labels.CONTINUE}
          </button>
          <button
            type='button'
            onClick={startOver}
            className='min-h-11 underline underline-offset-4 hover:text-indigo-700 dark:hover:text-indigo-300'
          >
            {labels.START_OVER}
          </button>
        </div>
      )}
      {storageError && (
        <p role='alert' className='mt-3'>
          {labels.STORAGE_ERROR}
        </p>
      )}
    </div>
  )
}
