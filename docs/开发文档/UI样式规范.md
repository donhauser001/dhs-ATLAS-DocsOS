# UI 样式规范

## 设计理念

ATLAS DocsOS 采用 **胶囊式设计语言**，整体风格现代、圆润、优雅，灵感来源于 Apple 设计系统。

## 圆角规范

### 圆角层级

| 圆角类型 | Tailwind 类 | 像素值 | 适用场景 |
|----------|-------------|--------|----------|
| **胶囊** | `rounded-full` | 9999px | 按钮、输入框、选择器、标签、列表项 |
| **大圆角** | `rounded-2xl` | 16px | 卡片、面板、弹窗、多行输入框 |
| **中圆角** | `rounded-xl` | 12px | 图标容器、小卡片 |
| **小圆角** | `rounded-lg` | 8px | 色块、小元素 |

### 应用示例

```tsx
// 胶囊式按钮
<Button className="rounded-full">提交</Button>

// 胶囊式输入框
<Input className="rounded-full" />

// 大圆角卡片
<Card className="rounded-2xl">...</Card>

// 中圆角图标容器
<div className="w-10 h-10 rounded-xl bg-primary/10">
  <Icon />
</div>
```

## 按钮样式

### 变体

| 变体 | 用途 | 样式 |
|------|------|------|
| `default` | 主要操作 | 深色背景 + 浅色文字 + 轻微阴影 |
| `secondary` | 次要操作 | 浅色背景 + 深色文字 |
| `outline` | 边框按钮 | 透明背景 + 边框 |
| `ghost` | 幽灵按钮 | 透明背景，hover 显示 |
| `destructive` | 危险操作 | 红色背景 |

### 尺寸

| 尺寸 | 类名 | 高度 | 内边距 |
|------|------|------|--------|
| `sm` | `size="sm"` | 36px | `px-4` |
| `default` | - | 40px | `px-5` |
| `lg` | `size="lg"` | 44px | `px-8` |
| `icon` | `size="icon"` | 40px | 正方形 |

### 代码示例

```tsx
// 主按钮
<Button>保存</Button>

// 次要按钮
<Button variant="secondary">取消</Button>

// 图标按钮
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>

// 危险操作
<Button variant="destructive">删除</Button>
```

## 表单元素

### 输入框 (Input)

```tsx
// 基础样式
className="h-10 rounded-full border border-input bg-background px-4 text-sm"

// 完整示例
<Input 
  placeholder="请输入..."
  className="rounded-full"
/>
```

### 下拉选择 (Select)

```tsx
// 原生 select 样式
className="h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm"

// 自定义箭头通过 CSS 实现
// 箭头位置: right 0.875rem center
```

### 多行输入 (Textarea)

```tsx
// 多行输入使用大圆角
className="rounded-2xl border border-input bg-background px-4 py-3 text-sm"

// 示例
<textarea 
  className="w-full min-h-[100px] rounded-2xl border border-input px-4 py-3"
/>
```

## 卡片与面板

### 卡片 (Card)

```tsx
// 基础卡片
<Card className="rounded-2xl border bg-card shadow-sm">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### 信息面板

```tsx
// 背景面板
<div className="p-4 rounded-2xl bg-muted/50">
  内容
</div>

// 带边框面板
<div className="p-4 rounded-2xl border bg-card">
  内容
</div>
```

## 列表与导航

### 列表项

```tsx
// 可点击列表项
<button className={cn(
  'w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm',
  'hover:bg-accent transition-colors',
  isActive && 'bg-accent'
)}>
  <Icon className="h-4 w-4" />
  <span>列表项</span>
</button>
```

### 侧边栏导航

```tsx
// 导航项
<NavLink className={cn(
  'flex items-center gap-2.5 rounded-full px-3 py-2',
  'text-[13px] font-medium transition-all',
  isActive 
    ? 'bg-primary text-primary-foreground' 
    : 'hover:bg-accent'
)}>
  <Icon className="h-4 w-4" />
  <span>导航项</span>
</NavLink>
```

## 图标容器

### 标准尺寸

| 尺寸 | 容器大小 | 图标大小 | 圆角 |
|------|----------|----------|------|
| 小 | `w-7 h-7` | `h-3.5 w-3.5` | `rounded-lg` |
| 中 | `w-9 h-9` | `h-4 w-4` | `rounded-xl` |
| 大 | `w-10 h-10` | `h-5 w-5` | `rounded-xl` |
| 特大 | `w-12 h-12` | `h-6 w-6` | `rounded-xl` |

### 代码示例

```tsx
// 带颜色的图标容器
<div 
  className="w-10 h-10 rounded-xl flex items-center justify-center"
  style={{ backgroundColor: category.color }}
