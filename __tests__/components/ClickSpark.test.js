import ClickSpark from '@/components/ClickSpark'
import { fireEvent, render } from '@testing-library/react'

describe('ClickSpark', () => {
  it('creates a temporary star burst on non-interactive clicks', () => {
    render(<ClickSpark />)

    fireEvent.click(document.body, { clientX: 120, clientY: 80 })

    expect(document.querySelector('.click-spark-burst')).not.toBeNull()
    expect(document.querySelectorAll('.click-spark-particle')).toHaveLength(10)
  })

  it('does not trigger when clicking an interactive control', () => {
    render(
      <>
        <ClickSpark />
        <button type='button'>播放器控制</button>
      </>
    )

    fireEvent.click(document.querySelector('button'))

    expect(document.querySelector('.click-spark-burst')).toBeNull()
  })
})
