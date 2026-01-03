# ATLAS Runtime

**ADL 语言的运行环境 —— 文档即系统**

---

## 范式三件套

```
DNCC（范式）    文档原生认知协作范式
    ↓
ADL（语言）     Atlas Document Language
    ↓
ATLAS（运行时） ADL 的运行环境
```

## 三句话定义

1. **ADL（Atlas Document Language）** 是一种描述「文档即系统」的语言。
2. **ATLAS** 是 ADL 的运行环境（Runtime），负责解析、执行与协作。
3. **任何正确实现 ADL 的运行环境，都是 ATLAS Runtime 的一种实现。**

---

## 快速启动

```bash
# 一键启动前后端
./start.sh

# 访问
# 前端: http://localhost:5173
# 后端: http://localhost:3000
```

---

## 开发进度

| 阶段 | 名称 | 状态 | 核心目标 |
|------|------|------|----------|
| Phase 0 | Genesis | ✅ 已完成 | 单文档闭环（读取→显现→修改→Proposal→Commit） |
| Phase 1 | 多文档工作空间 | ✅ 已完成 | Workspace 索引、ADL-Query、权限系统 |
| Phase 1.5 | 范式校正 | ✅ 已完成 | 路径边界硬化、概念澄清 |
| Phase 2 | 范式落地 | ✅ 已完成 | 安全强化、文档生命周期 |
| Phase 3.0 | 形态与语言收敛 | ✅ 已完成 | ADL v0.3 规范、Design Tokens、UI 三态 |
| Phase 3.1 | 用户体系 | ✅ 已完成 | Principal + Profile（一人多业务身份） |
| Phase 3.3 | 功能声明系统 | ✅ 已完成 | 文档声明功能身份，系统自动发现 |
| Phase 3.4 | 标签注册制 | ✅ 已完成 | 字段标签 + 图标统一管理 |
| Phase 3.5 | 固定键系统 | ✅ 已完成 | 自动补齐、固定键推断、智能编辑器 |
| Phase 3.6 | 场景化视图 | ✅ 已完成 | 基于 function 的动态视图选择 |
| Phase 3.7 | MD 编辑器优化 | ✅ 已完成 | CodeMirror 语法高亮、自动补齐、草稿保存 |

---

## 核心能力

### 🔧 ADL 文档系统
- ADL v0.3 语法规范
- Parser 解析器 + Schema 校验器
- Proposal 机制（所有修改通过提案）
- Git 原子提交
- 文档 Lint 校验

### 👥 用户体系
- **Principal** 登录主体（支持邮箱认证）
- **Profile** 业务档案（员工、客户联系人）
- 基于文档的认证系统
- Principal 索引与搜索

### 🎯 功能声明
- `atlas.function` 声明功能身份
- FunctionRegistry 自动扫描注册
- 动态侧边栏导航
- 动态渲染器选择

### 🏷️ 标签注册制
- 原始字段名 → 用户友好显示名
- 图标与颜色统一管理
- 敏感字段隐藏
- 分类管理

### ✨ 智能编辑器
- **固定键系统**：基于 function 推断必填字段
- **自动补齐**：字段名 + 值的智能建议
- **语义化 YAML 编辑**：分区渲染、类型推断
- **场景化视图**：不同 function 显示不同视图

### 🎨 Design Tokens
- 统一的颜色、图标、间距系统
- 从 `genesis/tokens.md` 文档加载
- Token 解析与 CSS 变量注入

---

## 项目结构

