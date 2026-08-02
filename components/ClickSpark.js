import { useEffect } from 'react'

const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'label',
  '[role="button"]',
  '[contenteditable="true"]',
  '.aplayer',
  '#live2d'
].join(',')

const PARTICLE_COLORS = ['#7c6cff', '#5aa7ff', '#c084fc', '#ffffff']

/**
 * 空白区域点击时显示一组短暂的紫蓝微粒星芒。
 */
export default function ClickSpark() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches

    if (reduceMotion || coarsePointer) {
      return undefined
    }

    const handleClick = event => {
      if (event.target.closest?.(INTERACTIVE_SELECTOR)) {
        return
      }

      const burst = document.createElement('span')
      burst.className = 'click-spark-burst'
      burst.style.left = `${event.clientX}px`
      burst.style.top = `${event.clientY}px`
      burst.setAttribute('aria-hidden', 'true')

      const ring = document.createElement('span')
      ring.className = 'click-spark-ring'
      burst.appendChild(ring)

      for (let index = 0; index < 12; index++) {
        const angle = (Math.PI * 2 * index) / 12
        const distance = 34 + (index % 3) * 10
        const particle = document.createElement('span')
        particle.className = `click-spark-particle ${
          index % 2 === 0 ? 'click-spark-star' : 'click-spark-dot'
        }`
        particle.style.setProperty(
          '--spark-x',
          `${Math.cos(angle) * distance}px`
        )
        particle.style.setProperty(
          '--spark-y',
          `${Math.sin(angle) * distance}px`
        )
        particle.style.setProperty(
          '--spark-color',
          PARTICLE_COLORS[index % PARTICLE_COLORS.length]
        )
        if (index % 2 === 0) {
          particle.textContent = '✦'
        }
        burst.appendChild(particle)
      }

      document.body.appendChild(burst)
      const cleanup = () => burst.remove()
      burst.addEventListener('animationend', cleanup, { once: true })
      window.setTimeout(cleanup, 1000)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
