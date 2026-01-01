/**
 * ADL Parser 单元测试
 * 
 * Phase 3.0: 工程与可维护性
 * 
 * 测试覆盖：
 * - 基本解析
 * - 边界情况
 * - 错误处理
 * 
 * 注意：使用 vitest 运行测试
 * npx vitest run src/adl/__tests__/parser.test.ts
 */

// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { parseADL, parseBlocks as parseBlocksFromLines } from '../parser.js';

// 辅助函数：从字符串解析 blocks
function parseBlocks(content: string) {
  return parseBlocksFromLines(content.split('\n'), 0);
}

describe('ADL Parser', () => {
  // ============================================================
  // 基本解析测试
  // ============================================================
  
  describe('parseADL', () => {
    it('应该解析包含 frontmatter 和 blocks 的完整文档', () => {
      const content = `---
version: "1.0"
document_type: facts
created: 2025-01-01
author: test
---

# 测试文档

## 测试 Block {#test-block}

\`\`\`yaml
type: service
id: TEST-001
status: active
title: 测试服务
\`\`\`

这是 Block 的正文内容。
`;

      const result = parseADL(content, 'test.md');
      
      expect(result.frontmatter.version).toBe('1.0');
      expect(result.frontmatter.document_type).toBe('facts');
      expect(result.frontmatter.author).toBe('test');
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].anchor).toBe('test-block');
      expect(result.blocks[0].machine.type).toBe('service');
      expect(result.blocks[0].machine.id).toBe('TEST-001');
    });

    it('应该解析没有 frontmatter 的文档', () => {
      const content = `# 简单文档

## Block A {#block-a}

\`\`\`yaml
type: note
id: A
status: draft
title: Block A
\`\`\`
`;

      const result = parseADL(content, 'simple.md');
      
      expect(result.frontmatter).toEqual({});
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].anchor).toBe('block-a');
    });

    it('应该解析多个 blocks', () => {
      const content = `---
version: "1.0"
---

## Block 1 {#block-1}

\`\`\`yaml
type: service
id: 1
status: active
title: Service 1
\`\`\`

## Block 2 {#block-2}

\`\`\`yaml
type: category
id: 2
status: active
title: Category 2
\`\`\`

## Block 3 {#block-3}

\`\`\`yaml
type: contact
id: 3
status: draft
title: Contact 3
\`\`\`
`;

      const result = parseADL(content, 'multi.md');
      
      expect(result.blocks).toHaveLength(3);
      expect(result.blocks[0].anchor).toBe('block-1');
      expect(result.blocks[1].anchor).toBe('block-2');
      expect(result.blocks[2].anchor).toBe('block-3');
    });
  });

  // ============================================================
  // Block 解析测试
  // ============================================================
  
  describe('parseBlocks', () => {
    it('应该正确提取 heading 和 anchor', () => {
      const content = `## S-001 品牌VI设计 {#svc-S-001}

\`\`\`yaml
type: service
id: S-001
status: active
title: 品牌VI设计
\`\`\`
`;

      const blocks = parseBlocks(content);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].heading).toBe('S-001 品牌VI设计');
      expect(blocks[0].anchor).toBe('svc-S-001');
      expect(blocks[0].level).toBe(2);
    });

    it('应该支持不同级别的标题', () => {
      const content = `# Level 1 {#l1}

\`\`\`yaml
type: note
id: l1
status: active
title: Level 1
\`\`\`

### Level 3 {#l3}

\`\`\`yaml
type: note
id: l3
status: active
title: Level 3
\`\`\`

###### Level 6 {#l6}

\`\`\`yaml
type: note
id: l6
status: active
title: Level 6
\`\`\`
`;

      const blocks = parseBlocks(content);
      
      expect(blocks).toHaveLength(3);
      expect(blocks[0].level).toBe(1);
      expect(blocks[1].level).toBe(3);
      expect(blocks[2].level).toBe(6);
    });

    it('应该正确提取 body 内容', () => {
      const content = `## Test {#test}

\`\`\`yaml
type: note
id: test
status: active
title: Test
\`\`\`

这是第一段正文。

这是第二段正文，包含**加粗**和*斜体*。

- 列表项 1
- 列表项 2
`;

      const blocks = parseBlocks(content);
      
      expect(blocks[0].body).toContain('这是第一段正文');
      expect(blocks[0].body).toContain('列表项 1');
    });

    it('应该解析包含 $display 的 machine block', () => {
      const content = `## Service {#service}

\`\`\`yaml
type: service
id: S-001
status: active
title: Service
$display:
  color:
    token: color.brand.primary
  icon:
    token: icon.type.service
\`\`\`
`;

      const blocks = parseBlocks(content);
      
      expect(blocks[0].machine.$display).toBeDefined();
      expect(blocks[0].machine.$display).toHaveProperty('color');
      expect(blocks[0].machine.$display).toHaveProperty('icon');
    });

    it('应该忽略没有 anchor 的标题', () => {
      const content = `## 没有 anchor 的标题

这不是一个 Block。

## 有 Anchor {#has-anchor}

\`\`\`yaml
type: note
id: test
status: active
title: Test
\`\`\`
`;

      const blocks = parseBlocks(content);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].anchor).toBe('has-anchor');
    });
  });

  // ============================================================
  // 边界情况测试
  // ============================================================
  
  describe('边界情况', () => {
    it('应该处理空文档', () => {
      const result = parseADL('', 'empty.md');
      
      expect(result.frontmatter).toEqual({});
      expect(result.blocks).toHaveLength(0);
    });

    it('应该处理只有 frontmatter 的文档', () => {
      const content = `---
version: "1.0"
author: test
---
`;

      const result = parseADL(content, 'frontmatter-only.md');
      
      expect(result.frontmatter.version).toBe('1.0');
      expect(result.blocks).toHaveLength(0);
    });

    it('应该处理没有 YAML block 的 anchor 标题', () => {
      const content = `## 只有标题 {#only-heading}

这下面没有 YAML block。
`;

      const blocks = parseBlocks(content);
      
      // 应该创建一个空的 machine block
      expect(blocks).toHaveLength(1);
      expect(blocks[0].anchor).toBe('only-heading');
    });

    it('应该处理特殊字符的 anchor', () => {
      const content = `## Test {#test-123_abc}

\`\`\`yaml
type: note
id: test
status: active
title: Test
\`\`\`
`;

      const blocks = parseBlocks(content);
      
      expect(blocks[0].anchor).toBe('test-123_abc');
    });

    it('应该处理嵌套的 YAML 对象', () => {
      const content = `## Service {#service}

\`\`\`yaml
type: service
id: S-001
status: active
title: Service
price:
  base: 50000
  unit: 项目
  currency: CNY
refs:
  - target: "#ref-1"
  - target: "#ref-2"
\`\`\`
`;

      const blocks = parseBlocks(content);
      
      expect(blocks[0].machine.price).toEqual({
        base: 50000,
        unit: '项目',
        currency: 'CNY',
      });
      expect(blocks[0].machine.refs).toHaveLength(2);
    });
  });

  // ============================================================
  // 错误处理测试
  // ============================================================
  
  describe('错误处理', () => {
    it('应该处理无效的 YAML', () => {
      const content = `## Test {#test}

\`\`\`yaml
type: service
invalid yaml content
  - not properly formatted
\`\`\`
`;

      // 解析不应该抛出错误，而是返回空的 machine
      expect(() => parseBlocks(content)).not.toThrow();
    });

    it('应该处理不完整的 YAML block', () => {
      const content = `## Test {#test}

\`\`\`yaml
type: service
id: S-001
`;
      // 没有关闭的 ```

      const blocks = parseBlocks(content);
      
      // 应该尝试解析或返回空结果
      expect(blocks).toBeDefined();
    });
  });
});

