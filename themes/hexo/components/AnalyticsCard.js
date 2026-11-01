import Card from './Card'
import { useGlobal } from '@/lib/global'

export function AnalyticsCard (props) {
  const { postCount } = props
  const { locale } = useGlobal()
  return <Card>
    <div className='ml-2 mb-3 '>
      <i className='fas fa-chart-area' /> {locale.COMMON.ANALYTICS}
    </div>
    <div className='text-xs  font-light justify-center mx-7'>
      <div className='inline'>
        <div className='flex justify-between'>
          <div>{locale.COMMON.ARTICLE}:</div>
          <div>{postCount}</div>
        </div>
      </div>
      <div className='hidden busuanzi_container_page_pv ml-2'>
        <div className='flex justify-between'>
          <div>{locale.COMMON.VIEWS}:</div>
          <div className='busuanzi_value_page_pv' />
        </div>
      </div>
      <div className='hidden busuanzi_container_site_uv ml-2'>
        <div className='flex justify-between'>
          <div>{locale.COMMON.VISITORS}:</div>
          <div className='busuanzi_value_site_uv' />
        </div>
      </div>
    </div>
  </Card>
}
