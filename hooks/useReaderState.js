import {
  READER_CHANGE_EVENT,
  READER_STORAGE_KEY,
  readReaderState
} from '@/lib/reader'
import { useEffect, useState } from 'react'

export default function useReaderState() {
  const [state, setState] = useState({ bookmarks: [], progress: {} })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const refresh = event => {
      if (
        event?.type === 'storage' &&
        event.key &&
        event.key !== READER_STORAGE_KEY
      )
        return
      setState(readReaderState())
    }
    refresh()
    setReady(true)
    window.addEventListener(READER_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(READER_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return { ...state, ready }
}
