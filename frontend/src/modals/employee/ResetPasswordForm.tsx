import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from 'lucide-react'
import type { FormProps } from '@/components/modal'
import type { User } from '@/stores/auth'

export interface ResetPasswordFormData {
  newPassword: string
}

interface ResetPasswordFormProps extends FormProps<ResetPasswordFormData> {
  user: User
}

export function ResetPasswordForm({ user, onSubmit, onCancel }: ResetPasswordFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setError('密码长度至少6位')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSubmit({ newPassword })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '重置失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        为用户 <strong>{user.name}</strong> 设置新密码
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium">新密码</label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="至少6位"
          required
          minLength={6}
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-full">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader className="h-4 w-4 animate-spin mr-2" />}
          重置
        </Button>
      </div>
    </form>
  )
}

