/**
 * Color 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta, DEFAULT_PRESETS } from '../config';
import { isValidColor, hexToRgb, rgbToHex } from '../Control';
import type { ColorComponentDefinition } from '../../../types';

describe('Color 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result.type).toBe('color');
            expect(result.id).toBe('test-id');
            expect(result.label).toBe('颜色');
            expect(result.format).toBe('hex');
            expect(result.presets).toEqual(DEFAULT_PRESETS);
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('color');
            expect(meta.name).toBe('颜色选择');
            expect(meta.icon).toBe('palette');
        });

        it('DEFAULT_PRESETS 应包含20种颜色', () => {
            expect(DEFAULT_PRESETS).toHaveLength(20);
        });
    });

    describe('isValidColor', () => {
        it('空字符串应返回 false', () => {
            expect(isValidColor('')).toBe(false);
        });

        it('有效的 HEX 颜色应返回 true', () => {
            expect(isValidColor('#fff')).toBe(true);
            expect(isValidColor('#ffffff')).toBe(true);
            expect(isValidColor('#FFFFFF')).toBe(true);
            expect(isValidColor('#3b82f6')).toBe(true);
        });

        it('有效的 RGBA 颜色应返回 true', () => {
            expect(isValidColor('rgb(255, 255, 255)')).toBe(true);
            expect(isValidColor('rgba(255, 255, 255, 0.5)')).toBe(true);
        });

        it('无效的颜色应返回 false', () => {
            expect(isValidColor('red')).toBe(false);
            expect(isValidColor('invalid')).toBe(false);
            expect(isValidColor('#gg0000')).toBe(false);
        });
    });

    describe('hexToRgb', () => {
        it('应正确转换 HEX 到 RGB', () => {
            expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
            expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
            expect(hexToRgb('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
        });

        it('无效的 HEX 应返回 null', () => {
            expect(hexToRgb('invalid')).toBeNull();
        });
    });

    describe('rgbToHex', () => {
        it('应正确转换 RGB 到 HEX', () => {
            expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
            expect(rgbToHex(0, 0, 0)).toBe('#000000');
            expect(rgbToHex(59, 130, 246)).toBe('#3b82f6');
        });

        it('应正确处理单位数值', () => {
            expect(rgbToHex(0, 0, 15)).toBe('#00000f');
        });
    });

    describe('Control', () => {
        const baseComponent: ColorComponentDefinition = {
            type: 'color',
            id: 'test',
            label: '测试颜色',
            showInput: true,
            presets: DEFAULT_PRESETS,
        };

        it('应正确渲染颜色选择器', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            expect(screen.getByPlaceholderText('#000000')).toBeInTheDocument();
        });

        it('应显示当前颜色值', () => {
            render(
                <Control
                    component={baseComponent}
                    value="#3b82f6"
                    onChange={() => {}}
                />
            );

            // 文本输入框和原生颜色选择器都有相同的值，使用 getAllBy
            const inputs = screen.getAllByDisplayValue('#3b82f6');
            expect(inputs.length).toBeGreaterThan(0);
        });

        it('输入有效颜色时应调用 onChange', () => {
            const handleChange = vi.fn();

            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={handleChange}
                />
            );

            const input = screen.getByPlaceholderText('#000000');
            fireEvent.change(input, { target: { value: '#ff0000' } });

            expect(handleChange).toHaveBeenCalledWith('#ff0000');
        });

        it('点击颜色预览应显示预设面板', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            // 点击颜色预览按钮
            const colorButtons = screen.getAllByRole('button');
            fireEvent.click(colorButtons[0]);

            expect(screen.getByText('预设颜色')).toBeInTheDocument();
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

            expect(screen.getByPlaceholderText('#000000')).toBeDisabled();
        });

        it('不显示输入框时应隐藏输入框', () => {
            const componentNoInput: ColorComponentDefinition = {
                ...baseComponent,
                showInput: false,
            };

            render(
                <Control
                    component={componentNoInput}
                    value="#3b82f6"
                    onChange={() => {}}
                />
            );

            expect(screen.queryByPlaceholderText('#000000')).not.toBeInTheDocument();
        });
    });

    describe('Configurator', () => {
        const baseFormData: ColorComponentDefinition = {
            type: 'color',
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

            expect(screen.getByText('显示颜色输入框')).toBeInTheDocument();
            expect(screen.getByText('允许透明度')).toBeInTheDocument();
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

            const checkbox = screen.getByLabelText('允许透明度');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

