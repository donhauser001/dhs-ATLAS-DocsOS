/**
 * Formula 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { FormulaComponentDefinition } from '../../../types';

describe('Formula 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'formula',
                id: 'test-id',
                label: '公式',
                formula: '',
                variables: {},
                errorValue: 'N/A',
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('formula');
            expect(meta.name).toBe('公式字段');
            expect(meta.icon).toBe('sigma');
        });
    });

    describe('Control', () => {
        const baseComponent: FormulaComponentDefinition = {
            type: 'formula',
            id: 'test',
            label: '测试',
        };

        it('应显示计算结果', () => {
            render(
                <Control
                    component={baseComponent}
                    value={42}
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('42')).toBeInTheDocument();
        });

        it('无值时应显示错误默认值', () => {
            const componentWithError: FormulaComponentDefinition = {
                ...baseComponent,
                errorValue: '计算失败',
            };

            render(
                <Control
                    component={componentWithError}
                    value={null}
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('计算失败')).toBeInTheDocument();
        });
    });

    describe('Configurator', () => {
        const baseFormData: FormulaComponentDefinition = {
            type: 'formula',
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

            expect(screen.getByText('公式')).toBeInTheDocument();
            expect(screen.getByText('错误时的默认值')).toBeInTheDocument();
        });

        it('修改公式应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const textarea = screen.getByPlaceholderText('sqrt(a^2 + b^2)');
            fireEvent.change(textarea, { target: { value: 'a + b' } });

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});


