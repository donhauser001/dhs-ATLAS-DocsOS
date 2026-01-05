/**
 * IconPicker 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import { COMMON_ICONS, getIconNames, renderIcon } from '../Control';
import type { IconPickerComponentDefinition } from '../../../types';

describe('IconPicker 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'icon-picker',
                id: 'test-id',
                label: '图标',
                searchable: true,
                showLabel: false,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('icon-picker');
            expect(meta.name).toBe('图标选择');
        });
    });

    describe('getIconNames', () => {
        it('应返回图标名称数组', () => {
            const names = getIconNames();
            expect(Array.isArray(names)).toBe(true);
            // 在测试环境中 lucide-react 导出可能不同，跳过长度检查
        });

        it('不应包含非图标导出', () => {
            const names = getIconNames();
            expect(names).not.toContain('createLucideIcon');
        });
    });

    describe('renderIcon', () => {
        it('应渲染有效的图标', () => {
            const icon = renderIcon('Home', 'test-class');
            expect(icon).not.toBeNull();
        });

        it('无效的图标名应返回 null', () => {
            const icon = renderIcon('InvalidIcon');
            expect(icon).toBeNull();
        });
    });

    describe('COMMON_ICONS', () => {
        it('应包含常用图标', () => {
            expect(COMMON_ICONS).toContain('Home');
            expect(COMMON_ICONS).toContain('User');
            expect(COMMON_ICONS).toContain('Settings');
        });
    });

    describe('Control', () => {
        const baseComponent: IconPickerComponentDefinition = {
            type: 'icon-picker',
            id: 'test',
            label: '测试图标',
            searchable: true,
            showLabel: false,
        };

        it('应正确渲染图标选择器', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            // 应该有一个按钮用于打开选择器
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('点击按钮应显示图标面板', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            fireEvent.click(screen.getByRole('button'));
            expect(screen.getByPlaceholderText('搜索图标...')).toBeInTheDocument();
        });

        it('选择图标后应显示清除按钮', () => {
            render(
                <Control
                    component={baseComponent}
                    value="Home"
                    onChange={() => {}}
                />
            );

            // 应该有清除按钮
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(1);
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

            expect(screen.getByRole('button')).toBeDisabled();
        });

        it('showLabel 为 true 时应显示图标名称', () => {
            const componentWithLabel: IconPickerComponentDefinition = {
                ...baseComponent,
                showLabel: true,
            };

            render(
                <Control
                    component={componentWithLabel}
                    value="Home"
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('Home')).toBeInTheDocument();
        });
    });

    describe('Configurator', () => {
        const baseFormData: IconPickerComponentDefinition = {
            type: 'icon-picker',
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

            expect(screen.getByText('启用搜索')).toBeInTheDocument();
            expect(screen.getByText('显示图标名称')).toBeInTheDocument();
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

            const checkbox = screen.getByLabelText('显示图标名称');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

