import {
  getTranslationPageId,
  localizeSiteData
} from '@/lib/site/englishContent'

describe('English content maintained in Notion', () => {
  it('uses a notice’s own translation when it shares a hash slug with a menu', () => {
    const data = localizeSiteData(
      {
        allPages: [
          { id: 'menu', slug: '#', title: 'Browse', title_en: 'Browse' }
        ],
        notice: {
          slug: '#',
          title: '公告',
          title_en: 'Notice',
          translation_en: '0123456789abcdef0123456789abcdef',
          translation_en_status: 'Published'
        }
      },
      'en'
    )
    expect(data.notice.title).toBe('Notice')
    expect(data.notice.contentId).toBe('01234567-89ab-cdef-0123-456789abcdef')
  })

  it('extracts a Notion page id from a pasted page URL', () => {
    expect(
      getTranslationPageId(
        'https://www.notion.so/English-0123456789abcdef0123456789abcdef?pvs=4'
      )
    ).toBe('01234567-89ab-cdef-0123-456789abcdef')
    expect(getTranslationPageId('')).toBe('')
  })

  it('uses English copy and published translation content without changing canonical URLs', () => {
    const post = {
      id: 'source',
      title: '中文标题',
      title_en: 'English title',
      summary: '中文摘要',
      summary_en: 'English summary',
      slug: 'article/guide',
      href: '/article/guide',
      category: '科研',
      tagItems: [{ name: '教程' }],
      translation_en: '0123456789abcdef0123456789abcdef',
      translation_en_status: 'Published',
      translation_en_edited: '2026-11-01'
    }
    const data = localizeSiteData(
      {
        NOTION_CONFIG: {
          DESCRIPTION_EN: 'English blog',
          CATEGORY_TRANSLATIONS: { 科研: 'Research' },
          TAG_TRANSLATIONS: { 教程: 'Tutorial' }
        },
        siteInfo: { description: '中文介绍' },
        allPages: [post],
        customMenu: [
          { slug: 'article/guide', title: '中文标题', name: '中文标题' }
        ]
      },
      'en'
    )
    expect(data.allPages[0]).toMatchObject({
      title: 'English title',
      source_title: '中文标题',
      summary: 'English summary',
      href: '/article/guide',
      category: '科研',
      categoryLabel: 'Research',
      contentId: '01234567-89ab-cdef-0123-456789abcdef',
      contentLastEditedDate: '2026-11-01'
    })
    expect(data.allPages[0].tagItems[0].label).toBe('Tutorial')
    expect(data.customMenu[0].name).toBe('English title')
    expect(data.siteInfo.description).toBe('English blog')
    expect(data.NOTION_CONFIG.DESCRIPTION).toBe('English blog')
  })

  it('does not publish a draft translation or alter the Chinese site', () => {
    const post = {
      title: '中文',
      title_en: 'English',
      translation_en: '0123456789abcdef0123456789abcdef',
      translation_en_status: 'Draft'
    }
    expect(
      localizeSiteData({ allPages: [{ ...post }] }, 'en').allPages[0].contentId
    ).toBeUndefined()
    expect(
      localizeSiteData({ allPages: [post] }, 'zh-CN').allPages[0].title
    ).toBe('中文')
  })
})
