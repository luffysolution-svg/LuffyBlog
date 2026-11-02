import SearchHighlight from '@/components/SearchHighlight'
import { render } from '@testing-library/react'

test('highlights literal punctuation and updates without retaining old highlights', () => {
  const { container, rerender } = render(
    <p>
      <SearchHighlight text='C++ and Obsidian, OBSIDIAN' keyword='C++' />
    </p>
  )
  expect(
    [...container.querySelectorAll('mark')].map(node => node.textContent)
  ).toEqual(['C++'])
  rerender(
    <p>
      <SearchHighlight text='C++ and Obsidian, OBSIDIAN' keyword='obsidian' />
    </p>
  )
  expect(
    [...container.querySelectorAll('mark')].map(node => node.textContent)
  ).toEqual(['Obsidian', 'OBSIDIAN'])
  rerender(
    <p>
      <SearchHighlight text='Obsidian' keyword='obsidian' enabled={false} />
    </p>
  )
  expect(container.querySelector('mark')).toBeNull()
})

test('renders article text as text, including HTML-looking content', () => {
  const text = '<img src=x onerror=alert(1)>'
  const { container } = render(
    <p>
      <SearchHighlight text={text} keyword='<img' />
    </p>
  )
  expect(container.textContent).toBe(text)
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('mark').textContent).toBe('<img')
})
