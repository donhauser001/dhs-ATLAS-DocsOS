/**
 * Signature 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { SignatureComponentDefinition } from '../../../types';

describe('Signature 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'signature',
                id: 'test-id',
                label: '签名',
                canvasWidth: 400,
                canvasHeight: 200,
                strokeColor: '#000000',
                strokeWidth: 2,
                backgroundColor: '#ffffff',
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('signature');
            expect(meta.name).toBe('手写签名');
            expect(meta.icon).toBe('pen-tool');
        });
    });

    describe('Configurator', () => {
        const baseFormData: SignatureComponentDefinition = {
            type: 'signature',
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

            expect(screen.getByText('宽度 (px)')).toBeInTheDocument();
            expect(screen.getByText('高度 (px)')).toBeInTheDocument();
            expect(screen.getByText('笔触颜色')).toBeInTheDocument();
            expect(screen.getByText('笔触粗细')).toBeInTheDocument();
        });

        it('修改宽度应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const widthInput = screen.getAllByRole('spinbutton')[0];
            fireEvent.change(widthInput, { target: { value: '500' } });

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

