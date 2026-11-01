import subscribeToMailchimpApi from '@/lib/plugins/mailchimp'

/**
 * 接受邮件订阅
 * @param {*} req
 * @param {*} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  const { email, firstName, lastName } = req.body || {}
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ status: 'error', message: 'Email is required.' })
  }

  try {
    const response = await subscribeToMailchimpApi({
      email: email.trim(),
      first_name: firstName,
      last_name: lastName
    })
    if (!response.ok) {
      let detail = ''
      try {
        const payload = await response.json()
        detail = payload?.detail || payload?.title || payload?.status || ''
      } catch {
        // Mailchimp may return an empty or non-JSON error response.
      }
      console.error('Mailchimp subscription rejected:', response.status, detail)
      return res.status(502).json({ status: 'error', message: 'Subscription failed!' })
    }
    return res.status(200).json({ status: 'success', message: 'Subscription successful!' })
  } catch (error) {
    console.error('Subscription error:', error)
    return res.status(503).json({ status: 'error', message: 'Subscription is unavailable.' })
  }
}
