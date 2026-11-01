import {
  getProjects,
  getSeriesCollections
} from '@/lib/site/contentCollections'

describe('Notion content collections', () => {
  const series = {
    id: 'series',
    type: 'Series',
    status: 'Published',
    title: '科研工作流',
    slug: 'research',
    summary: '介绍',
    sort_order: '1'
  }
  const post = {
    id: 'first',
    type: 'Post',
    status: 'Published',
    series: 'research',
    title: '第一篇',
    slug: 'article/one',
    href: '/article/one',
    series_order: '1'
  }

  it('builds a series from its stable slug and orders chapters numerically', () => {
    const [result] = getSeriesCollections([
      series,
      { ...post, id: 'ten', series_order: '10' },
      { ...post, id: 'two', series_order: '2' },
      post
    ])
    expect(result.href).toBe('/series/research')
    expect(result.articles.map(article => article.id)).toEqual([
      'first',
      'two',
      'ten'
    ])
  })

  it('keeps unpublished chapters and unpublished series out of public directories', () => {
    const result = getSeriesCollections([
      series,
      post,
      { ...post, id: 'draft', status: 'Draft' },
      { ...post, id: 'hidden', status: 'Invisible' },
      { ...series, id: 'hidden-series', status: 'Draft' }
    ])
    expect(result).toHaveLength(1)
    expect(result[0].articles.map(article => article.id)).toEqual(['first'])
  })

  it('matches a friendly series name and preserves order when chapter numbers are missing', () => {
    const [result] = getSeriesCollections([
      series,
      { ...post, id: 'a', series: ['科研工作流'], series_order: '' },
      { ...post, id: 'b', series: '科研工作流', series_order: undefined }
    ])
    expect(result.articles.map(article => article.id)).toEqual(['a', 'b'])
  })

  it('keeps series membership when an English title is displayed', () => {
    const [result] = getSeriesCollections([
      { ...series, source_title: series.title, title: 'Research workflows' },
      { ...post, series: series.title }
    ])
    expect(result.articles).toHaveLength(1)
  })

  it('lists only published projects, honors zero ordering and permits http links', () => {
    const project = {
      id: 'project',
      type: 'Project',
      status: 'Published',
      slug: 'project',
      title: 'Project',
      project_url: 'https://example.com',
      repository: 'https://github.com/example/project'
    }
    const result = getProjects([
      project,
      { ...project, id: 'first', sort_order: '0' },
      { ...project, id: 'draft', status: 'Draft' }
    ])
    expect(result.map(item => item.id)).toEqual(['first', 'project'])
    expect(result[0].projectUrl).toBe('https://example.com/')
    expect(result[0].repository).toBe('https://github.com/example/project')
  })

  it('does not turn an invalid project URL into a clickable link', () => {
    const [result] = getProjects([
      {
        id: 'project',
        type: 'Project',
        status: 'Published',
        title: 'Project',
        project_url: 'javascript:alert(1)',
        repository: 'broken-url'
      }
    ])
    expect(result.projectUrl).toBe('')
    expect(result.repository).toBe('')
  })
})
