import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileUpload } from '@/components/ui/file-upload'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getUsers } from '@/api/auth'
import { getCompanyInfo, updateCompanyInfo, type CompanyInfo } from '@/api/organization'
import { cn } from '@/lib/utils'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Pencil,
  Save,
  Loader2,
  CreditCard,
  User as UserIcon,
  Landmark,
  Receipt,
  Truck,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'

const emptyCompanyInfo: CompanyInfo = {
  full_name: '',
  short_name: '',
  logo: '',
  description: '',
  credit_code: '',
  business_license_file: '',
  bank_name: '',
  bank_account: '',
  bank_permit_number: '',
  bank_permit_file: '',
  legal_person_name: '',
  legal_person_phone: '',
  legal_person_id: '',
  legal_person_id_file: '',
  contact_employee_id: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  registered_address: '',
  delivery_address: '',
  invoice_title: '',
  invoice_tax_number: '',
  invoice_bank_name: '',
  invoice_bank_account: '',
  invoice_address: '',
  invoice_phone: '',
}

type TabType = 'basic' | 'documents' | 'address' | 'invoice'

export function CompanyProfile() {
  usePageTitle('企业资料', '企业基本信息与证件管理')
  
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<CompanyInfo>(emptyCompanyInfo)
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [showSensitive, setShowSensitive] = useState(false)

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await getCompanyInfo()
      if (!response.success) throw new Error(response.error?.message || '获取企业资料失败')
      return response.data!
    },
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await getUsers()
      if (!response.success) throw new Error('获取员工列表失败')
      return response
    },
  })

  const employees = usersData?.users || []

  const updateMutation = useMutation({
    mutationFn: updateCompanyInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] })
      setIsEditing(false)
    },
    onError: (error: Error) => {
      alert('保存失败: ' + error.message)
    },
  })

  useEffect(() => {
    if (companyData) {
      setForm(companyData)
    }
  }, [companyData])

  const handleContactChange = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId)
    if (employee) {
      setForm({
        ...form,
        contact_employee_id: employeeId,
        contact_name: employee.name,
        contact_phone: employee.phone || '',
        contact_email: employee.email,
      })
    } else {
      setForm({
        ...form,
        contact_employee_id: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
      })
    }
  }

  const syncInvoiceInfo = () => {
    setForm({
      ...form,
      invoice_title: form.full_name,
      invoice_tax_number: form.credit_code,
      invoice_address: form.registered_address,
      invoice_phone: form.contact_phone,
      invoice_bank_name: form.bank_name,
      invoice_bank_account: form.bank_account,
    })
  }

  const handleSave = () => updateMutation.mutate(form)
  const handleCancel = () => {
    if (companyData) setForm(companyData)
    setIsEditing(false)
  }

  // 计算完成度
  const getCompletionStatus = () => {
    const required = [form.full_name, form.credit_code, form.contact_name]
    const optional = [
      form.description, form.bank_name, form.bank_account,
      form.legal_person_name, form.registered_address, form.invoice_title
    ]
    const requiredDone = required.filter(Boolean).length
    const optionalDone = optional.filter(Boolean).length
    return {
      required: requiredDone,
      requiredTotal: required.length,
      optional: optionalDone,
      optionalTotal: optional.length,
      percent: Math.round(((requiredDone + optionalDone) / (required.length + optional.length)) * 100)
    }
  }

  const completion = getCompletionStatus()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'basic', label: '基本信息', icon: <Building2 className="h-4 w-4" /> },
    { key: 'documents', label: '证件资料', icon: <FileText className="h-4 w-4" /> },
    { key: 'address', label: '地址信息', icon: <MapPin className="h-4 w-4" /> },
    { key: 'invoice', label: '开票资料', icon: <Receipt className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* 企业头部卡片 */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo 区域 */}
              <div className="flex-shrink-0">
                {isEditing ? (
                  <div className="w-32">
                    <FileUpload
                      category="organization-logo"
                      value={form.logo}
                      onChange={(path) => setForm({ ...form, logo: path || '' })}
                      accept="image/*"
                      maxSizeMB={2}
                      hint="企业 Logo"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-background border-2 border-border flex items-center justify-center overflow-hidden shadow-sm">
                    {form.logo ? (
                      <img 
                        src={form.logo.startsWith('http') ? form.logo : `/api/files/${form.logo}`} 
                        alt={form.full_name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>

              {/* 企业信息 */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">企业全称 *</label>
                        <Input
                          value={form.full_name}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                          placeholder="输入企业全称"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">企业简称</label>
                        <Input
                          value={form.short_name}
                          onChange={(e) => setForm({ ...form, short_name: e.target.value })}
                          placeholder="输入企业简称"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">企业简介</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="简要介绍企业的主营业务..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-sm resize-none transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                          {form.full_name || '未设置企业名称'}
                        </h1>
                        {form.short_name && (
                          <p className="text-muted-foreground mt-1">{form.short_name}</p>
                        )}
                      </div>
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        编辑
                      </Button>
                    </div>
                    {form.description && (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {form.description}
                      </p>
                    )}
                    
                    {/* 快捷信息 */}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      {form.credit_code && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          <span className="font-mono">{form.credit_code}</span>
                        </div>
                      )}
                      {form.contact_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserIcon className="h-4 w-4" />
                          <span>{form.contact_name}</span>
                        </div>
                      )}
                      {form.contact_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{form.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 完成度指示器 */}
              {!isEditing && (
                <div className="flex-shrink-0 hidden lg:block">
                  <div className="w-32 text-center">
                    <div className="relative w-20 h-20 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="40" cy="40" r="36"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-muted/20"
                        />
                        <circle
                          cx="40" cy="40" r="36"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeDasharray={`${completion.percent * 2.26} 226`}
                          strokeLinecap="round"
                          className="text-primary transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold">{completion.percent}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">资料完成度</p>
                  </div>
                </div>
              )}
            </div>

            {/* 编辑模式下的操作按钮 */}
            {isEditing && (
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button variant="ghost" onClick={handleCancel} disabled={updateMutation.isPending}>
                  取消
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  保存更改
                </Button>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* 详细信息区域 */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* 左侧导航 */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors',
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <ChevronRight className={cn(
                    'h-4 w-4 ml-auto transition-transform',
                    activeTab === tab.key && 'rotate-90'
                  )} />
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* 右侧内容 */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            {/* 基本信息 */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="工商信息" 
                  description="企业工商登记的基本信息"
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <FieldDisplay
                    label="统一社会信用代码"
                    value={form.credit_code}
                    icon={<CreditCard className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, credit_code: v })}
                    placeholder="18位统一社会信用代码"
                    mono
                  />
                  <FieldDisplay
                    label="开户银行"
                    value={form.bank_name}
                    icon={<Landmark className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, bank_name: v })}
                    placeholder="如：中国银行北京支行"
                  />
                  <FieldDisplay
                    label="银行账号"
                    value={form.bank_account}
                    icon={<CreditCard className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, bank_account: v })}
                    placeholder="对公账户账号"
                    mono
                  />
                  <FieldDisplay
                    label="开户许可证编号"
                    value={form.bank_permit_number}
                    icon={<FileText className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, bank_permit_number: v })}
                    placeholder="开户许可证编号"
                  />
                </div>

                <Separator />

                <SectionHeader 
                  title="法人代表" 
                  description="企业法定代表人信息"
                  action={
                    !isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSensitive(!showSensitive)}
                      >
                        {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )
                  }
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <FieldDisplay
                    label="法人姓名"
                    value={form.legal_person_name}
                    icon={<UserIcon className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, legal_person_name: v })}
                    placeholder="法人代表姓名"
                  />
                  <FieldDisplay
                    label="联系电话"
                    value={form.legal_person_phone}
                    icon={<Phone className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, legal_person_phone: v })}
                    placeholder="法人代表电话"
                    sensitive={!showSensitive}
                  />
                  <FieldDisplay
                    label="身份证号码"
                    value={form.legal_person_id}
                    icon={<CreditCard className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, legal_person_id: v })}
                    placeholder="18位身份证号码"
                    sensitive={!showSensitive}
                    mono
                  />
                </div>

                <Separator />

                <SectionHeader 
                  title="企业联系人" 
                  description="日常业务联系人"
                />
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">选择联系人</label>
                      <select
                        value={form.contact_employee_id}
                        onChange={(e) => handleContactChange(e.target.value)}
                        className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">请选择联系人</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} - {emp.department || '未分配部门'}
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.contact_employee_id && (
                      <div className="p-4 rounded-2xl bg-muted/50 grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{form.contact_phone || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{form.contact_email || '-'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-3">
                    <FieldDisplay
                      label="联系人"
                      value={form.contact_name}
                      icon={<UserIcon className="h-4 w-4" />}
                    />
                    <FieldDisplay
                      label="电话"
                      value={form.contact_phone}
                      icon={<Phone className="h-4 w-4" />}
                    />
                    <FieldDisplay
                      label="邮箱"
                      value={form.contact_email}
                      icon={<Mail className="h-4 w-4" />}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 证件资料 */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="证件资料" 
                  description="上传企业相关证件的扫描件或照片"
                />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <DocumentCard
                    title="营业执照"
                    description="企业营业执照正本或副本"
                    value={form.business_license_file}
                    category="organization-business-license"
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, business_license_file: v })}
                  />
                  <DocumentCard
                    title="开户许可证"
                    description="银行开户许可证"
                    value={form.bank_permit_file}
                    category="organization-bank-permit"
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, bank_permit_file: v })}
                  />
                  <DocumentCard
                    title="法人身份证"
                    description="法定代表人身份证正反面"
                    value={form.legal_person_id_file}
                    category="organization-legal-person-id"
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, legal_person_id_file: v })}
                  />
                </div>
              </div>
            )}

            {/* 地址信息 */}
            {activeTab === 'address' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="地址信息" 
                  description="企业注册地址和收件地址"
                />
                <div className="space-y-6">
                  <FieldDisplay
                    label="企业注册地址"
                    value={form.registered_address}
                    icon={<Building2 className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, registered_address: v })}
                    placeholder="营业执照上的注册地址"
                  />
                  <FieldDisplay
                    label="快递接收地址"
                    value={form.delivery_address}
                    icon={<Truck className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, delivery_address: v })}
                    placeholder="日常收发快递的地址"
                  />
                </div>
              </div>
            )}

            {/* 开票资料 */}
            {activeTab === 'invoice' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="开票资料" 
                  description="用于开具增值税发票的信息"
                  action={
                    isEditing && (
                      <Button variant="outline" size="sm" onClick={syncInvoiceInfo}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        同步企业信息
                      </Button>
                    )
                  }
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <FieldDisplay
                    label="开票名称"
                    value={form.invoice_title}
                    icon={<FileText className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, invoice_title: v })}
                    placeholder="通常与企业全称一致"
                  />
                  <FieldDisplay
                    label="纳税人识别号"
                    value={form.invoice_tax_number}
                    icon={<CreditCard className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, invoice_tax_number: v })}
                    placeholder="通常与统一社会信用代码一致"
                    mono
                  />
                  <FieldDisplay
                    label="开户银行"
                    value={form.invoice_bank_name}
                    icon={<Landmark className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, invoice_bank_name: v })}
                    placeholder="开票账户开户银行"
                  />
                  <FieldDisplay
                    label="银行账号"
                    value={form.invoice_bank_account}
                    icon={<CreditCard className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, invoice_bank_account: v })}
                    placeholder="开票账户银行账号"
                    mono
                  />
                  <FieldDisplay
                    label="开票地址"
                    value={form.invoice_address}
                    icon={<MapPin className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, invoice_address: v })}
                    placeholder="开票地址"
                  />
                  <FieldDisplay
                    label="开票电话"
                    value={form.invoice_phone}
                    icon={<Phone className="h-4 w-4" />}
                    isEditing={isEditing}
                    onChange={(v) => setForm({ ...form, invoice_phone: v })}
                    placeholder="开票联系电话"
                  />
                </div>
              </div>
            )}

            {/* 编辑模式底部按钮 */}
            {isEditing && (
              <div className="flex justify-end gap-2 mt-8 pt-6 border-t">
                <Button variant="ghost" onClick={handleCancel} disabled={updateMutation.isPending}>
                  取消
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  保存更改
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 区块标题
function SectionHeader({ 
  title, 
  description, 
  action 
}: { 
  title: string
  description?: string
  action?: React.ReactNode 
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// 字段显示/编辑组件
function FieldDisplay({
  label,
  value,
  icon,
  isEditing,
  onChange,
  placeholder,
  sensitive,
  mono,
}: {
  label: string
  value?: string
  icon?: React.ReactNode
  isEditing?: boolean
  onChange?: (value: string) => void
  placeholder?: string
  sensitive?: boolean
  mono?: boolean
}) {
  const displayValue = sensitive && value 
    ? value.slice(0, 4) + '****' + value.slice(-4) 
    : value

  if (isEditing && onChange) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {label}
        </label>
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(mono && 'font-mono')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </p>
      <p className={cn(
        'text-sm font-medium',
        mono && 'font-mono',
        !displayValue && 'text-muted-foreground'
      )}>
        {displayValue || '-'}
      </p>
    </div>
  )
}

// 文档卡片组件
function DocumentCard({
  title,
  description,
  value,
  category,
  isEditing,
  onChange,
}: {
  title: string
  description: string
  value: string
  category: string
  isEditing: boolean
  onChange: (value: string) => void
}) {
  const isImage = (path: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(path)
  const getPreviewUrl = (path: string) => path.startsWith('http') ? path : `/api/files/${path}`

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <FileUpload
          category={category}
          value={value}
          onChange={(path) => onChange(path || '')}
          accept="image/*,.pdf"
          maxSizeMB={10}
        />
      </div>
    )
  }

  return (
    <div className="group relative rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md">
      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
        {value ? (
          isImage(value) ? (
            <img
              src={getPreviewUrl(value)}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-2">PDF 文件</p>
            </div>
          )
        ) : (
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground mt-2">未上传</p>
          </div>
        )}
      </div>
      <div className="p-3 border-t">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          {value && (
            <Badge variant="green" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              已上传
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
