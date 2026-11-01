import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { siteConfig } from '@/lib/config'
import { subscribeToNewsletter } from '@/lib/plugins/mailchimp'
import MailChimpForm from '@/themes/hexo/components/MailChimpForm'

jest.mock('@/lib/config', () => ({ siteConfig: jest.fn() }))
jest.mock('@/lib/global', () => ({ useGlobal: () => ({ locale: { MAILCHIMP: {
  SUBSCRIBE: 'Subscribe', MSG: 'Monthly updates', EMAIL: 'Email',
  SUBMITTING: 'Submitting', SUCCESS: 'Subscribed', ERROR: 'Try again'
} } }) }))
jest.mock('@/lib/plugins/mailchimp', () => ({ subscribeToNewsletter: jest.fn() }))

describe('Notion-controlled newsletter form', () => {
  beforeEach(() => { siteConfig.mockImplementation((key, fallback) => fallback) })

  it('can be hidden in Notion', () => {
    siteConfig.mockImplementation((key, fallback) => key === 'MAILCHIMP_ENABLE' ? false : fallback)
    const { container } = render(<MailChimpForm />)
    expect(container).toBeEmptyDOMElement()
  })

  it('uses Notion copy and preserves email subscription', async () => {
    const settings = { MAILCHIMP_TITLE: '三木的月报', MAILCHIMP_DESCRIPTION: '新文章与工具分享' }
    siteConfig.mockImplementation((key, fallback) => settings[key] ?? fallback)
    subscribeToNewsletter.mockResolvedValue({ status: 'success' })
    render(<MailChimpForm />)
    expect(screen.getByRole('heading', { name: '三木的月报' })).toBeInTheDocument()
    expect(screen.getByText('新文章与工具分享')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'reader@example.com' } })
    fireEvent.submit(screen.getByRole('textbox', { name: 'Email' }).closest('form'))
    await waitFor(() => expect(subscribeToNewsletter).toHaveBeenCalledWith('reader@example.com'))
    expect(await screen.findByText('Subscribed')).toBeInTheDocument()
  })
})
