import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'

export function Settings() {
  usePageTitle('设置', '系统配置和偏好设置')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">功能开发中</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">设置功能正在开发中。</p>
        </CardContent>
      </Card>
    </div>
  )
}
