/**
 * QRCode 组件 - 配置
 */

import { ComponentMeta, QrcodeComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'qrcode',
    name: '二维码',
    description: '将字段值生成二维码',
    icon: 'qr-code',
    hasOptions: false,
    category: 'display',
};

export function createDefault(id: string): QrcodeComponentDefinition {
    return {
        type: 'qrcode',
        id,
        label: '二维码',
        size: 128,
        errorCorrectionLevel: 'M',
        fgColor: '#000000',
        bgColor: '#ffffff',
        allowDownload: true,
    };
}

