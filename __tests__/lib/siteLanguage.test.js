import { resolveSiteLanguage } from '@/lib/utils/siteLanguage'

describe('Notion default and explicit language routes', () => {
  it('uses Notion for the default route', () => {
    expect(resolveSiteLanguage('en-US', 'zh-CN', 'zh-CN')).toBe('en-US')
  })
  it('preserves the English route when the shared Notion database uses Chinese', () => {
    expect(resolveSiteLanguage('zh-CN', 'en', 'zh-CN')).toBe('en')
  })
  it('retains the deployment default when Notion has no language setting', () => {
    expect(resolveSiteLanguage(undefined, 'zh-CN', 'zh-CN')).toBe('zh-CN')
  })
})
