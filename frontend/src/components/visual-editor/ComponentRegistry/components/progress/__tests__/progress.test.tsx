/**
 * Progress 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import { parseProgress } from '../Control';
import type { ProgressComponentDefinition } from '../../../types';

describe('Progress 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'progress',
                id: 'test-id',
                label: '进度',
                editable: false,
                showLabel: true,
                color: '#8b5cf6',
                trackColor: '#e2e8f0',
                height: 8,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('progress');
            expect(meta.name).toBe('进度条');
        });
    });

    describe('parseProgress', () => {
        it('数字应正确解析', () => {
            expect(parseProgress(50)).toBe(50);
            expect(parseProgress(0)).toBe(0);
            expect(parseProgress(100)).toBe(100);
        });

        it('字符串应正确解析', () => {
            expect(parseProgress('75')).toBe(75);
            expect(parseProgress('50.5')).toBe(50.5);
        });

        it('超出范围应限制在 0-100', () => {
            expect(parseProgress(-10)).toBe(0);
            expect(parseProgress(150)).toBe(100);
        });

        it('无效值应返回 0', () => {
            expect(parseProgress(null)).toBe(0);
            expect(parseProgress(undefined)).toBe(0);
            expect(parseProgress('invalid')).toBe(0);
        });
    });

    describe('Control', () => {
        const baseComponent: ProgressComponentDefinition = {
            type: 'progress',
            id: 'test',
            label: '测试进度',
            editable: false,
            showLabel: true,
        };

        it('应正确显示进度百分比', () => {
            render(
                <Control
                    component={baseComponent}
                    value={75}
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('75%')).toBeInTheDocument();
        });

        it('editable 为 false 时不应显示滑块', () => {
            render(
                <Control
                    component={baseComponent}
                    value={50}
                    onChange={() => {}}
                />
            );

            expect(screen.queryByRole('slider')).not.toBeInTheDocument();
        });

        it('editable 为 true 时应显示滑块', () => {
            const editableComponent: ProgressComponentDefinition = {
                ...baseComponent,
                editable: true,
            };

            render(
                <Control
                    component={editableComponent}
                    value={50}
                    onChange={() => {}}
                />
            );

            expect(screen.getByRole('slider')).toBeInTheDocument();
        });

        it('拖动滑块应调用 onChange', () => {
            const handleChange = vi.fn();
            const editableComponent: ProgressComponentDefinition = {
                ...baseComponent,
                editable: true,
            };

            render(
                <Control
                    component={editableComponent}
                    value={50}
                    onChange={handleChange}
                />
            );

            const slider = screen.getByRole('slider');
            fireEvent.change(slider, { target: { value: '75' } });

            expect(handleChange).toHaveBeenCalledWith(75);
        });

        it('showLabel 为 false 时不应显示百分比', () => {
            const noLabelComponent: ProgressComponentDefinition = {
                ...baseComponent,
                showLabel: false,
            };

            render(
                <Control
                    component={noLabelComponent}
                    value={50}
                    onChange={() => {}}
                />
            );

            expect(screen.queryByText('50%')).not.toBeInTheDocument();
        });
    });

    describe('Configurator', () => {
        const baseFormData: ProgressComponentDefinition = {
            type: 'progress',
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

            expect(screen.getByText('允许编辑（显示滑块）')).toBeInTheDocument();
            expect(screen.getByText('显示百分比')).toBeInTheDocument();
            expect(screen.getByText('进度条颜色')).toBeInTheDocument();
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

            const checkbox = screen.getByLabelText('允许编辑（显示滑块）');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});


