import { siteConfig } from '@/lib/config'
import { useEffect, useState } from 'react'

const ContactQrCards = ({
  personalImage = siteConfig('CONTACT_WECHAT_QR_IMAGE'),
  publicImage = siteConfig('CONTACT_WECHAT_PUBLIC_QR_IMAGE'),
  publicName = siteConfig('CONTACT_WECHAT_PUBLIC_NAME')
}) => {
  const [activeContact, setActiveContact] = useState(null)
  const [failedImages, setFailedImages] = useState({})
  const contacts = [
    personalImage && {
      id: 'personal-wechat',
      title: '个人微信',
      image: personalImage,
      alt: '三木的个人微信二维码'
    },
    publicImage && {
      id: 'public-wechat',
      title: `微信公众号${publicName ? `：${publicName}` : ''}`,
      image: publicImage,
      alt: `微信公众号${publicName ? `“${publicName}”` : ''}二维码`
    }
  ].filter(Boolean)

  useEffect(() => {
    if (!activeContact) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = event => {
      if (event.key === 'Escape') setActiveContact(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeContact])

  if (contacts.length === 0) return null

  const markImageFailed = image => {
    setFailedImages(current => ({ ...current, [image]: true }))
  }

  return (
    <>
      <div className='mt-5 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-1'>
        {contacts.map(contact => (
          <button
            key={contact.id}
            type='button'
            onClick={() => setActiveContact(contact)}
            className='group w-full rounded-lg border border-gray-200 bg-white p-2 text-left transition hover:border-indigo-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-hexo-black-gray'
            aria-label={`放大查看${contact.title}`}
          >
            <div className='mx-auto flex h-28 w-full max-w-48 items-center justify-center overflow-hidden rounded-md bg-gray-50 dark:bg-gray-800'>
              {failedImages[contact.image] ? (
                <span className='px-3 text-center text-xs text-gray-500'>
                  二维码暂时无法加载
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={contact.image}
                  alt={contact.alt}
                  loading='lazy'
                  className='h-full w-full object-contain'
                  onError={() => markImageFailed(contact.image)}
                />
              )}
            </div>
            <span className='mt-2 block text-center text-xs text-gray-600 group-hover:text-indigo-600 dark:text-gray-300'>
              {contact.title}
            </span>
          </button>
        ))}
      </div>

      {activeContact && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label={activeContact.title}
          className='fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4'
          onClick={event => {
            if (event.target === event.currentTarget) setActiveContact(null)
          }}
        >
          <div className='relative w-full max-w-md rounded-xl bg-white p-4 shadow-2xl dark:bg-hexo-black-gray'>
            <button
              type='button'
              onClick={() => setActiveContact(null)}
              className='absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xl text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-indigo-400'
              aria-label='关闭二维码预览'
            >
              ×
            </button>
            {failedImages[activeContact.image] ? (
              <div className='flex h-72 items-center justify-center text-sm text-gray-500'>
                二维码暂时无法加载，请稍后重试
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeContact.image}
                alt={activeContact.alt}
                className='mx-auto max-h-[80vh] max-w-full object-contain'
                onError={() => markImageFailed(activeContact.image)}
              />
            )}
            <p className='mt-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200'>
              {activeContact.title}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default ContactQrCards
