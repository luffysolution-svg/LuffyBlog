import { siteConfig } from '@/lib/config'
import {
  IconAlertCircle,
  IconChevronDown,
  IconList,
  IconLoader2,
  IconMusic,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconPlus,
  IconSearch,
  IconTrash,
  IconVolume,
  IconX
} from '@tabler/icons-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './Player.module.css'

const QUALITY_OPTIONS = [
  { value: 'standard', label: '标准' },
  { value: 'exhigh', label: '极高' },
  { value: 'lossless', label: '无损' },
  { value: 'hires', label: 'Hi-Res' },
  { value: 'jymaster', label: '母带' }
]

const parseBoolean = value => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return Boolean(value)
}

const formatTime = seconds => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`
}

const normalizeTrack = (track, index = 0) => ({
  key: track.key || (track.id ? `163-${track.id}` : `config-${index}`),
  id: track.id ? String(track.id) : '',
  name: String(track.name || track.title || '未知歌曲'),
  artist: String(track.artist || track.author || '未知歌手'),
  album: String(track.album || ''),
  cover: String(track.cover || track.pic || ''),
  url: String(track.url || ''),
  lrc: String(track.lrc || ''),
  duration: Number(track.duration || 0),
  level: String(track.level || ''),
  source: track.source || (track.id ? 'chksz' : 'config'),
  resolvedAt: Number(track.resolvedAt || 0)
})

const parseLrc = value => {
  if (!value) return []
  const lines = []
  const timestampPattern = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g

  String(value)
    .split(/\r?\n/)
    .forEach(rawLine => {
      const timestamps = [...rawLine.matchAll(timestampPattern)]
      if (timestamps.length === 0) return
      const text = rawLine.replace(timestampPattern, '').trim()
      if (!text) return

      timestamps.forEach(match => {
        const fraction = match[3] || '0'
        const fractionSeconds =
          fraction.length === 1
            ? Number(fraction) / 10
            : fraction.length === 2
              ? Number(fraction) / 100
              : Number(fraction) / 1000
        lines.push({
          time: Number(match[1]) * 60 + Number(match[2]) + fractionSeconds,
          text
        })
      })
    })

  return lines.sort((a, b) => a.time - b.time)
}

const mergeLyrics = (original, translation) => {
  const translatedByTime = new Map(
    parseLrc(translation).map(line => [Math.round(line.time * 10), line.text])
  )
  return parseLrc(original).map(line => ({
    ...line,
    translation: translatedByTime.get(Math.round(line.time * 10)) || ''
  }))
}

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.error || '音乐服务暂时不可用')
  }
  return body.data
}

const TrackCover = ({ track, playing = false, size = 'dock' }) => {
  const sizeClass =
    size === 'panel'
      ? styles.coverPanel
      : size === 'list'
        ? styles.coverList
        : styles.coverDock

  return (
    <span
      className={`${styles.cover} ${sizeClass} ${
        playing ? styles.coverPlaying : ''
      }`}
    >
      {track?.cover ? (
        <Image
          src={track.cover}
          alt={`${track.name || '歌曲'}封面`}
          fill
          sizes={size === 'panel' ? '64px' : size === 'list' ? '44px' : '48px'}
          unoptimized
        />
      ) : (
        <IconMusic aria-hidden='true' stroke={1.7} />
      )}
    </span>
  )
}

const IconButton = ({ label, children, className = '', ...props }) => (
  <button
    type='button'
    className={`${styles.iconButton} ${className}`}
    aria-label={label}
    title={label}
    {...props}
  >
    {children}
  </button>
)

const Player = () => {
  const audioRef = useRef(null)
  const loadedTrackKeyRef = useRef('')
  const playRequestRef = useRef(0)
  const lyricLineRefs = useRef([])
  const manualLyricScrollUntilRef = useRef(0)

  const musicPlayerEnable = parseBoolean(siteConfig('MUSIC_PLAYER'))
  const playerVisible = parseBoolean(siteConfig('MUSIC_PLAYER_VISIBLE'))
  const playOrder = siteConfig('MUSIC_PLAYER_ORDER') || 'list'
  const configuredTracks = siteConfig('MUSIC_PLAYER_AUDIO_LIST')
  const initialQueue = useMemo(
    () =>
      (Array.isArray(configuredTracks) ? configuredTracks : []).map(
        normalizeTrack
      ),
    [configuredTracks]
  )

  const [queue, setQueue] = useState(initialQueue)
  const [currentTrackKey, setCurrentTrackKey] = useState(
    initialQueue[0]?.key || ''
  )
  const [dockOpen, setDockOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('search')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [quality, setQuality] = useState('exhigh')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTouched, setSearchTouched] = useState(false)
  const [lyrics, setLyrics] = useState([])
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const currentTrack = useMemo(
    () =>
      queue.find(track => track.key === currentTrackKey) || queue[0] || null,
    [currentTrackKey, queue]
  )
  const currentTrackId = currentTrack?.id || ''
  const currentTrackLrc = currentTrack?.lrc || ''
  const currentIndex = currentTrack
    ? queue.findIndex(track => track.key === currentTrack.key)
    : -1
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const activeLyricIndex = useMemo(() => {
    let activeIndex = -1
    for (let index = 0; index < lyrics.length; index += 1) {
      if (lyrics[index].time <= currentTime + 0.05) activeIndex = index
      else break
    }
    return activeIndex
  }, [currentTime, lyrics])

  useEffect(() => {
    try {
      const savedVolume = Number(window.localStorage.getItem('music-volume'))
      const savedQuality = window.localStorage.getItem('music-quality')
      if (
        Number.isFinite(savedVolume) &&
        savedVolume >= 0 &&
        savedVolume <= 1
      ) {
        setVolume(savedVolume)
      }
      if (QUALITY_OPTIONS.some(option => option.value === savedQuality)) {
        setQuality(savedQuality)
      }
    } catch (error) {
      console.warn('Unable to restore music preferences')
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 1800)
    return () => window.clearTimeout(timeout)
  }, [notice])

  useEffect(() => {
    if (!currentTrackKey) {
      setLyrics([])
      return undefined
    }

    if (!currentTrackId) {
      setLyrics(mergeLyrics(currentTrackLrc, ''))
      return undefined
    }

    const controller = new AbortController()
    setIsLoadingLyrics(true)
    setLyrics([])
    requestJson(`/api/music/lyrics?id=${encodeURIComponent(currentTrackId)}`, {
      signal: controller.signal
    })
      .then(data => {
        setLyrics(mergeLyrics(data.original, data.translation))
      })
      .catch(fetchError => {
        if (fetchError.name !== 'AbortError') setLyrics([])
      })
      .finally(() => setIsLoadingLyrics(false))

    return () => controller.abort()
  }, [currentTrackId, currentTrackKey, currentTrackLrc])

  useEffect(() => {
    if (
      activeLyricIndex < 0 ||
      Date.now() < manualLyricScrollUntilRef.current
    ) {
      return
    }
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    lyricLineRefs.current[activeLyricIndex]?.scrollIntoView({
      block: 'center',
      behavior: reduceMotion ? 'auto' : 'smooth'
    })
  }, [activeLyricIndex])

  const updateQueueTrack = useCallback(updatedTrack => {
    setQueue(previous =>
      previous.map(track =>
        track.key === updatedTrack.key ? updatedTrack : track
      )
    )
  }, [])

  const resolveTrack = useCallback(
    async (track, requestedLevel = quality) => {
      const isFresh = Date.now() - track.resolvedAt < 90 * 1000
      if (track.url && (track.source !== 'chksz' || isFresh)) return track
      if (!track.id) throw new Error('这首歌曲没有可用的音频地址')

      const data = await requestJson(
        `/api/music/resolve?id=${encodeURIComponent(
          track.id
        )}&level=${encodeURIComponent(requestedLevel)}`
      )
      const resolvedTrack = normalizeTrack({
        ...track,
        ...data,
        key: track.key,
        source: 'chksz',
        resolvedAt: Date.now()
      })
      updateQueueTrack(resolvedTrack)
      return resolvedTrack
    },
    [quality, updateQueueTrack]
  )

  const loadTrack = useCallback(
    async (
      track,
      shouldPlay = true,
      { preserveTime = 0, requestedLevel = quality } = {}
    ) => {
      if (!track || !audioRef.current) return
      const requestId = ++playRequestRef.current
      setError('')
      setIsResolving(true)
      setCurrentTrackKey(track.key)

      try {
        const resolvedTrack = await resolveTrack(track, requestedLevel)
        if (requestId !== playRequestRef.current || !audioRef.current) return
        const audio = audioRef.current
        const currentSource = audio.currentSrc || audio.src

        if (currentSource !== resolvedTrack.url) {
          audio.src = resolvedTrack.url
          loadedTrackKeyRef.current = resolvedTrack.key
          audio.load()
        }

        if (preserveTime > 0) {
          const restoreTime = () => {
            if (!audioRef.current) return
            audioRef.current.currentTime = Math.min(
              preserveTime,
              audioRef.current.duration || preserveTime
            )
          }
          if (audio.readyState >= 1) restoreTime()
          else
            audio.addEventListener('loadedmetadata', restoreTime, {
              once: true
            })
        }

        if (shouldPlay) await audio.play()
      } catch (playError) {
        if (requestId === playRequestRef.current) {
          setError(playError.message || '歌曲播放失败，请尝试其他版本')
          setPanelOpen(true)
        }
      } finally {
        if (requestId === playRequestRef.current) setIsResolving(false)
      }
    },
    [quality, resolveTrack]
  )

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current
    if (!currentTrack) {
      setDockOpen(true)
      setPanelOpen(true)
      setActiveTab('search')
      return
    }

    if (isPlaying) {
      audio?.pause()
      return
    }

    if (audio?.src && loadedTrackKeyRef.current === currentTrack.key) {
      audio.play().catch(() => setError('浏览器阻止了播放，请再次点击播放'))
    } else {
      loadTrack(currentTrack, true)
    }
  }, [currentTrack, isPlaying, loadTrack])

  const playAdjacent = useCallback(
    direction => {
      if (queue.length === 0) return
      let nextIndex
      if (playOrder === 'random' && queue.length > 1) {
        nextIndex = Math.floor(Math.random() * queue.length)
      } else {
        nextIndex =
          (Math.max(currentIndex, 0) + direction + queue.length) % queue.length
      }
      loadTrack(queue[nextIndex], true)
    },
    [currentIndex, loadTrack, playOrder, queue]
  )

  const runSearch = async event => {
    event?.preventDefault()
    const query = searchQuery.trim()
    if (!query) {
      setError('请输入歌曲或歌手名称')
      return
    }

    setIsSearching(true)
    setSearchTouched(true)
    setError('')
    try {
      const data = await requestJson(
        `/api/music/search?q=${encodeURIComponent(query)}&limit=10`
      )
      setSearchResults((data.songs || []).map(normalizeTrack))
      setSearchTotal(Number(data.total || 0))
    } catch (searchError) {
      setSearchResults([])
      setError(searchError.message || '搜索失败，请稍后再试')
    } finally {
      setIsSearching(false)
    }
  }

  const addToQueue = track => {
    const normalized = normalizeTrack(track)
    const exists = queue.some(item => item.key === normalized.key)
    if (!exists) setQueue(previous => [...previous, normalized])
    setNotice(exists ? '歌曲已在队列中' : '已加入播放队列')
  }

  const playSearchResult = track => {
    const normalized = normalizeTrack(track)
    if (!queue.some(item => item.key === normalized.key)) {
      setQueue(previous => [...previous, normalized])
    }
    setDockOpen(true)
    loadTrack(normalized, true)
  }

  const removeFromQueue = track => {
    const removedIndex = queue.findIndex(item => item.key === track.key)
    const nextQueue = queue.filter(item => item.key !== track.key)
    setQueue(nextQueue)

    if (track.key !== currentTrackKey) return
    audioRef.current?.pause()
    if (audioRef.current) {
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
    }
    loadedTrackKeyRef.current = ''
    setCurrentTime(0)
    setDuration(0)
    setCurrentTrackKey(
      nextQueue[Math.min(removedIndex, nextQueue.length - 1)]?.key || ''
    )
  }

  const changeQuality = event => {
    const nextQuality = event.target.value
    const audio = audioRef.current
    const shouldResume = Boolean(audio && !audio.paused)
    const resumeAt = audio?.currentTime || 0
    setQuality(nextQuality)
    try {
      window.localStorage.setItem('music-quality', nextQuality)
    } catch (error) {
      console.warn('Unable to save music quality')
    }

    setQueue(previous =>
      previous.map(track =>
        track.source === 'chksz'
          ? { ...track, url: '', level: '', resolvedAt: 0 }
          : track
      )
    )

    if (currentTrack?.source === 'chksz') {
      loadedTrackKeyRef.current = ''
      loadTrack(
        { ...currentTrack, url: '', level: '', resolvedAt: 0 },
        shouldResume,
        { preserveTime: resumeAt, requestedLevel: nextQuality }
      )
    }
  }

  const changeVolume = event => {
    const nextVolume = Number(event.target.value)
    setVolume(nextVolume)
    if (audioRef.current) audioRef.current.volume = nextVolume
    try {
      window.localStorage.setItem('music-volume', String(nextVolume))
    } catch (error) {
      console.warn('Unable to save music volume')
    }
  }

  const seekTo = event => {
    if (!audioRef.current || !duration) return
    const nextTime = (Number(event.target.value) / 100) * duration
    audioRef.current.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const openPanel = tab => {
    setDockOpen(true)
    setPanelOpen(true)
    setActiveTab(tab)
  }

  if (!musicPlayerEnable || !playerVisible) return null

  return (
    <div className={styles.root} data-testid='music-player'>
      <audio
        ref={audioRef}
        preload='metadata'
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={event =>
          setDuration(event.currentTarget.duration || 0)
        }
        onDurationChange={event =>
          setDuration(event.currentTarget.duration || 0)
        }
        onTimeUpdate={event =>
          setCurrentTime(event.currentTarget.currentTime || 0)
        }
        onEnded={() => playAdjacent(1)}
        onError={() => {
          if (audioRef.current?.src) {
            setError('音频加载失败，请尝试其他歌曲或音质')
            setPanelOpen(true)
          }
        }}
      />

      {panelOpen && (
        <section
          className={styles.panel}
          role='dialog'
          aria-label='音乐点歌面板'
        >
          <header className={styles.panelHeader}>
            <div className={styles.nowPlaying}>
              <TrackCover
                track={currentTrack}
                playing={isPlaying}
                size='panel'
              />
              <div className={styles.nowPlayingText}>
                <strong>{currentTrack?.name || '搜索一首喜欢的歌'}</strong>
                <span>{currentTrack?.artist || 'LuffyBlog 音乐'}</span>
                {currentTrack?.level && (
                  <small>
                    {QUALITY_OPTIONS.find(
                      option => option.value === currentTrack.level
                    )?.label || currentTrack.level}
                  </small>
                )}
              </div>
            </div>
            <IconButton
              label='关闭点歌面板'
              onClick={() => setPanelOpen(false)}
            >
              <IconX size={19} stroke={1.8} />
            </IconButton>
          </header>

          <div className={styles.panelControls}>
            <label className={styles.qualityControl}>
              <span>音质</span>
              <select value={quality} onChange={changeQuality}>
                {QUALITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.volumeControl}>
              <IconVolume size={17} stroke={1.7} aria-hidden='true' />
              <span className={styles.srOnly}>音量</span>
              <input
                type='range'
                min='0'
                max='1'
                step='0.05'
                value={volume}
                onChange={changeVolume}
              />
            </label>
          </div>

          <div className={styles.tabs} role='tablist' aria-label='音乐面板功能'>
            {[
              ['search', '点歌', IconSearch],
              ['queue', `队列 ${queue.length}`, IconList],
              ['lyrics', '歌词', IconMusic]
            ].map(([tab, label, Icon]) => (
              <button
                key={tab}
                type='button'
                role='tab'
                aria-selected={activeTab === tab}
                className={activeTab === tab ? styles.tabActive : ''}
                onClick={() => setActiveTab(tab)}
              >
                <Icon size={16} stroke={1.8} aria-hidden='true' />
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className={styles.errorMessage} role='alert'>
              <IconAlertCircle size={17} stroke={1.8} aria-hidden='true' />
              <span>{error}</span>
              <button type='button' onClick={() => setError('')}>
                关闭
              </button>
            </div>
          )}

          <div className={styles.panelBody}>
            {activeTab === 'search' && (
              <div className={styles.searchView}>
                <form
                  className={styles.searchForm}
                  onSubmit={event => {
                    void runSearch(event)
                  }}
                >
                  <label htmlFor='music-search'>搜索歌曲、歌手或专辑</label>
                  <div className={styles.searchInputRow}>
                    <IconSearch size={18} stroke={1.8} aria-hidden='true' />
                    <input
                      id='music-search'
                      type='search'
                      maxLength={80}
                      value={searchQuery}
                      onChange={event => setSearchQuery(event.target.value)}
                      placeholder='例如：邓紫棋 光年之外'
                      autoComplete='off'
                    />
                    <button type='submit' disabled={isSearching}>
                      {isSearching ? '搜索中' : '搜索'}
                    </button>
                  </div>
                  <p>请核对歌手与专辑，搜索结果可能包含翻唱版本。</p>
                </form>

                {isSearching ? (
                  <div className={styles.loadingList} aria-label='正在搜索'>
                    {[0, 1, 2, 3].map(item => (
                      <span key={item} />
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className={styles.trackList}>
                    <p className={styles.resultCount}>
                      找到约 {searchTotal} 个结果，显示前 {searchResults.length}{' '}
                      个
                    </p>
                    {searchResults.map(track => (
                      <article className={styles.trackRow} key={track.key}>
                        <TrackCover track={track} size='list' />
                        <button
                          type='button'
                          className={styles.trackMain}
                          onClick={() => playSearchResult(track)}
                        >
                          <strong>{track.name}</strong>
                          <span>{track.artist}</span>
                          <small>{track.album || '未知专辑'}</small>
                        </button>
                        <span className={styles.trackDuration}>
                          {formatTime(track.duration / 1000)}
                        </span>
                        <IconButton
                          label={`播放 ${track.name}`}
                          onClick={() => playSearchResult(track)}
                        >
                          <IconPlayerPlay size={17} stroke={1.9} />
                        </IconButton>
                        <IconButton
                          label={`将 ${track.name} 加入队列`}
                          onClick={() => addToQueue(track)}
                        >
                          <IconPlus size={18} stroke={1.9} />
                        </IconButton>
                      </article>
                    ))}
                  </div>
                ) : searchTouched ? (
                  <div className={styles.emptyState}>
                    <IconSearch size={28} stroke={1.5} aria-hidden='true' />
                    <strong>没有找到合适的歌曲</strong>
                    <span>可以换用“歌手 + 歌名”再次搜索。</span>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <IconMusic size={30} stroke={1.5} aria-hidden='true' />
                    <strong>输入关键词开始点歌</strong>
                    <span>选择正确版本后即可播放或加入队列。</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'queue' && (
              <div className={styles.queueView}>
                {queue.length > 0 ? (
                  <div className={styles.trackList}>
                    {queue.map((track, index) => (
                      <article
                        className={`${styles.trackRow} ${
                          track.key === currentTrack?.key
                            ? styles.trackRowActive
                            : ''
                        }`}
                        key={track.key}
                      >
                        <span className={styles.queueIndex}>{index + 1}</span>
                        <TrackCover
                          track={track}
                          playing={isPlaying && track.key === currentTrack?.key}
                          size='list'
                        />
                        <button
                          type='button'
                          className={styles.trackMain}
                          onClick={() => {
                            void loadTrack(track, true)
                          }}
                        >
                          <strong>{track.name}</strong>
                          <span>{track.artist}</span>
                        </button>
                        <IconButton
                          label={`播放 ${track.name}`}
                          onClick={() => {
                            void loadTrack(track, true)
                          }}
                        >
                          {isPlaying && track.key === currentTrack?.key ? (
                            <IconPlayerPause size={17} stroke={1.9} />
                          ) : (
                            <IconPlayerPlay size={17} stroke={1.9} />
                          )}
                        </IconButton>
                        <IconButton
                          label={`从队列移除 ${track.name}`}
                          onClick={() => removeFromQueue(track)}
                        >
                          <IconTrash size={17} stroke={1.8} />
                        </IconButton>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <IconList size={30} stroke={1.5} aria-hidden='true' />
                    <strong>播放队列还是空的</strong>
                    <button
                      type='button'
                      onClick={() => setActiveTab('search')}
                    >
                      去点一首歌
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lyrics' && (
              <div
                className={styles.lyricsView}
                onWheel={() => {
                  manualLyricScrollUntilRef.current = Date.now() + 5000
                }}
                onTouchStart={() => {
                  manualLyricScrollUntilRef.current = Date.now() + 5000
                }}
              >
                {isLoadingLyrics ? (
                  <div className={styles.lyricsLoading}>
                    <IconLoader2 size={24} stroke={1.7} aria-hidden='true' />
                    正在加载歌词
                  </div>
                ) : lyrics.length > 0 ? (
                  <div className={styles.lyricLines}>
                    {lyrics.map((line, index) => (
                      <button
                        type='button'
                        key={`${line.time}-${index}`}
                        ref={element => {
                          lyricLineRefs.current[index] = element
                        }}
                        aria-current={
                          index === activeLyricIndex ? 'true' : undefined
                        }
                        className={
                          index === activeLyricIndex ? styles.lyricActive : ''
                        }
                        onClick={() => {
                          if (!audioRef.current) return
                          audioRef.current.currentTime = line.time
                          setCurrentTime(line.time)
                        }}
                      >
                        <span>{line.text}</span>
                        {line.translation && <small>{line.translation}</small>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <IconMusic size={30} stroke={1.5} aria-hidden='true' />
                    <strong>
                      {currentTrack ? '这首歌暂无歌词' : '还没有播放歌曲'}
                    </strong>
                    <span>
                      {currentTrack
                        ? '可以继续听歌或选择其他版本。'
                        : '点歌后会在这里显示同步歌词。'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {dockOpen ? (
        <div
          className={`${styles.dock} ${panelOpen ? styles.dockPanelOpen : ''}`}
          aria-label='音乐播放器'
        >
          <button
            type='button'
            className={styles.coverButton}
            onClick={togglePlayback}
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            <TrackCover track={currentTrack} playing={isPlaying} />
            <span className={styles.coverOverlay}>
              {isResolving ? (
                <IconLoader2 size={19} stroke={2} />
              ) : isPlaying ? (
                <IconPlayerPause size={19} stroke={2} />
              ) : (
                <IconPlayerPlay size={19} stroke={2} />
              )}
            </span>
          </button>

          <button
            type='button'
            className={styles.dockTrackInfo}
            onClick={() => openPanel(currentTrack ? 'lyrics' : 'search')}
          >
            <strong>{currentTrack?.name || '搜索点歌'}</strong>
            <span>{currentTrack?.artist || '点击打开音乐面板'}</span>
          </button>

          <div className={styles.dockControls}>
            <IconButton label='上一首' onClick={() => playAdjacent(-1)}>
              <IconPlayerSkipBack size={17} stroke={1.9} />
            </IconButton>
            <IconButton
              label={isPlaying ? '暂停' : '播放'}
              className={styles.primaryControl}
              disabled={isResolving}
              onClick={togglePlayback}
            >
              {isResolving ? (
                <IconLoader2 size={18} stroke={2} />
              ) : isPlaying ? (
                <IconPlayerPause size={18} stroke={2} />
              ) : (
                <IconPlayerPlay size={18} stroke={2} />
              )}
            </IconButton>
            <IconButton label='下一首' onClick={() => playAdjacent(1)}>
              <IconPlayerSkipForward size={17} stroke={1.9} />
            </IconButton>
          </div>

          <div className={styles.dockActions}>
            <IconButton label='搜索点歌' onClick={() => openPanel('search')}>
              <IconSearch size={17} stroke={1.8} />
            </IconButton>
            <IconButton label='播放队列' onClick={() => openPanel('queue')}>
              <IconList size={17} stroke={1.8} />
            </IconButton>
            <IconButton label='收起播放器' onClick={() => setDockOpen(false)}>
              <IconChevronDown size={18} stroke={1.8} />
            </IconButton>
          </div>

          <div className={styles.progressRow}>
            <span>{formatTime(currentTime)}</span>
            <input
              type='range'
              min='0'
              max='100'
              step='0.1'
              value={progress}
              aria-label='播放进度'
              onChange={seekTo}
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      ) : (
        <button
          type='button'
          className={styles.collapsedButton}
          onClick={() => setDockOpen(true)}
          aria-label='展开音乐播放器'
          title='展开音乐播放器'
        >
          <TrackCover track={currentTrack} playing={isPlaying} />
          {isPlaying && <span className={styles.playingIndicator} />}
        </button>
      )}

      {notice && <div className={styles.notice}>{notice}</div>}
    </div>
  )
}

export default Player
