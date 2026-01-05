/**
 * JSON 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import { validateJson, formatJson } from '../Control';
import type { JsonComponentDefinition } from '../../../types';

describe('JSON 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'json',
                id: 'test-id',
                label: 'JSON数据',
                minHeight: 150,
                maxHeight: 400,
                readOnly: false,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('json');
            expect(meta.name).toBe('JSON编辑');
            expect(meta.icon).toBe('braces');
        });
    });

    describe('validateJson', () => {
        it('空字符串应返回有效', () => {
            expect(validateJson('')).toEqual({ valid: true });
            expect(validateJson('  ')).toEqual({ valid: true });
        });

        it('有效 JSON 应返回有效', () => {
            expect(validateJson('{"a": 1}')).toEqual({ valid: true });
            expect(validateJson('[1, 2, 3]')).toEqual({ valid: true });
        });

        it('无效 JSON 应返回错误', () => {
            const result = validateJson('{invalid}');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('formatJson', () => {
        it('应格式化 JSON', () => {
            const result = formatJson('{"a":1,"b":2}');
            expect(result).toContain('\n');
        });

        it('无效 JSON 应返回原字符串', () => {
            const result = formatJson('{invalid}');
            expect(result).toBe('{invalid}');
        });
    });

    describe('Control', () => {
        const baseComponent: JsonComponentDefinition = {
            type: 'json',
            id: 'test',
            label: '测试',
        };

        it('应显示 JSON 标识', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('JSON')).toBeInTheDocument();
        });

        it('有效 JSON 应显示成功状态', () => {
            render(
                <Control
                    component={baseComponent}
                    value='{"test": true}'
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('JSON 格式正确')).toBeInTheDocument();
        });
    });

    describe('Configurator', () => {
        const baseFormData: JsonComponentDefinition = {
            type: 'json',
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

            expect(screen.getByText('最小高度 (px)')).toBeInTheDocument();
            expect(screen.getByText('只读模式')).toBeInTheDocument();
        });

        it('修改只读模式应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const checkbox = screen.getByLabelText('只读模式');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});


