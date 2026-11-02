import Link from 'next/link'
import useReaderState from '@/hooks/useReaderState'
import { useGlobal } from '@/lib/global'
import { toggleBookmark } from '@/lib/reader'
import { useState } from 'react'

export default function BookmarkList({ posts = [] }) {
  const { locale } = useGlobal()
  const labels = locale.READER
  const { bookmarks, ready } = useReaderState()
  const [storageError, setStorageError] = useState(false)
  const postsById = new Map(posts.map(post => [post.id, post]))
  const savedPosts = bookmarks.map(id => postsById.get(id)).filter(Boolean)

  return (
    <section className='my-8 rounded-xl bg-white p-6 text-gray-800 dark:bg-hexo-black-gray dark:text-gray-100 md:p-10'>
      <h1 className='text-3xl font-bold'>{labels.BOOKMARKS}</h1>
      <p className='mt-3 leading-relaxed text-gray-600 dark:text-gray-300'>
        {labels.LOCAL_ONLY}
      </p>
      {!ready ? (
        <p role='status' className='py-10'>
          {locale.COMMON.LOADING}
        </p>
      ) : savedPosts.length === 0 ? (
        <div className='py-10'>
          <p className='mb-5 leading-relaxed'>{labels.EMPTY}</p>
          <Link
            href='/search'
            className='inline-flex min-h-11 items-center font-medium underline underline-offset-4'
          >
            {labels.FIND_ARTICLES}
          </Link>
        </div>
      ) : (
        <ul className='mt-6 divide-y divide-gray-200 dark:divide-gray-700'>
          {savedPosts.map(post => (
            <li key={post.id} className='flex items-start gap-4 py-6'>
              <div className='min-w-0 flex-1'>
                <h2 className='text-lg font-semibold leading-relaxed'>
                  <Link href={post.href} className='hover:underline'>
                    {post.title}
                  </Link>
                </h2>
                {post.summary && (
                  <p className='mt-2 line-clamp-2 leading-relaxed text-gray-600 dark:text-gray-300'>
                    {post.summary}
                  </p>
                )}
              </div>
              <button
                type='button'
                aria-label={`${labels.REMOVE}: ${post.title}`}
                onClick={() => setStorageError(!toggleBookmark(post.id))}
                className='min-h-11 shrink-0 rounded-lg px-3 text-sm underline underline-offset-4 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 dark:hover:bg-gray-800'
              >
                {labels.REMOVE}
              </button>
            </li>
          ))}
        </ul>
      )}
      {storageError && <p role='alert'>{labels.STORAGE_ERROR}</p>}
    </section>
  )
}
