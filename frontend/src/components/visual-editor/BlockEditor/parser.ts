/**
 * Markdown 块解析器
 * 
 * 将 Markdown 文本解析为块结构
 */

import type { Block, BlockType } from './types';

let blockIdCounter = 0;

function generateBlockId(): string {
    return `block-${++blockIdCounter}-${Date.now()}`;
}

/**
 * 解析 Markdown 为块数组
 */
export function parseMarkdownToBlocks(markdown: string): Block[] {
    const blocks: Block[] = [];
    const lines = markdown.split('\n');

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // 空行跳过
        if (!line.trim()) {
            i++;
            continue;
        }

        // 代码块 ```
        if (line.startsWith('```')) {
            const language = line.slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // 跳过结束的 ```

            // Phase 4.1: atlas-data 数据块
            // 支持: atlas-data（推荐）, yaml（向后兼容）
            if (language === 'atlas-data' || language === 'yaml' || language.startsWith('yaml:')) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'data',
                    content: codeLines.join('\n'),
                    language: 'atlas-data', // 统一使用 atlas-data
                });
            } else if (language === 'file') {
                // 文件块
                const fileRef = parseFileBlockContent(codeLines.join('\n'));
                blocks.push({
                    id: generateBlockId(),
                    type: 'file',
                    content: codeLines.join('\n'),
                    fileRef,
                });
            } else {
                blocks.push({
                    id: generateBlockId(),
                    type: 'code',
                    content: codeLines.join('\n'),
                    language: language || 'text',
                });
            }
            continue;
        }

        // 标题
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const type: BlockType = level === 1 ? 'heading1' : level === 2 ? 'heading2' : 'heading3';
            blocks.push({
                id: generateBlockId(),
                type,
                content: headingMatch[2],
            });
            i++;
            continue;
        }

        // 分隔线
        if (/^[-*]{3,}\s*$/.test(line)) {
            blocks.push({
                id: generateBlockId(),
                type: 'divider',
                content: '',
            });
            i++;
            continue;
        }

        // 引用
        if (line.startsWith('>')) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].startsWith('>')) {
                quoteLines.push(lines[i].slice(1).trim());
                i++;
            }
            blocks.push({
                id: generateBlockId(),
                type: 'quote',
                content: quoteLines.join('\n'),
            });
            continue;
        }

        // 列表
        if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) {
            const listItems: string[] = [];
            while (i < lines.length && /^(\s*)([-*]|\d+\.)\s+/.test(lines[i])) {
                const itemMatch = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
                if (itemMatch) {
                    listItems.push(itemMatch[3]);
                }
                i++;
            }
            blocks.push({
                id: generateBlockId(),
                type: 'list',
                content: listItems.join('\n'),
                items: listItems,
            });
            continue;
        }

        // 普通段落
        const paragraphLines: string[] = [];
        while (i < lines.length && lines[i].trim() && !isSpecialLine(lines[i])) {
            paragraphLines.push(lines[i]);
            i++;
        }
        if (paragraphLines.length > 0) {
            blocks.push({
                id: generateBlockId(),
                type: 'paragraph',
                content: paragraphLines.join('\n'),
            });
        }
    }

    return blocks;
}

/**
 * 判断是否是特殊行（需要单独处理的行）
 */
function isSpecialLine(line: string): boolean {
    return (
        line.startsWith('#') ||
        line.startsWith('```') ||
        line.startsWith('>') ||
        /^[-*]{3,}\s*$/.test(line) ||
        /^(\s*)([-*]|\d+\.)\s+/.test(line)
    );
}

/**
 * 解析文件块内容
 */
function parseFileBlockContent(content: string): Block['fileRef'] {
    const lines = content.split('\n');
    const ref: NonNullable<Block['fileRef']> = {
        path: '',
        name: '',
    };

    for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();

        if (key && value) {
            switch (key.trim()) {
                case 'path':
                    ref.path = value;
                    break;
                case 'name':
                    ref.name = value;
                    break;
                case 'size':
                    ref.size = parseInt(value, 10) || undefined;
                    break;
                case 'mimeType':
                    ref.mimeType = value;
                    break;
                case 'extension':
                    ref.extension = value;
                    break;
            }
        }
    }

    return ref.path ? ref : undefined;
}

/**
 * 序列化文件引用为块内容
 */
function serializeFileRef(fileRef: NonNullable<Block['fileRef']>): string {
    const lines: string[] = [];
    lines.push(`path: ${fileRef.path}`);
    lines.push(`name: ${fileRef.name}`);
    if (fileRef.size !== undefined) lines.push(`size: ${fileRef.size}`);
    if (fileRef.mimeType) lines.push(`mimeType: ${fileRef.mimeType}`);
    if (fileRef.extension) lines.push(`extension: ${fileRef.extension}`);
    return lines.join('\n');
}

/**
 * 将块数组序列化为 Markdown
 */
export function blocksToMarkdown(blocks: Block[]): string {
    return blocks.map(block => {
        switch (block.type) {
            case 'heading1':
                return `# ${block.content}`;
            case 'heading2':
                return `## ${block.content}`;
            case 'heading3':
                return `### ${block.content}`;
            case 'paragraph':
                return block.content;
            case 'code':
                return `\`\`\`${block.language || ''}\n${block.content}\n\`\`\``;
            case 'data':
                // Phase 4.1: 统一使用 atlas-data 标识
                return `\`\`\`atlas-data\n${block.content}\n\`\`\``;
            case 'file':
                if (block.fileRef) {
                    return `\`\`\`file\n${serializeFileRef(block.fileRef)}\n\`\`\``;
                }
                return '';
            case 'quote':
                return block.content.split('\n').map(line => `> ${line}`).join('\n');
            case 'list':
                return (block.items || block.content.split('\n')).map(item => `- ${item}`).join('\n');
            case 'divider':
                return '---';
            default:
                return block.content;
        }
    }).join('\n\n');
}

