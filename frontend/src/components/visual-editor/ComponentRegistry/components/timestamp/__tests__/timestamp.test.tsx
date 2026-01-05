/**
 * Timestamp 组件测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import { formatDate, getRelativeTime, parseDate } from '../Control';
import type { TimestampComponentDefinition } from '../../../types';

describe('Timestamp 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'timestamp',
                id: 'test-id',
                label: '创建时间',
                timestampType: 'created',
                format: 'YYYY-MM-DD HH:mm:ss',
                showRelative: false,
                autoUpdate: true,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('timestamp');
            expect(meta.name).toBe('时间戳');
            expect(meta.icon).toBe('clock');
            expect(meta.hasOptions).toBe(false);
        });
    });

    describe('formatDate', () => {
        it('应正确格式化完整日期时间', () => {
            const date = new Date(2026, 0, 5, 14, 32, 15); // 2026-01-05 14:32:15
            const result = formatDate(date, 'YYYY-MM-DD HH:mm:ss');
            expect(result).toBe('2026-01-05 14:32:15');
        });

        it('应正确格式化仅日期', () => {
            const date = new Date(2026, 0, 5, 14, 32, 15);
            const result = formatDate(date, 'YYYY-MM-DD');
            expect(result).toBe('2026-01-05');
        });

        it('应正确格式化仅时间', () => {
            const date = new Date(2026, 0, 5, 14, 32, 15);
            const result = formatDate(date, 'HH:mm:ss');
            expect(result).toBe('14:32:15');
        });

        it('应正确填充单位数月份和日期', () => {
            const date = new Date(2026, 0, 5, 9, 5, 3); // 单位数
            const result = formatDate(date, 'YYYY-MM-DD HH:mm:ss');
            expect(result).toBe('2026-01-05 09:05:03');
        });
    });

    describe('getRelativeTime', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 0, 5, 14, 0, 0));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('刚刚（小于60秒）', () => {
            const date = new Date(2026, 0, 5, 13, 59, 30);
            expect(getRelativeTime(date)).toBe('刚刚');
        });

        it('几分钟前', () => {
            const date = new Date(2026, 0, 5, 13, 55, 0);
            expect(getRelativeTime(date)).toBe('5 分钟前');
        });

        it('几小时前', () => {
            const date = new Date(2026, 0, 5, 11, 0, 0);
            expect(getRelativeTime(date)).toBe('3 小时前');
        });

        it('几天前', () => {
            const date = new Date(2026, 0, 2, 14, 0, 0);
            expect(getRelativeTime(date)).toBe('3 天前');
        });

        it('几个月前', () => {
            const date = new Date(2025, 10, 5, 14, 0, 0); // 2个月前
            expect(getRelativeTime(date)).toBe('2 个月前');
        });

        it('几年前', () => {
            const date = new Date(2024, 0, 5, 14, 0, 0);
            expect(getRelativeTime(date)).toBe('2 年前');
        });
    });

    describe('parseDate', () => {
        it('应解析 ISO 字符串', () => {
            const result = parseDate('2026-01-05T14:32:15.000Z');
            expect(result).toBeInstanceOf(Date);
        });

        it('应解析时间戳数字', () => {
            const timestamp = Date.now();
            const result = parseDate(timestamp);
            expect(result).toBeInstanceOf(Date);
        });

        it('空值应返回 null', () => {
            expect(parseDate(null)).toBeNull();
            expect(parseDate(undefined)).toBeNull();
            expect(parseDate('')).toBeNull();
        });

        it('无效日期应返回 null', () => {
            expect(parseDate('invalid')).toBeNull();
        });
    });

    describe('Control', () => {
        const baseComponent: TimestampComponentDefinition = {
            type: 'timestamp',
            id: 'test',
            label: '测试时间戳',
            timestampType: 'created',
            format: 'YYYY-MM-DD HH:mm:ss',
            showRelative: false,
        };

        it('已设置时间时应显示格式化日期', () => {
            render(
                <Control
                    component={baseComponent}
                    value="2026-01-05T14:32:15.000Z"
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('创建时间')).toBeInTheDocument();
            // 日期会根据时区显示，检查日期部分
            expect(screen.getByText(/2026-01-05/)).toBeInTheDocument();
        });

        it('未设置时间时应显示"未设置"', () => {
            render(
                <Control
                    component={baseComponent}
                    value={null}
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('未设置')).toBeInTheDocument();
        });

        it('updated 类型应显示更新按钮', () => {
            const updatedComponent: TimestampComponentDefinition = {
                ...baseComponent,
                timestampType: 'updated',
            };

            render(
                <Control
                    component={updatedComponent}
                    value="2026-01-05T14:32:15.000Z"
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('更新时间')).toBeInTheDocument();
            expect(screen.getByText('更新')).toBeInTheDocument();
        });

        it('created 类型不应显示更新按钮', () => {
            render(
                <Control
                    component={baseComponent}
                    value="2026-01-05T14:32:15.000Z"
                    onChange={() => {}}
                />
            );

            expect(screen.queryByText('更新')).not.toBeInTheDocument();
        });

        it('禁用状态不应显示更新按钮', () => {
            const updatedComponent: TimestampComponentDefinition = {
                ...baseComponent,
                timestampType: 'updated',
            };

            render(
                <Control
                    component={updatedComponent}
                    value="2026-01-05T14:32:15.000Z"
                    onChange={() => {}}
                    disabled
                />
            );

            expect(screen.queryByText('更新')).not.toBeInTheDocument();
        });

        it('点击更新按钮应调用 onChange', () => {
            const handleChange = vi.fn();
            const updatedComponent: TimestampComponentDefinition = {
                ...baseComponent,
                timestampType: 'updated',
            };

            render(
                <Control
                    component={updatedComponent}
                    value="2026-01-05T14:32:15.000Z"
                    onChange={handleChange}
                />
            );

            fireEvent.click(screen.getByText('更新'));
            expect(handleChange).toHaveBeenCalled();
        });

        it('showRelative 为 true 时应显示相对时间', () => {
            vi.useFakeTimers();
            // 设置当前时间为2026年1月5日15:00 UTC
            vi.setSystemTime(new Date('2026-01-05T15:00:00.000Z'));

            const relativeComponent: TimestampComponentDefinition = {
                ...baseComponent,
                showRelative: true,
            };

            render(
                <Control
                    component={relativeComponent}
                    // 设置时间戳为3小时前
                    value="2026-01-05T12:00:00.000Z"
                    onChange={() => {}}
                />
            );

            // 检查是否显示相对时间括号
            expect(screen.getByText(/\(/)).toBeInTheDocument();

            vi.useRealTimers();
        });
    });

    describe('Configurator', () => {
        const baseFormData: TimestampComponentDefinition = {
            type: 'timestamp',
            id: 'test',
            label: '测试',
            timestampType: 'created',
            format: 'YYYY-MM-DD HH:mm:ss',
        };

        it('应渲染配置表单', () => {
            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={() => {}}
                />
            );

            expect(screen.getByText('时间戳类型')).toBeInTheDocument();
            expect(screen.getByText('显示格式')).toBeInTheDocument();
            expect(screen.getByText('显示选项')).toBeInTheDocument();
        });

        it('应显示所有时间戳类型选项', () => {
            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={() => {}}
                />
            );

            expect(screen.getByText('创建时间')).toBeInTheDocument();
            expect(screen.getByText('更新时间')).toBeInTheDocument();
            expect(screen.getByText('自定义时间')).toBeInTheDocument();
        });

        it('修改类型应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const updatedRadio = screen.getByLabelText(/更新时间/);
            fireEvent.click(updatedRadio);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

