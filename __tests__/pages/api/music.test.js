import handler from '@/pages/api/music/[action]'

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader: jest.fn((name, value) => {
      response.headers[name] = value
    }),
    status: jest.fn(code => {
      response.statusCode = code
      return response
    }),
    json: jest.fn(body => {
      response.body = body
      return response
    })
  }
  return response
}

let requestCounter = 1

const createRequest = (action, query = {}, method = 'GET') => ({
  method,
  query: { action, ...query },
  headers: {
    'x-forwarded-for': `127.0.0.${requestCounter++}`
  },
  socket: { remoteAddress: '127.0.0.1' }
})

const mockUpstream = (body, status = 200) => {
  fetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body)
  })
}

describe('music API proxy', () => {
  const originalApiKey = process.env.CHKSZ_API_KEY

  beforeEach(() => {
    process.env.CHKSZ_API_KEY = 'test-server-only-key'
  })

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.CHKSZ_API_KEY
    else process.env.CHKSZ_API_KEY = originalApiKey
  })

  it('normalizes search results and keeps the API key out of the response', async () => {
    mockUpstream({
      code: 200,
      data: {
        total: 1,
        songs: [
          {
            id: 449818741,
            name: '光年之外',
            artists: 'G.E.M.邓紫棋',
            album: '新的心跳',
            picUrl: 'http://p1.music.126.net/cover.jpg',
            duration: 235000
          }
        ]
      }
    })
    const request = createRequest('search', { q: '邓紫棋 光年之外' })
    const response = createResponse()

    await handler(request, response)

    expect(response.statusCode).toBe(200)
    expect(response.body.data.songs).toEqual([
      {
        id: '449818741',
        name: '光年之外',
        artist: 'G.E.M.邓紫棋',
        album: '新的心跳',
        cover: 'https://p1.music.126.net/cover.jpg',
        duration: 235000
      }
    ])
    const upstreamUrl = new URL(fetch.mock.calls[0][0])
    expect(upstreamUrl.searchParams.get('apikey')).toBe('test-server-only-key')
    expect(JSON.stringify(response.body)).not.toContain('test-server-only-key')
  })

  it('resolves a playable track and normalizes secure media URLs', async () => {
    mockUpstream({
      code: 200,
      data: {
        id: 108914,
        name: '江南',
        artist: '林俊杰',
        album: '第二天堂',
        picUrl: 'http://p1.music.126.net/jiangnan.jpg',
        url: 'http://m801.music.126.net/jiangnan.flac',
        level: 'lossless',
        br: 944860,
        size: 31646511
      }
    })
    const request = createRequest('resolve', {
      id: '108914',
      level: 'lossless'
    })
    const response = createResponse()

    await handler(request, response)

    expect(response.statusCode).toBe(200)
    expect(response.body.data).toMatchObject({
      id: '108914',
      name: '江南',
      artist: '林俊杰',
      url: 'https://m801.music.126.net/jiangnan.flac',
      cover: 'https://p1.music.126.net/jiangnan.jpg',
      level: 'lossless'
    })
  })

  it('returns original and translated lyrics', async () => {
    mockUpstream({
      code: 200,
      data: {
        lrc: '[00:00.00]第一句',
        tlyric: '[00:00.00]First line',
        romalrc: '',
        klyric: ''
      }
    })
    const request = createRequest('lyrics', { id: '186016' })
    const response = createResponse()

    await handler(request, response)

    expect(response.statusCode).toBe(200)
    expect(response.body.data).toEqual({
      original: '[00:00.00]第一句',
      translation: '[00:00.00]First line',
      romanized: '',
      karaoke: ''
    })
  })

  it('rejects invalid song IDs without calling the upstream service', async () => {
    const request = createRequest('resolve', { id: '../secret' })
    const response = createResponse()

    await handler(request, response)

    expect(response.statusCode).toBe(400)
    expect(response.body.error).toBe('无效的歌曲 ID')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('maps unavailable upstream tracks to a useful 404 response', async () => {
    mockUpstream({ code: 404, msg: 'not found' }, 404)
    const request = createRequest('resolve', { id: '186016' })
    const response = createResponse()

    await handler(request, response)

    expect(response.statusCode).toBe(404)
    expect(response.body.error).toContain('当前音源不可用')
  })

  it('does not call upstream services when the server key is missing', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    delete process.env.CHKSZ_API_KEY
    const request = createRequest('search', { q: '林俊杰 江南' })
    const response = createResponse()

    await handler(request, response)

    expect(response.statusCode).toBe(503)
    expect(response.body.error).toBe('音乐服务尚未配置')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('allows GET only', async () => {
    const request = createRequest('search', { q: '测试' }, 'POST')
    const response = createResponse()

    await handler(request, response)

    expect(response.statusCode).toBe(405)
    expect(response.headers.Allow).toBe('GET')
  })
})
