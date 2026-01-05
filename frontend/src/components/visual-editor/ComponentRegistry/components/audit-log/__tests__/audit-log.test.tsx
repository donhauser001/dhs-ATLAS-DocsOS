/**
 * AuditLog 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { AuditLogComponentDefinition } from '../../../types';

describe('AuditLog 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'audit-log',
                id: 'test-id',
                label: '变更历史',
                limit: 10,
                showUser: true,
                showDiff: false,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('audit-log');
            expect(meta.name).toBe('审计日志');
            expect(meta.icon).toBe('history');
        });
    });

    describe('Configurator', () => {
        const baseFormData: AuditLogComponentDefinition = {
            type: 'audit-log',
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

            expect(screen.getByText('显示数量')).toBeInTheDocument();
            expect(screen.getByText('显示操作用户')).toBeInTheDocument();
            expect(screen.getByText('显示变更差异')).toBeInTheDocument();
        });

        it('修改显示数量应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const limitInput = screen.getByRole('spinbutton');
            fireEvent.change(limitInput, { target: { value: '20' } });

            expect(handleUpdate).toHaveBeenCalled();
        });

        it('修改显示差异应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const checkbox = screen.getByLabelText('显示变更差异');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

