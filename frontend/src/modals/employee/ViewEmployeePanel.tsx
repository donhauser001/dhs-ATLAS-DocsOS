import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Mail, Phone, Building, Briefcase, CreditCard, UserPlus } from 'lucide-react'
import type { User } from '@/stores/auth'
import type { FormProps } from '@/components/modal'

interface ViewEmployeePanelProps extends Omit<FormProps<void>, 'onSubmit'> {
  user: User
  onEdit?: () => void
}

function getRoleBadgeVariant(role: string) {
  const map: Record<string, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    member: 'secondary',
  }
  return map[role] || 'secondary'
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    admin: '管理员',
    member: '成员',
  }
  return map[role] || role
}

function getStatusVariant(status: string) {
  const map: Record<string, 'green' | 'gray' | 'orange'> = {
    active: 'green',
    inactive: 'gray',
    pending: 'orange',
  }
  return map[status] || 'gray'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    active: '正常',
    inactive: '禁用',
    pending: '待激活',
  }
  return map[status] || status
}

function maskIdCard(idCard: string) {
  if (idCard.length < 10) return idCard
  return idCard.slice(0, 6) + '****' + idCard.slice(-4)
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm truncate">{value || '-'}</p>
      </div>
    </div>
  )
}

export function ViewEmployeePanel({ user, onCancel, onEdit }: ViewEmployeePanelProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-medium">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            user.name[0]
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-muted-foreground">@{user.username}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
            <Badge variant={getStatusVariant(user.status)}>{getStatusLabel(user.status)}</Badge>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">联系信息</h3>
        <div className="grid gap-3">
          <InfoRow icon={<Mail className="h-4 w-4" />} label="邮箱" value={user.email} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="手机" value={user.phone} />
        </div>
      </div>

      {/* Work Info */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">工作信息</h3>
        <div className="grid gap-3">
          <InfoRow icon={<Building className="h-4 w-4" />} label="部门" value={user.department} />
          <InfoRow icon={<Briefcase className="h-4 w-4" />} label="职位" value={user.position} />
        </div>
      </div>

      {/* Personal Info */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">个人信息</h3>
        <div className="grid gap-3">
          <InfoRow icon={<CreditCard className="h-4 w-4" />} label="身份证" value={user.id_card ? maskIdCard(user.id_card) : undefined} />
          <InfoRow icon={<UserPlus className="h-4 w-4" />} label="紧急联系人" value={user.emergency_contact} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="紧急联系电话" value={user.emergency_phone} />
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">个人简介</h3>
          <p className="text-sm leading-relaxed">{user.bio}</p>
        </div>
      )}

      {/* Meta */}
      <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
        <p>创建时间: {new Date(user.created_at).toLocaleString()}</p>
        {user.last_login && <p>最后登录: {new Date(user.last_login).toLocaleString()}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          关闭
        </Button>
        {onEdit && (
          <Button onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            编辑
          </Button>
        )}
      </div>
    </div>
  )
}

