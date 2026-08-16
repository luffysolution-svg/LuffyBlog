import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { siteConfig } from '@/lib/config'
import Player from '@/components/Player'

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn()
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: props => {
    const imageProps = { ...props }
    const alt = imageProps.alt || ''
    delete imageProps.fill
    delete imageProps.unoptimized
    delete imageProps.priority
    delete imageProps.loader
    delete imageProps.alt
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...imageProps} />
  }
}))

const config = {
  MUSIC_PLAYER: true,
  MUSIC_PLAYER_VISIBLE: true,
  MUSIC_PLAYER_ORDER: 'list',
  MUSIC_PLAYER_AUDIO_LIST: [
    {
      name: '示例歌曲',
      artist: '示例歌手',
      url: 'https://media.example.com/demo.mp3',
      cover: 'https://media.example.com/cover.jpg'
    }
  ]
}

const jsonResponse = data =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data })
  })

describe('Player', () => {
  let playMock
  let pauseMock
  let loadMock

  beforeEach(() => {
    siteConfig.mockImplementation(key => config[key])
    playMock = jest.fn().mockResolvedValue(undefined)
    pauseMock = jest.fn()
    loadMock = jest.fn()
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: playMock
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: pauseMock
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      configurable: true,
      value: loadMock
    })
    Element.prototype.scrollIntoView = jest.fn()
  })

  it('renders a quiet collapsed control and expands into the playback dock', () => {
    render(<Player />)

    fireEvent.click(screen.getByRole('button', { name: '展开音乐播放器' }))

    expect(screen.getByText('示例歌曲')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '搜索点歌' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '播放队列' })).toBeInTheDocument()
  })

  it('searches songs and adds the selected result to the queue', async () => {
    fetch.mockImplementation(url => {
      if (String(url).includes('/api/music/search')) {
        return jsonResponse({
          songs: [
            {
              id: '449818741',
              name: '光年之外',
              artist: 'G.E.M.邓紫棋',
              album: '新的心跳',
              cover: 'https://media.example.com/gem.jpg',
              duration: 235000
            }
          ],
          total: 1
        })
      }
      if (String(url).includes('/api/music/lyrics')) {
        return jsonResponse({ original: '', translation: '' })
      }
      return jsonResponse({})
    })
    render(<Player />)
    fireEvent.click(screen.getByRole('button', { name: '展开音乐播放器' }))
    fireEvent.click(screen.getByRole('button', { name: '搜索点歌' }))
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '邓紫棋 光年之外' }
    })
    fireEvent.click(screen.getByRole('button', { name: '搜索' }))

    expect(await screen.findByText('光年之外')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: '将 光年之外 加入队列' })
    )
    fireEvent.click(screen.getByRole('tab', { name: '队列 2' }))

    expect(screen.getByText('光年之外')).toBeInTheDocument()
    expect(screen.getByText('G.E.M.邓紫棋')).toBeInTheDocument()
  })

  it('resolves a searched song, starts audio and displays synchronized lyrics', async () => {
    fetch.mockImplementation(url => {
      const requestUrl = String(url)
      if (requestUrl.includes('/api/music/search')) {
        return jsonResponse({
          songs: [
            {
              id: '108914',
              name: '江南',
              artist: '林俊杰',
              album: '第二天堂',
              cover: 'https://media.example.com/jj.jpg',
              duration: 268000
            }
          ],
          total: 1
        })
      }
      if (requestUrl.includes('/api/music/resolve')) {
        return jsonResponse({
          id: '108914',
          name: '江南',
          artist: '林俊杰',
          album: '第二天堂',
          cover: 'https://media.example.com/jj.jpg',
          url: 'https://media.example.com/jiangnan.mp3',
          level: 'exhigh'
        })
      }
      if (requestUrl.includes('/api/music/lyrics')) {
        return jsonResponse({
          original: '[00:00.00]风到这里就是黏',
          translation: '[00:00.00]The wind lingers here'
        })
      }
      return jsonResponse({})
    })
    render(<Player />)
    fireEvent.click(screen.getByRole('button', { name: '展开音乐播放器' }))
    fireEvent.click(screen.getByRole('button', { name: '搜索点歌' }))
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '林俊杰 江南' }
    })
    fireEvent.click(screen.getByRole('button', { name: '搜索' }))

    await screen.findByText('江南')
    fireEvent.click(screen.getByRole('button', { name: '播放 江南' }))

    await waitFor(() => expect(playMock).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('tab', { name: '歌词' }))
    expect(await screen.findByText('风到这里就是黏')).toBeInTheDocument()
    expect(screen.getByText('The wind lingers here')).toBeInTheDocument()
  })
})
