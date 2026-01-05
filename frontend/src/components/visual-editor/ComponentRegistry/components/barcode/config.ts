/**
 * Barcode 组件 - 配置
 */

import { ComponentMeta, BarcodeComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'barcode',
    name: '条形码',
    description: '将字段值生成条形码',
    icon: 'barcode',
    hasOptions: false,
    category: 'display',
};

export function createDefault(id: string): BarcodeComponentDefinition {
    return {
        type: 'barcode',
        id,
        label: '条形码',
        barcodeFormat: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        allowDownload: true,
    };
}

