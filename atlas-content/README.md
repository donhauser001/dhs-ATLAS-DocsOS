# ATLAS Content Directory

类似 WordPress 的 `wp-content` 目录，这是 ATLAS 系统的内容管理中心。

## 目录结构

```
atlas-content/
├── plugins/                    # 插件目录
│   ├── type-packages/          # 类型包 - 文档类型模板
│   ├── theme-packages/         # 主题包 - 界面主题样式
│   └── extensions/             # 扩展插件 - 功能扩展
├── themes/                     # 全局主题
├── assets/                     # 全局资产
│   ├── icons/                  # 图标资源
│   ├── fonts/                  # 字体文件
│   ├── images/                 # 图片资源
│   └── templates/              # 文档模板
└── cache/                      # 系统缓存
```

## 插件类型

### 类型包 (Type Package)

类型包定义文档类型，包含：
- 数据块定义 (blocks)
- 视图组件 (views)
- 默认配置
- 类型资产

### 主题包 (Theme Package)

主题包定义界面样式，包含：
- CSS 变量
- 组件样式
- 图标主题
- 配色方案

### 扩展插件 (Extension)

功能扩展，包含：
- API 集成
- 工具函数
- 自定义能力

## 清单文件 (manifest.json)

每个插件必须包含 `manifest.json` 文件，定义插件元数据和配置。

```json
{
  "id": "plugin-id",
  "name": "插件名称",
  "version": "1.0.0",
  "type": "type-package | theme-package | extension",
  "description": "插件描述",
  "author": {
    "name": "作者名",
    "email": "email@example.com",
    "url": "https://example.com"
  },
  "license": "MIT",
  "homepage": "https://example.com/plugin",
  "repository": "https://github.com/example/plugin",
  "keywords": ["keyword1", "keyword2"],
  "main": "index.js",
  "atlas": {
    "minVersion": "1.0.0",
    "maxVersion": "2.0.0"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

