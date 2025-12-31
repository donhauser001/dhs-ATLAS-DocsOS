# ATLAS Docs OS

> A Git-Native, Document-Driven Operating System for Design Business

## 系统概述

ATLAS Docs OS 是一个以 Git 为事实源、以文档为数据结构、以 Command 为操作核心的设计公司业务管理系统。

### 核心理念

- **文档即数据** — 所有业务数据以 Markdown + YAML 形式存储
- **目录即结构** — 项目是目录，不是数据库里的一行
- **提交即版本** — 每次保存是一次 Git commit，历史天然存在
- **Command 即能力** — 人和 AI 通过同一套 Command 操作系统

### AI 原生设计

> **铁律：如果人能操作但 AI 不能操作，该功能视为失败。**

## 项目结构

```
dhs-ATLAS-DocsOS/
├── backend/                     # Git Service + Command Engine
│   ├── src/
│   │   ├── api/                 # HTTP API
│   │   ├── commands/            # Command 定义与执行
│   │   ├── state-machine/       # 状态机引擎
│   │   ├── git/                 # Git 操作封装
│   │   └── services/            # 业务服务
│   └── package.json
│
├── repository/                  # 数据仓库（Git repo）
│   ├── workspace/               # 系统配置
│   │   ├── commands/            # Command 定义文件
│   │   ├── 状态机/              # 状态机定义文件
│   │   └── auth/                # 用户数据
│   └── projects/                # 项目数据
│
├── docker-compose.yml           # Docker 部署配置
└── ATLAS-DocsOS-系统设计文档.md  # 系统设计文档
```

## 快速开始

### 开发环境

```bash
# 1. 进入 backend 目录
cd backend

# 2. 安装依赖
npm install

# 3. 初始化数据仓库
cd ../repository
git init

# 4. 启动开发服务器
cd ../backend
npm run dev
```

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止
docker-compose down
```

## API 接口

### Command API（核心）

```bash
# 获取所有 Command 定义（AI 能力发现）
curl http://localhost:3000/api/commands

# 执行 Command
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "project.create",
    "params": {
      "name": "品牌设计项目",
      "client": "某某公司",
      "type": "branding",
      "manager": "zhangsan"
    },
    "operator": {
      "type": "human",
      "id": "zhangsan"
    }
  }'
```

### 查询 API

```bash
# 获取项目列表
curl http://localhost:3000/api/projects

# 获取项目详情
curl http://localhost:3000/api/projects/P-2025-0001

# 获取任务列表
curl http://localhost:3000/api/projects/P-2025-0001/tasks
```

## 可用 Command

| Command | 说明 |
|---------|------|
| `project.create` | 创建项目 |
| `project.update` | 更新项目 |
| `project.list` | 获取项目列表 |
| `project.get` | 获取项目详情 |
| `task.create` | 创建任务 |
| `task.update` | 更新任务 |
| `task.transition` | 任务状态流转 |
| `task.list` | 获取任务列表 |
| `task.get` | 获取任务详情 |

## 技术栈

- **Backend**: Node.js + Express + TypeScript
- **Git**: simple-git
- **数据格式**: YAML + Markdown
- **状态机**: 自定义引擎
- **部署**: Docker

## 开发状态

- [x] 核心基础设施
- [x] Command 执行引擎
- [x] 状态机引擎
- [x] 项目 Command
- [x] 任务 Command
- [ ] 前端 UI（React + shadcn/ui）
- [ ] 提案管理
- [ ] 合同管理
- [ ] 财务管理

