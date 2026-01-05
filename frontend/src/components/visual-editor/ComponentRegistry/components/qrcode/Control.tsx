/**
 * QRCode 组件 - 数据块控件
 */

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, QrcodeComponentDefinition } from '../../types';

export function Control({ component, value }: ControlProps) {
    const qrDef = component as QrcodeComponentDefinition;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);

    const stringValue = typeof value === 'string' ? value : '';

    useEffect(() => {
        if (!canvasRef.current || !stringValue) {
            setError(null);
            return;
        }

        const options: QRCode.QRCodeToDataURLOptions = {
            width: qrDef.size || 128,
            margin: 1,
            color: {
                dark: qrDef.fgColor || '#000000',
                light: qrDef.bgColor || '#ffffff',
            },
            errorCorrectionLevel: qrDef.errorCorrectionLevel || 'M',
        };

        QRCode.toCanvas(canvasRef.current, stringValue, options, (err) => {
            if (err) {
                setError('生成二维码失败');
                console.error('QRCode error:', err);
            } else {
                setError(null);
            }
        });
    }, [stringValue, qrDef.size, qrDef.fgColor, qrDef.bgColor, qrDef.errorCorrectionLevel]);

    const handleDownload = () => {
        if (!canvasRef.current) return;

        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    if (!stringValue) {
        return (
            <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-center">
                    <QrCode className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">输入内容后生成二维码</p>
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
                    <canvas ref={canvasRef} />
                </div>

                {qrDef.allowDownload !== false && (
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

            <p className="text-xs text-slate-400 truncate max-w-xs" title={stringValue}>
                内容: {stringValue}
            </p>
        </div>
    );
}

export default Control;