```
dhs-ATLAS-DocsOS/
├── docs/                        # 规范与开发文档
│   ├── ADL Spec v1.0.md         # ADL 语言规范
│   ├── ADL-Spec-v0.3.md         # ADL v0.3 规范
│   ├── ATLAS-Document-Native-System.md
│   ├── atlas-lifecycle.md       # 文档生命周期
│   ├── 文档原生认知协作范式.md
│   └── 开发文档/                 # 各阶段开发计划
│
├── backend/                     # ATLAS Runtime 后端
│   └── src/
│       ├── adl/                 # ADL 核心
│       │   ├── parser.ts        # 文档解析器
│       │   ├── executor.ts      # 执行器
│       │   ├── validator.ts     # 校验器
│       │   ├── schema-validator.ts
│       │   └── proposal-store.ts
│       ├── api/                 # API 路由
│       │   ├── adl.ts           # 文档 CRUD
│       │   ├── auth.ts          # 认证
│       │   ├── workspace.ts     # 工作空间
│       │   ├── tokens.ts        # Design Tokens
│       │   ├── labels.ts        # 标签管理
│       │   ├── principals.ts    # 用户主体
│       │   ├── profiles.ts      # 业务档案
│       │   ├── functions.ts     # 功能注册
│       │   ├── auto-complete.ts # 自动补齐
│       │   └── display-config.ts
│       ├── services/            # 业务服务
│       │   ├── function-registry.ts
│       │   ├── document-linter.ts
│       │   ├── label-config.ts
│       │   ├── fixed-keys.ts
│       │   ├── auto-complete.ts
│       │   ├── auth-service.ts
│       │   ├── principal-indexer.ts
│       │   └── workspace-service.ts
│       └── middleware/          # 中间件
│
├── frontend/                    # ATLAS Runtime 前端
│   └── src/
│       ├── components/          # UI 组件
│       │   ├── document/        # 文档显示
│       │   ├── editor/          # 编辑器
│       │   │   ├── smart-editor/    # 智能编辑器
│       │   │   └── semantic-yaml/   # 语义化 YAML
│       │   ├── views/           # 场景化视图
│       │   │   ├── principal/
│       │   │   ├── client/
│       │   │   ├── project/
│       │   │   └── note/
│       │   ├── nav/             # 导航组件
│       │   ├── labels/          # 标签显示
│       │   └── ui/              # 基础 UI
│       ├── pages/               # 页面
│       │   ├── genesis/         # Genesis 文档页
│       │   ├── workspace/       # 工作空间
│       │   ├── users/           # 用户管理
│       │   └── settings/        # 系统设置
│       ├── stores/              # 状态管理
│       └── registry/            # 注册表
│
├── repository/                  # ADL 文档仓库
│   ├── genesis/                 # 系统核心定义
│   │   └── tokens.md            # Design Tokens
│   ├── 联系人/                   # 用户与档案
│   │   ├── principals/          # 登录主体 (13个)
│   │   └── profiles/            # 业务档案
│   │       ├── employees.md     # 员工列表
│   │       └── client-contacts.md
│   ├── notes/                   # 笔记
│   └── .atlas/                  # 系统索引与配置
│
├── start.sh                     # 快速启动脚本
└── README.md
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui + Lucide Icons |
| 编辑器 | CodeMirror 6 (YAML/Markdown) |
| 状态 | Zustand |
| 后端 | Express + TypeScript |
| 解析 | unified + remark + js-yaml |
| 版本 | simple-git |

---

## 核心文档

### 规范文档

- [ADL Spec v1.0](docs/ADL%20Spec%20v1.0.md) - ADL 语言规范
- [ADL Spec v0.3](docs/ADL-Spec-v0.3.md) - ADL v0.3 详细规范
- [ATLAS Runtime](docs/ATLAS-Document-Native-System.md) - ATLAS 运行时规范
- [DNCC 范式](docs/文档原生认知协作范式.md) - 文档原生认知协作范式
- [文档生命周期](docs/atlas-lifecycle.md) - ATLAS 文档生命周期

### 开发文档

| 阶段 | 文档 |
|------|------|
| Phase 0 | [Genesis 开发计划](docs/开发文档/Phase-0-开发计划.md) |
| Phase 1 | [多文档工作空间](docs/开发文档/Phase-1-开发计划.md) |
| Phase 1.5 | [范式校正](docs/开发文档/Phase-1.5-范式校正.md) |
| Phase 2 | [范式落地](docs/开发文档/Phase-2-开发计划.md) |
| Phase 3.0 | [形态与语言收敛](docs/开发文档/Phase-3-开发计划.md) |
| Phase 3.1 | [用户体系](docs/开发文档/Phase-3.1-开发计划.md) |
| Phase 3.3 | [功能声明系统](docs/开发文档/Phase-3.3-功能声明系统.md) |
| Phase 3.4 | [标签注册制](docs/开发文档/Phase-3.4-标签注册制系统.md) |
| Phase 3.5 | [固定键系统](docs/开发文档/Phase-3.5-固定键系统.md) |
| Phase 3.6 | [场景化视图系统](docs/开发文档/Phase-3.6-场景化视图系统.md) |
| Phase 3.7 | [YAML 语义化编辑](docs/开发文档/Phase-3.7-YAML语义化编辑.md) |

---

## 哲学

> **系统只是显现工具，文档才是系统本身。**

```
传统系统              ATLAS
─────────────────────────────────────
代码定义业务逻辑       文档定义业务逻辑
改功能要改代码         改功能只改文档
系统是黑盒            系统是可读的文档
迁移要重写代码         文档可带走，换个显现层即可
```

---

## License

MIT
