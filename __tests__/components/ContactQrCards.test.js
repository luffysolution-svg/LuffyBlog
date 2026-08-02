import ContactQrCards from '@/components/ContactQrCards'
import { fireEvent, render, screen } from '@testing-library/react'

describe('ContactQrCards', () => {
  const props = {
    personalImage: 'https://images.example.com/personal.png',
    publicImage: 'https://images.example.com/public.png',
    publicName: '爱学习的三木'
  }

  it('renders two labelled thumbnails and opens an enlarged preview', () => {
    render(<ContactQrCards {...props} />)

    expect(screen.getByAltText('三木的个人微信二维码')).toBeInTheDocument()
    expect(
      screen.getByAltText('微信公众号“爱学习的三木”二维码')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '放大查看个人微信' }))

    expect(screen.getByRole('dialog', { name: '个人微信' })).toBeInTheDocument()
    expect(screen.getAllByAltText('三木的个人微信二维码')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: '关闭二维码预览' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a readable fallback when a thumbnail fails to load', () => {
    render(<ContactQrCards {...props} />)

    fireEvent.error(screen.getByAltText('三木的个人微信二维码'))

    expect(screen.getByText('二维码暂时无法加载')).toBeInTheDocument()
  })
})