>
  <DynamicIcon 
    name={category.icon} 
    className="h-5 w-5 text-white"
  />
</div>

// 浅色背景图标
<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
  <Icon className="h-5 w-5 text-primary" />
</div>
```

## 状态与反馈

### 错误提示

```tsx
// 胶囊式错误提示
<div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-full">
  {errorMessage}
</div>
```

### 成功提示

```tsx
<div className="text-sm text-green-600 bg-green-500/10 px-4 py-2 rounded-full">
  操作成功
</div>
```

### 徽章 (Badge)

```tsx
// 默认徽章（已是 rounded-full）
<Badge>标签</Badge>

// 状态徽章
<Badge variant="green">启用</Badge>
<Badge variant="gray">停用</Badge>
```

## 弹窗与下拉

### 弹窗 (Modal)

```tsx
// 弹窗容器使用大圆角
<Card className="rounded-2xl max-w-lg">
  <CardHeader>标题</CardHeader>
  <CardContent>内容</CardContent>
</Card>
```

### 下拉菜单

```tsx
// 下拉面板
<div className="rounded-xl border bg-popover shadow-lg p-1">
  <button className="w-full rounded-lg px-3 py-2 hover:bg-accent">
    菜单项
  </button>
</div>
```

## 滚动条

采用 Apple 风格滚动条：

```css
/* 默认隐藏，hover 显示 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
}

*:hover::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.2);
}
```

## 间距规范

### 容器内边距

| 场景 | 内边距 |
|------|--------|
| 卡片 | `p-4` 或 `p-6` |
| 弹窗 | `p-6` |
| 列表项 | `px-4 py-2.5` |
| 按钮 | `px-5 py-2` |
| 输入框 | `px-4 py-2` |

### 元素间距

| 场景 | 间距 |
|------|------|
| 表单字段 | `space-y-4` |
| 按钮组 | `gap-2` 或 `gap-3` |
| 图标与文字 | `gap-2` |
| 卡片网格 | `gap-4` 或 `gap-6` |

## 颜色使用

### 语义色

| 用途 | 变量 | 示例 |
|------|------|------|
| 主色 | `primary` | 主按钮、重要元素 |
| 次要 | `secondary` | 次要按钮、标签 |
| 背景 | `background` | 页面背景 |
| 卡片 | `card` | 卡片背景 |
| 边框 | `border` | 边框线 |
| 弱化 | `muted` | 禁用、次要信息 |
| 危险 | `destructive` | 删除、错误 |

### 透明度技巧

```tsx
// 10% 透明度背景
className="bg-primary/10"

// 20% 透明度背景
className="bg-destructive/20"

// HEX 透明度
style={{ backgroundColor: `${color}20` }} // 约 12% 透明度
```

## 动画与过渡

### 标准过渡

```tsx
// 颜色过渡
className="transition-colors"

// 所有属性过渡
className="transition-all"

// 阴影过渡
className="transition-shadow"
```

### 持续时间

- 快速交互: `duration-150`
- 标准过渡: `duration-200`
- 复杂动画: `duration-300`

## 完整组件示例

```tsx
// 服务卡片
<div className={cn(
  'group relative bg-card rounded-2xl border p-4',
  'transition-all duration-200',
  'hover:shadow-md hover:border-primary/20'
)}>
  {/* 分类色条 */}
  <div 
    className="absolute left-0 top-4 w-1 rounded-full transition-all duration-300"
    style={{ 
      backgroundColor: service.categoryColor,
      height: 'calc(1.25rem + 1rem)', // 名称+别名高度
    }}
  />
  
  {/* 内容 */}
  <div className="pl-4">
    <h3 className="font-semibold">{service.name}</h3>
    <p className="text-sm text-muted-foreground">{service.alias}</p>
    
    {/* 价格 */}
    <div className="mt-3 flex items-center gap-2">
      <Badge variant="secondary" className="rounded-full">
        {service.price}
      </Badge>
    </div>
  </div>
  
  {/* 操作按钮 */}
  <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
      <Edit className="h-4 w-4" />
    </Button>
  </div>
</div>
```

## 禁止事项

1. ❌ 使用 `rounded-md` 或 `rounded-lg` 替代 `rounded-full`（按钮、输入框）
2. ❌ 使用 `rounded-lg` 替代 `rounded-2xl`（卡片、面板）
3. ❌ 混用不同圆角风格
4. ❌ 使用非语义颜色（如直接写 `#xxx`）
5. ❌ 忽略 hover 和 focus 状态
6. ❌ 使用过小的点击区域（最小 32x32）

