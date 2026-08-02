const fs = require('fs')
const path = require('path')

const nestSource = fs.readFileSync(
  path.join(process.cwd(), 'public/js/nest.js'),
  'utf8'
)

describe('nest background script', () => {
  let getContext

  beforeAll(() => {
    window.eval(nestSource)
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <div
        id="__nest"
        zIndex="-1"
        opacity="0.5"
        color="100,100,100"
        count="99"
      ></div>
    `
    getContext = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        setTransform: jest.fn(),
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn()
      })
    window.requestAnimationFrame = jest.fn(() => 1)
    window.cancelAnimationFrame = jest.fn()
  })

  afterEach(() => {
    window.destroyNest?.()
    getContext.mockRestore()
  })

  it('supports the ordinary attributes used by the Endspace theme', () => {
    window.createNest()

    const canvas = document.getElementById('__nest-canvas')
    expect(canvas).not.toBeNull()
    expect(canvas.style.zIndex).toBe('-1')
    expect(canvas.style.opacity).toBe('0.5')
    expect(canvas.style.pointerEvents).toBe('none')
  })
})
