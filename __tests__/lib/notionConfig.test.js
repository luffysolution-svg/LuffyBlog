import { siteConfig } from '@/lib/config'
import { getGlobalSnapshot } from '@/lib/global'
import { parseConfigFromPage } from '@/lib/db/notion/getNotionConfig'

jest.mock('@/blog.config', () => ({
  THEME_SWITCH: false,
  CONTACT_GITHUB: 'https://github.com/old-profile',
  POST_RECOMMEND_COUNT: 6,
  POSTS_PER_PAGE: 12
}))
jest.mock('@/lib/global', () => ({ getGlobalSnapshot: jest.fn() }))
jest.mock('@/lib/utils', () => ({
  deepClone: value => JSON.parse(JSON.stringify(value)),
  isUrlLikePath: value => /^(https?:\/\/|\/)/.test(value)
}))
jest.mock('notion-utils', () => ({
  getDateValue: jest.fn(),
  getTextContent: value => value.flat().join('')
}))
jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  fetchNotionPageBlocks: jest.fn()
}))
jest.mock('@/lib/db/notion/getAllPageIds', () => ({
  __esModule: true,
  default: () => ['setting']
}))

function parseSetting(key, value, enabled = true) {
  return parseConfigFromPage({
    block: {
      table: { value: { type: 'collection_view', collection_id: 'collection', view_ids: ['view'] } },
      setting: { value: { type: 'page', properties: {
        title: [[key]], value: [[value]], enabled: [[enabled ? 'Yes' : 'No']]
      } } }
    },
    collection: { collection: { value: { schema: {
      title: { name: '配置名', type: 'title' },
      value: { name: '配置值', type: 'text' },
      enabled: { name: '启用', type: 'checkbox' }
    } } } },
    collection_query: {},
    collection_view: {}
  }, ['table'])
}

describe('Notion configuration precedence', () => {
  afterEach(() => { delete process.env.NEXT_PUBLIC_THEME_SWITCH })

  it.each([[true, 'false'], [false, 'true']])(
    'lets the Notion theme-switch value %s override the environment value %s',
    (value, env) => {
      process.env.NEXT_PUBLIC_THEME_SWITCH = env
      getGlobalSnapshot.mockReturnValue({ NOTION_CONFIG: { THEME_SWITCH: value } })
      expect(siteConfig('THEME_SWITCH')).toBe(value)
    }
  )

  it('allows an enabled empty contact setting to clear an old environment value', () => {
    const NOTION_CONFIG = parseSetting('CONTACT_GITHUB', '')
    getGlobalSnapshot.mockReturnValue({ NOTION_CONFIG })
    expect(siteConfig('CONTACT_GITHUB')).toBe('')
  })

  it.each([['false', false], ['0', 0]])('preserves the typed value %s', (raw, value) => {
    expect(parseSetting('EXAMPLE', raw).EXAMPLE).toBe(value)
  })

  it('allows the contact email to be cleared', () => {
    expect(parseSetting('CONTACT_EMAIL', '').CONTACT_EMAIL).toBe('')
  })

  it('ignores disabled rows', () => {
    expect(parseSetting('CONTACT_GITHUB', 'https://github.com/new-profile', false)).toEqual({})
  })

  it('uses request-specific server settings instead of a previous render', () => {
    getGlobalSnapshot.mockReturnValue({ NOTION_CONFIG: { POST_RECOMMEND_COUNT: 99 } })
    expect(siteConfig('POST_RECOMMEND_COUNT', 6, { POST_RECOMMEND_COUNT: 2 })).toBe(2)
  })
})
