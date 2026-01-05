/**
 * Password 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import { calculateStrength, generatePassword } from '../Control';
import type { PasswordComponentDefinition } from '../../../types';

describe('Password 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'password',
                id: 'test-id',
                label: '密码',
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumber: true,
                requireSpecial: false,
                showStrengthMeter: true,
                allowGenerate: true,
                generatedLength: 16,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('password');
            expect(meta.name).toBe('安全密码');
            expect(meta.icon).toBe('lock');
            expect(meta.hasOptions).toBe(false);
        });
    });

    describe('calculateStrength', () => {
        const defaultConfig: PasswordComponentDefinition = {
            type: 'password',
            id: 'test',
            label: '密码',
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecial: false,
        };

        it('空密码应返回弱强度', () => {
            const result = calculateStrength('', defaultConfig);
            expect(result.level).toBe('weak');
            expect(result.score).toBe(0);
        });

        it('短密码应返回弱强度', () => {
            const result = calculateStrength('abc', defaultConfig);
            expect(result.level).toBe('weak');
            expect(result.feedback).toContain('至少 8 个字符');
        });

        it('只有小写字母应提示需要其他字符', () => {
            const result = calculateStrength('abcdefgh', defaultConfig);
            expect(result.feedback).toContain('需要大写字母');
            expect(result.feedback).toContain('需要数字');
        });

        it('强密码应返回强强度', () => {
            const result = calculateStrength('Abc123!@#xyz', defaultConfig);
            expect(result.level).toBe('strong');
            expect(result.feedback).toHaveLength(0);
        });

        it('带特殊字符要求时应正确检测', () => {
            const configWithSpecial: PasswordComponentDefinition = {
                ...defaultConfig,
                requireSpecial: true,
            };
            const result = calculateStrength('Abc12345', configWithSpecial);
            expect(result.feedback).toContain('需要特殊字符');
        });
    });

    describe('generatePassword', () => {
        it('应生成指定长度的密码', () => {
            const password = generatePassword(16);
            expect(password.length).toBe(16);
        });

        it('应包含大写字母', () => {
            const password = generatePassword(20);
            expect(/[A-Z]/.test(password)).toBe(true);
        });

        it('应包含小写字母', () => {
            const password = generatePassword(20);
            expect(/[a-z]/.test(password)).toBe(true);
        });

        it('应包含数字', () => {
            const password = generatePassword(20);
            expect(/\d/.test(password)).toBe(true);
        });

        it('应包含特殊字符', () => {
            const password = generatePassword(20);
            expect(/[!@#$%^&*()_+\-=\[\]{};:,.<>?|]/.test(password)).toBe(true);
        });

        it('每次生成的密码应不同', () => {
            const password1 = generatePassword(16);
            const password2 = generatePassword(16);
            expect(password1).not.toBe(password2);
        });
    });

    describe('Control', () => {
        const baseComponent: PasswordComponentDefinition = {
            type: 'password',
            id: 'test',
            label: '测试密码',
            minLength: 8,
            showStrengthMeter: true,
            allowGenerate: true,
        };

        it('未设置密码时应显示输入表单', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            expect(screen.getByPlaceholderText('输入密码...')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('再次输入密码...')).toBeInTheDocument();
        });

        it('已设置密码时应显示"已设置"状态', () => {
            render(
                <Control
                    component={baseComponent}
                    value="$2a$10$somehashedpassword"
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('密码已设置')).toBeInTheDocument();
            expect(screen.getByText('重置密码')).toBeInTheDocument();
        });

        it('点击重置密码应显示输入表单', () => {
            render(
                <Control
                    component={baseComponent}
                    value="$2a$10$somehashedpassword"
                    onChange={() => {}}
                />
            );

            fireEvent.click(screen.getByText('重置密码'));
            expect(screen.getByPlaceholderText('输入密码...')).toBeInTheDocument();
        });

        it('禁用状态应正确显示', () => {
            render(
                <Control
                    component={baseComponent}
                    value="$2a$10$somehashedpassword"
                    onChange={() => {}}
                    disabled
                />
            );

            expect(screen.queryByText('重置密码')).not.toBeInTheDocument();
        });

        it('允许生成密码时应显示生成按钮', () => {
            render(
                <Control
                    component={baseComponent}
                    value=""
                    onChange={() => {}}
                />
            );

            expect(screen.getByText('生成强密码')).toBeInTheDocument();
        });

        it('不允许生成密码时不应显示生成按钮', () => {
            const componentNoGenerate: PasswordComponentDefinition = {
                ...baseComponent,
                allowGenerate: false,
            };

            render(
                <Control
                    component={componentNoGenerate}
                    value=""
                    onChange={() => {}}
                />
            );

            expect(screen.queryByText('生成强密码')).not.toBeInTheDocument();
        });
    });

    describe('Configurator', () => {
        const baseFormData: PasswordComponentDefinition = {
            type: 'password',
            id: 'test',
            label: '测试',
            minLength: 8,
        };

        it('应渲染配置表单', () => {
            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={() => {}}
                />
            );

            expect(screen.getByText('最小长度')).toBeInTheDocument();
            expect(screen.getByText('密码要求')).toBeInTheDocument();
            expect(screen.getByText('功能选项')).toBeInTheDocument();
        });

        it('应显示所有密码要求选项', () => {
            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={() => {}}
                />
            );

            expect(screen.getByText('要求大写字母 (A-Z)')).toBeInTheDocument();
            expect(screen.getByText('要求小写字母 (a-z)')).toBeInTheDocument();
            expect(screen.getByText('要求数字 (0-9)')).toBeInTheDocument();
            expect(screen.getByText('要求特殊字符 (!@#$%...)')).toBeInTheDocument();
        });

        it('修改最小长度应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const minLengthInput = screen.getByDisplayValue('8');
            fireEvent.change(minLengthInput, { target: { value: '12' } });

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

