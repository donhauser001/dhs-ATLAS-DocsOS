import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useModal } from '@/components/modal'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
    getConfigs,
    deleteConfig,
    formatRatio,
    type ServiceConfig,
} from '@/api/config'
import {
    Plus,
    Search,
    Settings,
    Trash2,
    Loader,
    Pencil,
    Users,
    FileStack,
    UserCheck,
    UserMinus,
} from 'lucide-react'

export function ConfigList() {
    const queryClient = useQueryClient()
    const { openModal } = useModal()
    const [search, setSearch] = useState('')

    // 获取配置列表
    const { data: configsData, isLoading } = useQuery({
        queryKey: ['configs'],
        queryFn: async () => {
            const result = await getConfigs()
            if (!result.success) throw new Error(result.error?.message)
            return result.result
        },
    })

    const deleteConfigMutation = useMutation({
        mutationFn: (id: string) => deleteConfig(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['configs'] })
        },
    })

    const configs = configsData?.configs || []

    // 筛选配置
    const filteredConfigs = configs.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.id.toLowerCase().includes(search.toLowerCase())
    )

    const handleDeleteConfig = async (config: ServiceConfig) => {
        if (confirm(`确定要删除配置 "${config.name}" 吗？`)) {
            const result = await deleteConfigMutation.mutateAsync(config.id)
            if (!result.success) {
                alert(result.error?.message || '删除失败')
            }
        }
    }

    usePageTitle('附加配置', `管理服务的交付标准和绩效分配规则，共 ${configs.length} 项`)

    return (
        <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-end">
                <Button onClick={() => openModal('config.create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    新建配置
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="搜索配置..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Configs Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredConfigs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    {search ? '没有找到匹配的配置' : '暂无配置，点击右上角创建'}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredConfigs.map((config) => (
                        <ConfigCard
                            key={config.id}
                            config={config}
                            onEdit={() => openModal('config.edit', { config })}
                            onDelete={() => handleDeleteConfig(config)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// 配置卡片组件
function ConfigCard({
    config,
    onEdit,
    onDelete,
}: {
    config: ServiceConfig
    onEdit: () => void
    onDelete: () => void
}) {
    return (
        <Card className="group relative hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Settings className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{config.name}</CardTitle>
                            <code className="text-xs text-muted-foreground">{config.id}</code>
                        </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={onEdit}
                            className="p-1.5 rounded hover:bg-accent"
                            title="编辑"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                            title="删除"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 方案数量 */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50">
                    <div className="flex items-center gap-2 text-sm">
                        <FileStack className="h-4 w-4 text-muted-foreground" />
                        <span>方案数量</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">初稿 {config.draft_count}</Badge>
                        <Badge variant="outline">最多 {config.max_count}</Badge>
                    </div>
                </div>

                {/* 绩效提成 */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>绩效提成</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 rounded-full bg-blue-500/10 text-blue-600">
                            <UserCheck className="h-4 w-4" />
                            <span className="text-sm">主创</span>
                            <span className="ml-auto font-semibold">
                                {formatRatio(config.lead_ratio)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-full bg-green-500/10 text-green-600">
                            <UserMinus className="h-4 w-4" />
                            <span className="text-sm">助理</span>
                            <span className="ml-auto font-semibold">
                                {formatRatio(config.assistant_ratio)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 说明 */}
                {config.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {config.content}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
