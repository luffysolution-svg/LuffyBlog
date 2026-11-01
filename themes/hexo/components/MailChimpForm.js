import { useState } from 'react'
import { useGlobal } from '@/lib/global'
import { subscribeToNewsletter } from '@/lib/plugins/mailchimp'
import { siteConfig } from '@/lib/config'

const MailChimpForm = () => {
  const { locale, lang } = useGlobal()
  const [status, setStatus] = useState('idle')
  const language = lang?.split('-')[0]
  const defaultLanguage = String(siteConfig('LANG', 'zh-CN')).split('-')[0]
  const suffix = language && language !== defaultLanguage ? `_${language.toUpperCase()}` : ''
  const text = (key, fallback) => siteConfig(`${key}${suffix}`, fallback)
  const emailLabel = text('MAILCHIMP_EMAIL_PLACEHOLDER', locale.MAILCHIMP.EMAIL)

  if (!siteConfig('MAILCHIMP_ENABLE', true)) return null

  const handleSubmit = async event => {
    event.preventDefault()
    setStatus('submitting')

    try {
      await subscribeToNewsletter(event.currentTarget.elements.email.value)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className='mx-auto mb-6 max-w-md'>
      <h2 className='mb-1 font-semibold text-gray-700 dark:text-gray-200'>
        {text('MAILCHIMP_TITLE', locale.MAILCHIMP.SUBSCRIBE)}
      </h2>
      <p className='mb-3 text-sm text-gray-600 dark:text-gray-300'>
        {text('MAILCHIMP_DESCRIPTION', locale.MAILCHIMP.MSG)}
      </p>
      <form onSubmit={event => { void handleSubmit(event) }} className='flex gap-2'>
        <label className='sr-only' htmlFor='newsletter-email'>
          {emailLabel}
        </label>
        <input
          className='min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
          id='newsletter-email'
          name='email'
          type='email'
          placeholder={emailLabel}
          required
          disabled={status === 'submitting' || status === 'success'}
        />
        <button
          className='rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60'
          type='submit'
          disabled={status === 'submitting' || status === 'success'}>
          {status === 'submitting'
            ? text('MAILCHIMP_SUBMITTING_TEXT', locale.MAILCHIMP.SUBMITTING)
            : text('MAILCHIMP_BUTTON_TEXT', locale.MAILCHIMP.SUBSCRIBE)}
        </button>
      </form>
      <p aria-live='polite' className='mt-2 text-sm'>
        {status === 'success' && (
          <span className='text-green-600'>{text('MAILCHIMP_SUCCESS_TEXT', locale.MAILCHIMP.SUCCESS)}</span>
        )}
        {status === 'error' && (
          <span className='text-red-600'>{text('MAILCHIMP_ERROR_TEXT', locale.MAILCHIMP.ERROR)}</span>
        )}
      </p>
    </section>
  )
}

export default MailChimpForm
