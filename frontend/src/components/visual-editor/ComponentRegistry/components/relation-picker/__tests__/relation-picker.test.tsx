/**
 * RelationPicker 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { RelationPickerComponentDefinition } from '../../../types';

describe('RelationPicker 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'relation-picker',
                id: 'test-id',
                label: '关联记录',
                displayField: 'name',
                multiple: false,
                showDetails: false,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('relation-picker');
            expect(meta.name).toBe('关联选择');
        });
    });

    describe('Control', () => {
        const baseComponent: RelationPickerComponentDefinition = {
            type: 'relation-picker',
            id: 'test',
            label: '测试',
        };

        it('应显示选择按钮', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('选择关联...')).toBeInTheDocument();
        });

        it('有值时应显示已选项', () => {
            render(
                <Control
                    component={baseComponent}
                    value="test-value"
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('test-value')).toBeInTheDocument();
        });
    });

    describe('Configurator', () => {
        const baseFormData: RelationPickerComponentDefinition = {
            type: 'relation-picker',
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

            expect(screen.getByText('关联索引')).toBeInTheDocument();
            expect(screen.getByText('显示字段')).toBeInTheDocument();
            expect(screen.getByText('允许多选')).toBeInTheDocument();
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

            const checkbox = screen.getByLabelText('允许多选');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});


