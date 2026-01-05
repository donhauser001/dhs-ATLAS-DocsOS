/**
 * LoginStats 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { LoginStatsComponentDefinition } from '../../../types';

describe('LoginStats 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'login-stats',
                id: 'test-id',
                label: '登录统计',
                showLastLogin: true,
                showLoginCount: true,
                showDevice: false,
                showIp: false,
                showHistory: false,
                historyLimit: 5,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('login-stats');
            expect(meta.name).toBe('登录统计');
            expect(meta.icon).toBe('log-in');
        });
    });

    describe('Configurator', () => {
        const baseFormData: LoginStatsComponentDefinition = {
            type: 'login-stats',
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

            expect(screen.getByText('关联用户ID字段')).toBeInTheDocument();
            expect(screen.getByText('显示内容')).toBeInTheDocument();
            expect(screen.getByText('最后登录时间')).toBeInTheDocument();
            expect(screen.getByText('登录次数')).toBeInTheDocument();
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

            const checkbox = screen.getByLabelText('IP地址');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

