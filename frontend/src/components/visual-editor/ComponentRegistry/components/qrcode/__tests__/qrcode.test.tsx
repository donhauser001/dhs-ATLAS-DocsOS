/**
 * QRCode 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { QrcodeComponentDefinition } from '../../../types';

// Mock canvas 相关 API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');

describe('QRCode 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'qrcode',
                id: 'test-id',
                label: '二维码',
                size: 128,
                errorCorrectionLevel: 'M',
                fgColor: '#000000',
                bgColor: '#ffffff',
                allowDownload: true,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('qrcode');
            expect(meta.name).toBe('二维码');
            expect(meta.icon).toBe('qr-code');
        });
    });

    describe('Configurator', () => {
        const baseFormData: QrcodeComponentDefinition = {
            type: 'qrcode',
            id: 'test',
            label: '测试',
            size: 128,
            errorCorrectionLevel: 'M',
        };

        it('应渲染配置表单', () => {
            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={() => {}}
                />
            );

            expect(screen.getByText('尺寸 (px)')).toBeInTheDocument();
            expect(screen.getByText('容错级别')).toBeInTheDocument();
            expect(screen.getByText('前景色')).toBeInTheDocument();
            expect(screen.getByText('背景色')).toBeInTheDocument();
        });

        it('应显示所有容错级别选项', () => {
            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={() => {}}
                />
            );

            expect(screen.getByText('低 (7%)')).toBeInTheDocument();
            expect(screen.getByText('中 (15%)')).toBeInTheDocument();
            expect(screen.getByText('较高 (25%)')).toBeInTheDocument();
            expect(screen.getByText('高 (30%)')).toBeInTheDocument();
        });

        it('修改尺寸应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const sizeInput = screen.getByDisplayValue('128');
            fireEvent.change(sizeInput, { target: { value: '256' } });

            expect(handleUpdate).toHaveBeenCalled();
        });

        it('修改允许下载应调用 onUpdateFormData', () => {
            const handleUpdate = vi.fn();

            render(
                <Configurator
                    formData={baseFormData}
                    errors={{}}
                    onUpdateFormData={handleUpdate}
                />
            );

            const checkbox = screen.getByLabelText('允许下载');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});

