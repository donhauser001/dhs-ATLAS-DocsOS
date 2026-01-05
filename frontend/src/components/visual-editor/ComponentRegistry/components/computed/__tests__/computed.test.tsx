/**
 * Computed 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { ComputedComponentDefinition } from '../../../types';

describe('Computed 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'computed',
                id: 'test-id',
                label: '计算字段',
                expression: '',
                dependencies: [],
                decimals: 2,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('computed');
            expect(meta.name).toBe('计算字段');
            expect(meta.icon).toBe('calculator');
        });
    });

    describe('Control', () => {
        const baseComponent: ComputedComponentDefinition = {
            type: 'computed',
            id: 'test',
            label: '测试',
            decimals: 2,
        };

        it('应显示计算结果', () => {
            render(
                <Control
                    component={baseComponent}
                    value={100.5}
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('100.50')).toBeInTheDocument();
        });

        it('无值时应显示占位符', () => {
            render(
                <Control
                    component={baseComponent}
                    value={null}
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('-')).toBeInTheDocument();
        });

        it('应显示表达式', () => {
            const componentWithExpr: ComputedComponentDefinition = {
                ...baseComponent,
                expression: '{a} + {b}',
            };

            render(
                <Control
                    component={componentWithExpr}
                    value={10}
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('{a} + {b}')).toBeInTheDocument();
        });
    });

    describe('Configurator', () => {
        const baseFormData: ComputedComponentDefinition = {
            type: 'computed',
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

            expect(screen.getByText('计算表达式')).toBeInTheDocument();
            expect(screen.getByText('依赖字段')).toBeInTheDocument();
            expect(screen.getByText('小数位数')).toBeInTheDocument();
        });

        it('修改表达式应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const input = screen.getByPlaceholderText('{price} * {quantity}');
            fireEvent.change(input, { target: { value: '{a} + {b}' } });

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

