/**
 * DocumentLink 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { DocumentLinkComponentDefinition } from '../../../types';

describe('DocumentLink 组件', () => {
    describe('config', () => {
        it('createDefault 应返回正确的默认值', () => {
            const result = createDefault('test-id');

            expect(result).toEqual({
                type: 'document-link',
                id: 'test-id',
                label: '关联文档',
                placeholder: '选择文档...',
                allowMultiple: false,
                showPath: false,
            });
        });

        it('meta 应包含正确的组件信息', () => {
            expect(meta.type).toBe('document-link');
            expect(meta.name).toBe('文档链接');
            expect(meta.icon).toBe('file-text');
        });
    });

    describe('Configurator', () => {
        const baseFormData: DocumentLinkComponentDefinition = {
            type: 'document-link',
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
            expect(screen.getByText('允许多选')).toBeInTheDocument();
            expect(screen.getByText('显示文档路径')).toBeInTheDocument();
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

            const checkbox = screen.getByLabelText('允许多选');
            fireEvent.click(checkbox);

            expect(handleUpdate).toHaveBeenCalled();
        });
    });
});


