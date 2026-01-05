/**
 * Signature 组件 - 数据块控件
 */

import { useRef, useEffect, useState } from 'react';
import { PenTool, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, SignatureComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const signatureDef = component as SignatureComponentDefinition;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const stringValue = typeof value === 'string' ? value : '';

    // 初始化画布
    useEffect(() => {
        if (!canvasRef.current || !isEditing) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 设置背景
        ctx.fillStyle = signatureDef.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [isEditing, signatureDef.backgroundColor]);

    // 绘图函数
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (disabled) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = signatureDef.strokeColor || '#000000';
        ctx.lineWidth = signatureDef.strokeWidth || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || disabled) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.fillStyle = signatureDef.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        onChange(dataUrl);
        setIsEditing(false);
    };

    const handleDelete = () => {
        onChange(null);
    };

    // 已签名状态
    if (stringValue && !isEditing) {
        return (
            <div className="space-y-2">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <img 
                        src={stringValue} 
                        alt="签名" 
                        className="max-w-full h-auto"
                        style={{ maxHeight: signatureDef.canvasHeight }}
                    />
                </div>
                {!disabled && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
                        >
                            <PenTool className="h-3.5 w-3.5" />
                            重新签名
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            删除
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // 编辑/绘制状态
    if (isEditing || !stringValue) {
        return (
            <div className="space-y-2">
                <div className={cn(
                    'p-2 bg-white rounded-lg border-2 border-dashed',
                    disabled ? 'border-slate-200' : 'border-purple-300'
                )}>
                    <canvas
                        ref={canvasRef}
                        width={signatureDef.canvasWidth || 400}
                        height={signatureDef.canvasHeight || 200}
                        className={cn(
                            'rounded cursor-crosshair',
                            disabled && 'cursor-not-allowed'
                        )}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                </div>
                {!disabled && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            清除
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-500 text-white hover:bg-purple-600 rounded-lg"
                        >
                            <Check className="h-3.5 w-3.5" />
                            确认签名
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return null;
}

export default Control;

