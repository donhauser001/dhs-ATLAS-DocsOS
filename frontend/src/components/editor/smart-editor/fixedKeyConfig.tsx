/**
 * 固定键配置生成器
 */

import { Calendar, User, FileText, Zap, Shield } from 'lucide-react';
import type { FixedKeyItem } from './types';
import { formatDate } from './version-utils';

interface FixedKeyConfigParams {
    fixedKeyValues: Record<string, unknown>;
    originalFixedKeyValues: Record<string, unknown>;
}

export function createFixedKeyConfig({
    fixedKeyValues,
    originalFixedKeyValues,
}: FixedKeyConfigParams): FixedKeyItem[] {
    return [
        {
            key: 'version',
            label: '版本',
            value: fixedKeyValues.version,
            originalValue: originalFixedKeyValues.version,
            icon: <Zap className="w-3 h-3" />,
            category: 'metadata',
            editable: true,
            inputType: 'version',
        },
        {
            key: 'document_type',
            label: '类型',
            value: fixedKeyValues.document_type,
            originalValue: originalFixedKeyValues.document_type,
            icon: <FileText className="w-3 h-3" />,
            category: 'metadata',
            editable: true,
            inputType: 'document_type',
        },
        {
            key: 'created',
            label: '创建',
            value: formatDate(fixedKeyValues.created as string),
            originalValue: originalFixedKeyValues.created,
            icon: <Calendar className="w-3 h-3" />,
            category: 'metadata',
            editable: false,
            inputType: 'text',
        },
        {
            key: 'updated',
            label: '更新',
            value: fixedKeyValues.updated
                ? formatDate(fixedKeyValues.updated as string)
                : '（保存时自动更新）',
            originalValue: originalFixedKeyValues.updated,
            icon: <Calendar className="w-3 h-3" />,
            category: 'metadata',
            editable: false,
            inputType: 'text',
        },
        {
            key: 'author',
            label: '作者',
            value: fixedKeyValues.author,
            originalValue: originalFixedKeyValues.author,
            icon: <User className="w-3 h-3" />,
            category: 'metadata',
            editable: true,
            inputType: 'text',
        },
        {
            key: 'atlas.function',
            label: '功能',
            value: fixedKeyValues['atlas.function'],
            originalValue: originalFixedKeyValues['atlas.function'],
            icon: <Shield className="w-3 h-3" />,
            category: 'function',
            editable: true,
            inputType: 'function',
        },
        {
            key: 'atlas.capabilities',
            label: '能力',
            value: fixedKeyValues['atlas.capabilities'],
            originalValue: originalFixedKeyValues['atlas.capabilities'],
            icon: <Zap className="w-3 h-3" />,
            category: 'function',
            editable: true,
            inputType: 'capabilities',
        },
    ];
}

