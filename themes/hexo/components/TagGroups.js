import TagItemMini from './TagItemMini'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

/**
 * 标签组
 * @param tags
 * @param currentTag
 * @returns {JSX.Element}
 * @constructor
 */
const TagGroups = ({ tags, currentTag }) => {
  if (!tags) return <></>
  const tagCount = Number(siteConfig('PREVIEW_TAG_COUNT', null, CONFIG)) || 0
  const visibleTags = tagCount > 0 ? tags.slice(0, tagCount) : tags
  return (
    <div id='tags-group' className='dark:border-gray-600 space-y-2'>
      <div className='font-light text-xs ml-2 mb-2'><i className='mr-1 fas fa-tag' />标签</div>
      <div className='px-4'>
      {
        visibleTags.map(tag => {
          const selected = tag.name === currentTag
          return <TagItemMini key={tag.name} tag={tag} selected={selected} />
        })
      }
      </div>
    </div>
  )
}

export default TagGroups
