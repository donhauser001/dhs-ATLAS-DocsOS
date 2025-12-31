# ATLAS Runtime

**ADL 语言的运行环境**

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

## 项目结构

```
dhs-ATLAS-DocsOS/
├── docs/                    # 规范文档
│   ├── ADL Spec v1.0.md
│   ├── ATLAS-Document-Native-System.md
│   ├── 文档原生认知协作范式.md
│   └── 开发文档/
│       └── Phase-0-开发计划.md
├── backend/                 # ATLAS Runtime 后端
│   └── src/
│       └── adl/            # ADL 核心模块
├── frontend/                # ATLAS Runtime 前端
│   └── src/
│       └── pages/
│           └── genesis/    # Phase 0 Genesis 页面
└── repository/              # ADL 文档仓库
    └── genesis/            # Genesis 示例文档
```

---

## Phase 0 / Genesis

**目标**：让一份 ADL 文档完成「读取 → 显现 → 修改 → Proposal → 校验 → Commit」闭环。

详见 [Phase-0-开发计划.md](docs/开发文档/Phase-0-开发计划.md)

---

## 核心文档

- [ADL Spec v1.0](docs/ADL%20Spec%20v1.0.md) - ADL 语言规范
- [ATLAS Runtime](docs/ATLAS-Document-Native-System.md) - ATLAS 运行时规范
- [DNCC 范式](docs/文档原生认知协作范式.md) - 文档原生认知协作范式

---

## License

MIT
