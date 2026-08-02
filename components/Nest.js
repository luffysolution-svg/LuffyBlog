import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'

const Nest = () => {
  useEffect(() => {
    let active = true
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (reduceMotion) {
      return undefined
    }

    loadExternalResource('/js/nest.js', 'js').then(() => {
      if (active) {
        window.createNest?.()
      }
    })

    return () => {
      active = false
      window.destroyNest?.()
    }
  }, [])

  return (
    <div
      id='__nest'
      data-color='124,112,255'
      data-count='64'
      data-opacity='0.45'
      data-z-index='5'
      aria-hidden='true'
    />
  )
}

export default Nest
