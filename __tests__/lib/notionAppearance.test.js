import { isPreferDark } from '@/themes/theme'

jest.mock('@/blog.config', () => ({ APPEARANCE: 'light', APPEARANCE_DARK_TIME: [18, 6] }))
jest.mock('next/dynamic', () => () => () => null)

describe('Notion appearance settings', () => {
  afterEach(() => jest.useRealTimers())

  it('uses a dark appearance even when the deployment default is light', () => {
    expect(isPreferDark('dark')).toBe(true)
    expect(isPreferDark('light')).toBe(false)
  })

  it('uses the Notion automatic-mode hours', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 1, 14))
    expect(isPreferDark('auto', [13, 6])).toBe(true)
    expect(isPreferDark('auto', [18, 6])).toBe(false)
  })
})
