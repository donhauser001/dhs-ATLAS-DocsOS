/**
 * UserPicker 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { UserPickerComponentDefinition } from '../../../types';

describe('UserPicker 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'user-picker',
                id: 'test-id',
                label: '负责人',
                multiple: false,
                showAvatar: true,
                statusFilter: 'verified',
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('user-picker');
            expect(meta.name).toBe('用户选择');
            expect(meta.icon).toBe('users');
        });
    });

    describe('Configurator', () => {
        const baseFormData: UserPickerComponentDefinition = {
            type: 'user-picker',
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

            expect(screen.getByText('允许多选')).toBeInTheDocument();
            expect(screen.getByText('显示头像')).toBeInTheDocument();
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