// ============================================================
// Schema Validator 测试
// ============================================================

describe('Schema Validator', () => {
  // 导入在这里进行，以便测试模块是否正确导出
  const { validateBlock, validateDocument, REQUIRED_FIELDS } = require('../schema-validator.js');
  
  describe('validateBlock', () => {
    it('应该验证有效的 block', () => {
      const block = {
        anchor: 'test',
        heading: 'Test',
        level: 2,
        body: '',
        machine: {
          type: 'service',
          id: 'S-001',
          status: 'active',
          title: 'Test Service',
        },
      };
      
      const result = validateBlock(block);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测缺少必填字段', () => {
      const block = {
        anchor: 'test',
        heading: 'Test',
        level: 2,
        body: '',
        machine: {
          type: 'service',
          // 缺少 id, status, title
        },
      };
      
      const result = validateBlock(block);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'E001')).toBe(true);
    });

    it('应该检测无效的 status 值', () => {
      const block = {
        anchor: 'test',
        heading: 'Test',
        level: 2,
        body: '',
        machine: {
          type: 'service',
          id: 'S-001',
          status: 'invalid',
          title: 'Test',
        },
      };
      
      const result = validateBlock(block);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'E003')).toBe(true);
    });

    it('应该检测 $display 中的字面量颜色', () => {
      const block = {
        anchor: 'test',
        heading: 'Test',
        level: 2,
        body: '',
        machine: {
          type: 'service',
          id: 'S-001',
          status: 'active',
          title: 'Test',
          $display: {
            color: '#FF0000', // 字面量，应该报错
          },
        },
      };
      
      const result = validateBlock(block);
      
      expect(result.errors.some(e => e.code === 'E101')).toBe(true);
    });

    it('应该接受正确的 token 引用', () => {
      const block = {
        anchor: 'test',
        heading: 'Test',
        level: 2,
        body: '',
        machine: {
          type: 'service',
          id: 'S-001',
          status: 'active',
          title: 'Test',
          $display: {
            color: { token: 'color.brand.primary' },
            icon: { token: 'icon.type.service' },
          },
        },
      };
      
      const result = validateBlock(block);
      
      expect(result.errors.filter(e => e.code === 'E101')).toHaveLength(0);
    });
  });

  describe('validateDocument', () => {
    it('应该检测重复的 anchor', () => {
      const doc = {
        path: 'test.md',
        frontmatter: {},
        blocks: [
          {
            anchor: 'duplicate',
            heading: 'Block 1',
            level: 2,
            body: '',
            machine: {
              type: 'note',
              id: '1',
              status: 'active',
              title: 'Block 1',
            },
          },
          {
            anchor: 'duplicate', // 重复
            heading: 'Block 2',
            level: 2,
            body: '',
            machine: {
              type: 'note',
              id: '2',
              status: 'active',
              title: 'Block 2',
            },
          },
        ],
      };
      
      const result = validateDocument(doc);
      
      expect(result.errors.some(e => e.code === 'E004')).toBe(true);
    });

    it('应该检测同类型重复的 id', () => {
      const doc = {
        path: 'test.md',
        frontmatter: {},
        blocks: [
          {
            anchor: 'block-1',
            heading: 'Block 1',
            level: 2,
            body: '',
            machine: {
              type: 'service',
              id: 'S-001', // 同 id
              status: 'active',
              title: 'Service 1',
            },
          },
          {
            anchor: 'block-2',
            heading: 'Block 2',
            level: 2,
            body: '',
            machine: {
              type: 'service',
              id: 'S-001', // 重复
              status: 'active',
              title: 'Service 2',
            },
          },
        ],
      };
      
      const result = validateDocument(doc);
      
      expect(result.errors.some(e => e.code === 'E005')).toBe(true);
    });
  });
});

