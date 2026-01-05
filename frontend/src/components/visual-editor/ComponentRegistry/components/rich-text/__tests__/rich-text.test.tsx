/**
 * RichText 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { RichTextComponentDefinition } from '../../../types';

describe('RichText 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'rich-text',
                id: 'test-id',
                label: '内容',
                placeholder: '输入内容...',
                minHeight: 150,
                maxHeight: 400,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('rich-text');
            expect(meta.name).toBe('富文本');
        });
    });

    describe('Configurator', () => {
        const baseFormData: RichTextComponentDefinition = {
            type: 'rich-text',
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

            expect(screen.getByText('占位文本')).toBeInTheDocument();
            expect(screen.getByText('最小高度 (px)')).toBeInTheDocument();
            expect(screen.getByText('最大高度 (px)')).toBeInTheDocument();
        });

        it('修改高度应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const heightInputs = screen.getAllByRole('spinbutton');
            fireEvent.change(heightInputs[0], { target: { value: '200' } });

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

