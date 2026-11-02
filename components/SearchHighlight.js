export default function SearchHighlight({
  text = '',
  keyword = '',
  enabled = true
}) {
  const content = String(text || '')
  const query = keyword.trim()
  if (!enabled || !query) return content
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return content.split(new RegExp(`(${escaped})`, 'gi')).map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={index}
        className='rounded-sm bg-amber-200 px-0.5 text-gray-900 dark:bg-amber-300'
      >
        {part}
      </mark>
    ) : (
      part
    )
  )
}
