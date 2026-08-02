const {
  appendLocalePageId,
  extractLangId,
  extractLangPrefix,
  getShortId
} = require('@/lib/utils/pageId')

describe('pageId utilities', () => {
  it('appends an optional locale database without replacing the primary one', () => {
    expect(appendLocalePageId('primary-id', 'en', 'english-id')).toBe(
      'primary-id,en:english-id'
    )
  })

  it('keeps an existing locale mapping instead of duplicating it', () => {
    expect(
      appendLocalePageId('primary-id,en:existing-id', 'en', 'replacement-id')
    ).toBe('primary-id,en:existing-id')
  })

  it('keeps the current configuration when the optional database is absent', () => {
    expect(appendLocalePageId('primary-id', 'en', '')).toBe('primary-id')
  })

  it('retains the existing extraction helpers', () => {
    expect(extractLangPrefix('en:page-id')).toBe('en')
    expect(extractLangId('en:page-id')).toBe('page-id')
    expect(getShortId('pageid')).toBe('pageid')
  })
})
