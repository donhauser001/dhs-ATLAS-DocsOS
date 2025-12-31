import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'

export function TaskList() {
  usePageTitle('任务管理', '跨项目的任务看板视图')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">功能开发中</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            全局任务看板功能正在开发中，请先通过项目详情页面查看任务。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
