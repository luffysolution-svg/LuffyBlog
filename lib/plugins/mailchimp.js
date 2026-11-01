import BLOG from '@/blog.config'

/**
 * 订阅邮件-服务端接口
 * @param {*} email
 * @returns
 */
export default function subscribeToMailchimpApi({
  email,
  first_name = '',
  last_name = ''
}) {
  const listId = BLOG.MAILCHIMP_LIST_ID // 替换为你的邮件列表 ID
  const apiKey = BLOG.MAILCHIMP_API_KEY // 替换为你的 API KEY
  if (!email || !listId || !apiKey) {
    return Promise.reject(new Error('Mailchimp is not configured'))
  }
  const dataCenter = BLOG.MAILCHIMP_DATA_CENTER || apiKey.split('-').pop()
  const data = {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      FNAME: first_name,
      LNAME: last_name
    }
  }
  return fetch(
    `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members`,
    {
      method: 'POST',
      headers: {
        Authorization: `apikey ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  )
}

/**
 * 客户端接口
 * @param {*} email
 * @param {*} firstName
 * @param {*} lastName
 * @returns
 */
export async function subscribeToNewsletter(email, firstName, lastName) {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, first_name: firstName, last_name: lastName })
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Subscription failed!')
  }
  return data
}
