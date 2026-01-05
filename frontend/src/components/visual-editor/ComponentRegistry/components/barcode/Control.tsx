/**
 * Barcode 组件 - 数据块控件
 */

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Download, Barcode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, BarcodeComponentDefinition } from '../../types';

export function Control({ component, value }: ControlProps) {
    const barcodeDef = component as BarcodeComponentDefinition;
    const svgRef = useRef<SVGSVGElement>(null);
    const [error, setError] = useState<string | null>(null);

    const stringValue = typeof value === 'string' ? value : '';

    useEffect(() => {
        if (!svgRef.current || !stringValue) {
            setError(null);
            return;
        }

        try {
            JsBarcode(svgRef.current, stringValue, {
                format: barcodeDef.barcodeFormat || 'CODE128',
                width: barcodeDef.width || 2,
                height: barcodeDef.height || 100,
                displayValue: barcodeDef.displayValue !== false,
                margin: 10,
                background: '#ffffff',
                lineColor: '#000000',
            });
            setError(null);
        } catch (err) {
            setError('生成条形码失败：' + (err instanceof Error ? err.message : '无效的输入'));
            console.error('Barcode error:', err);
        }
    }, [stringValue, barcodeDef.barcodeFormat, barcodeDef.width, barcodeDef.height, barcodeDef.displayValue]);

    const handleDownload = () => {
        if (!svgRef.current) return;

        // 将 SVG 转换为图片下载
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            const link = document.createElement('a');
            link.download = 'barcode.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    if (!stringValue) {
        return (
            <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-center">
                    <Barcode className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">输入内容后生成条形码</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <svg ref={svgRef} />
                </div>

                {barcodeDef.allowDownload !== false && (
                    <button
                        type="button"
                        onClick={handleDownload}
                        className={cn(
                            'flex items-center gap-1 px-3 py-1.5 text-sm',
                            'text-purple-600 hover:bg-purple-50 rounded-lg transition-colors'
                        )}
                    >
                        <Download className="h-4 w-4" />
                        下载
                    </button>
                )}
            </div>
        </div>
    );
}

export default Control;

