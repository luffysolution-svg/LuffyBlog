/* eslint-disable */

const nestHostId = '__nest'
const nestCanvasId = '__nest-canvas'
let nestCleanup = null

function readConfig(element, name) {
  return element.dataset[name] ?? element.getAttribute(name)
}

function readNumber(element, name, fallback) {
  const value = Number(readConfig(element, name))
  return Number.isFinite(value) ? value : fallback
}

/**
 * 创建低干扰的动态粒子背景。
 * 配置由 #__nest 的 data-* 或旧版普通属性提供，画布不拦截任何鼠标事件。
 */
function createNest() {
  destroyNest()

  const host = document.getElementById(nestHostId)
  if (!host) return

  const canvas = document.createElement('canvas')
  canvas.id = nestCanvasId
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = [
    'position:fixed',
    'inset:0',
    'pointer-events:none',
    `z-index:${readNumber(host, 'zIndex', 5)}`,
    `opacity:${readNumber(host, 'opacity', 0.28)}`
  ].join(';')
  host.appendChild(canvas)

  const context = canvas.getContext('2d')
  if (!context) {
    canvas.remove()
    return
  }

  const color = readConfig(host, 'color') || '146,140,238'
  const count = Math.max(12, Math.min(120, readNumber(host, 'count', 48)))
  const cursor = { x: null, y: null, max: 18000 }
  let width = 0
  let height = 0
  let frameId = null

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth || document.documentElement.clientWidth
    height = window.innerHeight || document.documentElement.clientHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
  }

  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: Math.random() * 0.6 - 0.3,
    vy: Math.random() * 0.6 - 0.3,
    max: 5200
  }))

  const moveCursor = event => {
    cursor.x = event.clientX
    cursor.y = event.clientY
  }
  const clearCursor = () => {
    cursor.x = null
    cursor.y = null
  }

  const draw = () => {
    context.clearRect(0, 0, width, height)
    const points = [cursor, ...particles]

    particles.forEach((particle, particleIndex) => {
      particle.x += particle.vx
      particle.y += particle.vy
      if (particle.x > width || particle.x < 0) particle.vx *= -1
      if (particle.y > height || particle.y < 0) particle.vy *= -1

      context.fillStyle = `rgba(${color},0.7)`
      context.fillRect(particle.x - 0.5, particle.y - 0.5, 1, 1)

      for (let index = particleIndex + 1; index < points.length; index++) {
        const point = points[index]
        if (point.x === null || point.y === null) continue

        const deltaX = particle.x - point.x
        const deltaY = particle.y - point.y
        const distance = deltaX * deltaX + deltaY * deltaY
        const maxDistance = point.max || particle.max
        if (distance >= maxDistance) continue

        const strength = (maxDistance - distance) / maxDistance
        context.beginPath()
        context.lineWidth = strength * 0.55
        context.strokeStyle = `rgba(${color},${strength * 0.55})`
        context.moveTo(particle.x, particle.y)
        context.lineTo(point.x, point.y)
        context.stroke()
      }
    })

    frameId = window.requestAnimationFrame(draw)
  }

  resize()
  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('mousemove', moveCursor, { passive: true })
  document.addEventListener('mouseleave', clearCursor)
  frameId = window.requestAnimationFrame(draw)

  nestCleanup = () => {
    if (frameId) window.cancelAnimationFrame(frameId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', moveCursor)
    document.removeEventListener('mouseleave', clearCursor)
    canvas.remove()
    nestCleanup = null
  }
}

function destroyNest() {
  nestCleanup?.()
  document.getElementById(nestCanvasId)?.remove()
}

window.createNest = createNest
window.destroyNest = destroyNest
