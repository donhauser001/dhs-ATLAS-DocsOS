/**
 * Barcode 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { BarcodeComponentDefinition } from '../../../types';

describe('Barcode 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'barcode',
                id: 'test-id',
                label: '条形码',
                barcodeFormat: 'CODE128',
                width: 2,
                height: 100,
                displayValue: true,
                allowDownload: true,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('barcode');
            expect(meta.name).toBe('条形码');
            expect(meta.icon).toBe('barcode');
        });
    });

    describe('Configurator', () => {
        const baseFormData: BarcodeComponentDefinition = {
            type: 'barcode',
            id: 'test',
            label: '测试',
            barcodeFormat: 'CODE128',
        };

        it('应渲染配置表单', () => {
            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={() => {}}
                />
            );

            expect(screen.getByText('条形码格式')).toBeInTheDocument();
            expect(screen.getByText('线条宽度')).toBeInTheDocument();
            expect(screen.getByText('高度 (px)')).toBeInTheDocument();
        });

        it('应显示所有条形码格式选项', () => {
            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={() => {}}
                />
            );

            expect(screen.getByText('CODE128')).toBeInTheDocument();
            expect(screen.getByText('EAN-13')).toBeInTheDocument();
            expect(screen.getByText('UPC-A')).toBeInTheDocument();
            expect(screen.getByText('CODE39')).toBeInTheDocument();
        });

        it('修改格式应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const eanRadio = screen.getByLabelText(/EAN-13/);
            fireEvent.click(eanRadio);

            expect(handleUpdate).toHaveBeenCalled();
        });

        it('修改显示数值应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const checkbox = screen.getByLabelText('显示数值文字');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});


