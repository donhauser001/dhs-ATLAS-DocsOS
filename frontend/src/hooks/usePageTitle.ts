import { useEffect } from 'react'
import { usePageStore } from '@/stores/page'

/**
 * 设置页面标题
 * 
 * @example
 * usePageTitle('项目列表')
 * usePageTitle('项目详情', '网站设计项目')
 */
export function usePageTitle(title: string, subtitle?: string) {
  const { setTitle, reset } = usePageStore()

  useEffect(() => {
    setTitle(title, subtitle)
    return () => reset()
  }, [title, subtitle, setTitle, reset])
}
