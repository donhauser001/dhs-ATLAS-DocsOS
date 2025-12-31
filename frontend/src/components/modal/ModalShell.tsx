import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { FormMeta } from './types'

// 宽度映射
const widthClasses: Record<NonNullable<FormMeta['width']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[90vw]',
}

export interface ModalShellProps {
  title: string
  width?: FormMeta['width']
  onClose: () => void
  children: ReactNode
}

export function ModalShell({ title, width = 'lg', onClose, children }: ModalShellProps) {
  const widthClass = widthClasses[width]

  // 点击遮罩关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <Card className={`w-full ${widthClass} mx-4 max-h-[90vh] overflow-hidden flex flex-col`}>
        <CardHeader className="flex flex-row items-center justify-between shrink-0">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto">{children}</CardContent>
      </Card>
    </div>
  )
}
