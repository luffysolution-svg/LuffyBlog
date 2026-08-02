import LanguageSwitcher from '@/components/LanguageSwitcher'
import { fireEvent, render, screen } from '@testing-library/react'

const mockPush = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    locale: 'zh-CN',
    locales: ['zh-CN', 'en'],
    push: mockPush
  })
}))

describe('LanguageSwitcher', () => {
  it('shows configured locales and enters the selected language homepage', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: '切换到 zh-CN' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '切换到 en' }))

    expect(mockPush).toHaveBeenCalledWith('/', '/', { locale: 'en' })
  })
})
