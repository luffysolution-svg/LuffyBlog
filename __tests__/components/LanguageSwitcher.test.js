import LanguageSwitcher from '@/components/LanguageSwitcher'
import { fireEvent, render, screen } from '@testing-library/react'

const mockPush = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    locale: 'zh-CN',
    locales: ['zh-CN', 'en'],
    asPath: '/article/a-guide?from=series',
    push: mockPush
  })
}))

describe('LanguageSwitcher', () => {
  it('shows readable language buttons and keeps the current article when switching', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: '切换到 zh-CN' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '切换到 en' }))

    expect(screen.getByRole('button', { name: '切换到 zh-CN' })).toHaveTextContent('中文')
    expect(screen.getByRole('button', { name: '切换到 zh-CN' })).toHaveClass('bg-gray-900')
    expect(mockPush).toHaveBeenCalledWith('/article/a-guide?from=series', '/article/a-guide?from=series', { locale: 'en' })
  })
})
