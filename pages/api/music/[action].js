const CHKSZ_API_BASE = 'https://api.chksz.com/api'
const REQUEST_TIMEOUT_MS = 12000
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX = Number(process.env.CHKSZ_MUSIC_RATE_LIMIT || 40)
const CACHE_MAX_ENTRIES = 300

const AUDIO_LEVELS = new Set([
  'standard',
  'exhigh',
  'lossless',
  'hires',
  'jyeffect',
  'sky',
  'jymaster'
])

const cache = new Map()
const requestHits = new Map()

const firstValue = value => (Array.isArray(value) ? value[0] : value)

const getClientIp = req => {
  const forwarded = firstValue(req.headers['x-forwarded-for'])
  return String(
    forwarded ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown'
  )
    .split(',')[0]
    .trim()
}

const isRateLimited = req => {
  const now = Date.now()
  const identifier = getClientIp(req)
  const hits = (requestHits.get(identifier) || []).filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
  )

  if (hits.length >= RATE_LIMIT_MAX) {
    requestHits.set(identifier, hits)
    return true
  }

  hits.push(now)
  requestHits.set(identifier, hits)
  return false
}

const normalizeHttps = value =>
  typeof value === 'string' ? value.replace(/^http:\/\//i, 'https://') : ''

const readCache = key => {
  const cached = cache.get(key)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }
  return cached.value
}

const writeCache = (key, value, ttlMs) => {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    for (const [cachedKey, cachedValue] of cache) {
      if (cachedValue.expiresAt <= Date.now()) cache.delete(cachedKey)
    }
    if (cache.size >= CACHE_MAX_ENTRIES) {
      cache.delete(cache.keys().next().value)
    }
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

const fetchChksz = async (path, params) => {
  const apiKey = process.env.CHKSZ_API_KEY
  if (!apiKey) {
    const error = new Error('音乐服务尚未配置')
    error.status = 503
    throw error
  }

  const url = new URL(`${CHKSZ_API_BASE}/${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  url.searchParams.set('apikey', apiKey)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    })
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      const error = new Error(
        response.status === 404
          ? '当前音源不可用，请尝试其他版本'
          : body?.msg || '上游音乐服务请求失败'
      )
      error.status =
        response.status === 429 ? 429 : response.status === 404 ? 404 : 502
      throw error
    }

    return body
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('音乐服务响应超时，请稍后重试')
      timeoutError.status = 504
      throw timeoutError
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

const searchSongs = async query => {
  const keyword = String(firstValue(query.q) || '').trim()
  if (!keyword || keyword.length > 80) {
    const error = new Error('请输入 1-80 个字符的歌曲或歌手名称')
    error.status = 400
    throw error
  }

  const requestedLimit = Number(firstValue(query.limit) || 10)
  const requestedOffset = Number(firstValue(query.offset) || 0)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 20)
    : 10
  const offset = Number.isFinite(requestedOffset)
    ? Math.min(Math.max(Math.trunc(requestedOffset), 0), 1000)
    : 0
  const cacheKey = `search:${keyword}:${limit}:${offset}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  const response = await fetchChksz('163_search', {
    keyword,
    limit,
    offset
  })
  const songs = Array.isArray(response?.data?.songs)
    ? response.data.songs
    : Array.isArray(response?.data)
      ? response.data
      : []
  const result = {
    songs: songs.map(song => ({
      id: String(song.id || ''),
      name: String(song.name || '未知歌曲'),
      artist: String(song.artists || song.artist || '未知歌手'),
      album: String(song.album || ''),
      cover: normalizeHttps(song.picUrl || song.cover),
      duration: Number(song.duration || 0)
    })),
    total: Number(response?.data?.total || songs.length)
  }

  writeCache(cacheKey, result, 5 * 60 * 1000)
  return result
}

const resolveSong = async query => {
  const id = String(firstValue(query.id) || '').trim()
  const level = String(firstValue(query.level) || 'exhigh').trim()
  if (!/^\d{1,20}$/.test(id)) {
    const error = new Error('无效的歌曲 ID')
    error.status = 400
    throw error
  }
  if (!AUDIO_LEVELS.has(level)) {
    const error = new Error('不支持的音质等级')
    error.status = 400
    throw error
  }

  const cacheKey = `resolve:${id}:${level}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  const response = await fetchChksz('163_music', {
    id,
    level,
    type: 'json'
  })
  const song = response?.data || {}
  if (!song.url) {
    const error = new Error('当前歌曲没有可用音频地址')
    error.status = 404
    throw error
  }

  const result = {
    id: String(song.id || id),
    name: String(song.name || '未知歌曲'),
    artist: String(song.artist || '未知歌手'),
    album: String(song.album || ''),
    cover: normalizeHttps(song.picUrl),
    url: normalizeHttps(song.url),
    level: String(song.level || level),
    bitrate: Number(song.br || 0),
    size: Number(song.size || 0)
  }

  writeCache(cacheKey, result, 2 * 60 * 1000)
  return result
}

const fetchLyrics = async query => {
  const id = String(firstValue(query.id) || '').trim()
  if (!/^\d{1,20}$/.test(id)) {
    const error = new Error('无效的歌曲 ID')
    error.status = 400
    throw error
  }

  const cacheKey = `lyrics:${id}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  const response = await fetchChksz('163_lyric', { id })
  const lyric = response?.data || {}
  const result = {
    original: String(lyric.lrc || ''),
    translation: String(lyric.tlyric || ''),
    romanized: String(lyric.romalrc || ''),
    karaoke: String(lyric.klyric || '')
  }

  writeCache(cacheKey, result, 60 * 60 * 1000)
  return result
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  if (isRateLimited(req)) {
    res.setHeader('Retry-After', String(RATE_LIMIT_WINDOW_MS / 1000))
    return res.status(429).json({ error: '点歌请求过于频繁，请稍后再试' })
  }

  const action = String(firstValue(req.query.action) || '')

  try {
    let data
    let cacheControl
    if (action === 'search') {
      data = await searchSongs(req.query)
      cacheControl = 'public, s-maxage=300, stale-while-revalidate=600'
    } else if (action === 'resolve') {
      data = await resolveSong(req.query)
      cacheControl = 'public, s-maxage=60, stale-while-revalidate=60'
    } else if (action === 'lyrics') {
      data = await fetchLyrics(req.query)
      cacheControl = 'public, s-maxage=3600, stale-while-revalidate=86400'
    } else {
      return res.status(404).json({ error: '未知的音乐接口' })
    }

    res.setHeader('Cache-Control', cacheControl)
    return res.status(200).json({ data })
  } catch (error) {
    const status = Number(error.status || 500)
    if (status >= 500) {
      console.error(
        `Music API ${action || 'unknown'} failed with status ${status}`
      )
    }
    return res.status(status).json({
      error: error.message || '音乐服务暂时不可用'
    })
  }
}
