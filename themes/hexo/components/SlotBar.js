import SmartLink from '@/components/SmartLink'
import { useGlobal } from '@/lib/global'

/**
 * 博客列表上方嵌入条
 * @param {*} props
 * @returns
 */
export default function SlotBar(props) {
  const { tag, category } = props
  const { tagOptions, categoryOptions } = useGlobal()
  const tagLabel = tagOptions?.find(item => item.name === tag)?.label || tag
  const categoryLabel = categoryOptions?.find(item => item.name === category)?.label || category

  if (tag) {
    return <div className="cursor-pointer px-3 py-2 mb-2 font-light hover:text-indigo-700 dark:hover:text-indigo-400 transform dark:text-white">
              <SmartLink key={tag} href={`/tag/${encodeURIComponent(tag)}`} passHref
                  className={'cursor-pointer inline-block rounded duration-200 mr-2 py-0.5 px-1 text-xl whitespace-nowrap '}>
                  <div className='font-light dark:text-gray-400 dark:hover:text-white'> #{tagLabel} </div>
              </SmartLink>
          </div>
  } else if (category) {
    return <div className="cursor-pointer text-lg px-5 py-1 mb-2 font-light hover:text-indigo-700 dark:hover:text-indigo-400 transform dark:text-white">
              <i className="mr-1 far fa-folder-open" />  {categoryLabel}
          </div>
  }
  return <></>
}
