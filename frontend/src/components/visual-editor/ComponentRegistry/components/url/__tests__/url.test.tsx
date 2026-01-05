/**
 * URL 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import { validateUrl, normalizeUrl } from '../Control';
import type { UrlComponentDefinition } from '../../../types';

describe('URL 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'url',
                id: 'test-id',
                label: '链接',
                placeholder: '请输入URL...',
                showPreview: false,
                openInNewTab: true,
                allowedProtocols: ['http', 'https'],
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('url');
            expect(meta.name).toBe('URL链接');
            expect(meta.icon).toBe('link');
        });
    });

    describe('validateUrl', () => {
        it('空URL应返回有效', () => {
            expect(validateUrl('')).toEqual({ valid: true });
        });

        it('有效的https URL应返回有效', () => {
            expect(validateUrl('https://example.com')).toEqual({ valid: true });
        });

        it('有效的http URL应返回有效', () => {
            expect(validateUrl('http://example.com')).toEqual({ valid: true });
        });

        it('无协议的域名应返回有效（可以自动补全）', () => {
            expect(validateUrl('example.com')).toEqual({ valid: true });
        });

        it('不支持的协议应返回无效', () => {
            const result = validateUrl('ftp://example.com');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('不支持的协议');
        });

        it('自定义允许的协议', () => {
            expect(validateUrl('ftp://example.com', ['ftp'])).toEqual({ valid: true });
        });

        it('完全无效的URL应返回无效', () => {
            const result = validateUrl('not a valid url at all !!!');
            expect(result.valid).toBe(false);
        });
    });

    describe('normalizeUrl', () => {
        it('空字符串应返回空字符串', () => {
            expect(normalizeUrl('')).toBe('');
        });

        it('已有https协议不应修改', () => {
            expect(normalizeUrl('https://example.com')).toBe('https://example.com');
        });

        it('已有http协议不应修改', () => {
            expect(normalizeUrl('http://example.com')).toBe('http://example.com');
        });

        it('无协议应添加https', () => {
            expect(normalizeUrl('example.com')).toBe('https://example.com');
        });

        it('www开头应添加https', () => {
            expect(normalizeUrl('www.example.com')).toBe('https://www.example.com');
        });
    });

    describe('Control', () => {
        const baseComponent: UrlComponentDefinition = {
            type: 'url',
            id: 'test',
            label: '测试链接',
            placeholder: '请输入URL...',
            openInNewTab: true,
        };

        it('应正确渲染输入框', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            expect(screen.getByPlaceholderText('请输入URL...')).toBeInTheDocument();
        });

        it('应显示当前值', () => {
            render(
                <Control
                    component={baseComponent}
                    value="https://example.com"
                    onChange={() => {}}
                />
            );

            expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
        });

        it('有效URL应显示打开按钮', () => {
            render(
                <Control
                    component={baseComponent}
                    value="https://example.com"
                    onChange={() => {}}
                />
            );

            expect(screen.getByTitle(/打开/)).toBeInTheDocument();
        });

        it('空值不应显示打开按钮', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            expect(screen.queryByTitle(/打开/)).not.toBeInTheDocument();
        });

        it('无效URL应显示错误信息', () => {
            render(
                <Control
                    component={{ ...baseComponent, allowedProtocols: ['https'] }}
                    value="ftp://example.com"
                    onChange={() => {}}
                />
            );

            expect(screen.getByText(/不支持的协议/)).toBeInTheDocument();
        });

        it('输入时应调用 onChange', () => {
            const handleChange = vi.fn();

            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={handleChange}
                />
            );

            const input = screen.getByPlaceholderText('请输入URL...');
            fireEvent.change(input, { target: { value: 'example.com' } });

            expect(handleChange).toHaveBeenCalledWith('example.com');
        });

        it('失焦时应自动补全协议', () => {
            const handleChange = vi.fn();

            render(
                <Control
                    component={baseComponent}
                    value="example.com"
                    onChange={handleChange}
                />
            );

            const input = screen.getByDisplayValue('example.com');
            fireEvent.blur(input);

            expect(handleChange).toHaveBeenCalledWith('https://example.com');
        });

        it('禁用状态应正确显示', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                    disabled
                />
            );

            expect(screen.getByPlaceholderText('请输入URL...')).toBeDisabled();
        });
    });

    describe('Configurator', () => {
        const baseFormData: UrlComponentDefinition = {
            type: 'url',
            id: 'test',
            label: '测试',
        };

        it('应渲染配置表单', () => {
            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={() => {}}
                />
            );

            expect(screen.getByText('占位文本')).toBeInTheDocument();
            expect(screen.getByText('在新标签页打开')).toBeInTheDocument();
            expect(screen.getByText('显示URL预览')).toBeInTheDocument();
        });

        it('修改选项应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const checkbox = screen.getByLabelText('显示URL预览');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});


