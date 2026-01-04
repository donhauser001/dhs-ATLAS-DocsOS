/**
 * Avatar 组件 - 数据块控件
 * 带裁切功能的头像上传，保存为实际文件
 */

import { useState, useRef, useCallback } from 'react';
import { User, Upload, X, Check, RotateCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, AvatarComponentDefinition } from '../../types';

interface CropState {
    x: number;
    y: number;
    size: number;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const avatarDef = component as AvatarComponentDefinition;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, size: 100 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [rotation, setRotation] = useState(0);
    
    const stringValue = typeof value === 'string' ? value : '';
    
    // 构建图片 URL（支持 base64、HTTP URL 和文件路径）
    const imageUrl = stringValue
        ? stringValue.startsWith('data:') || stringValue.startsWith('http')
            ? stringValue
            : `/api/files/preview?path=${encodeURIComponent(stringValue)}`
        : '';

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 检查文件大小
        const maxSize = (avatarDef.maxSize || 2048) * 1024;
        if (file.size > maxSize) {
            alert(`文件大小不能超过 ${avatarDef.maxSize || 2048}KB`);
            return;
        }

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setImageSize({ width: img.width, height: img.height });
                const minSize = Math.min(img.width, img.height);
                setCrop({
                    x: (img.width - minSize) / 2,
                    y: (img.height - minSize) / 2,
                    size: minSize,
                });
                setRotation(0);
            };
            img.src = event.target?.result as string;
            setTempImage(event.target?.result as string);
            setIsCropping(true);
        };
        reader.readAsDataURL(file);
        
        // 重置 input
        e.target.value = '';
    }, [avatarDef.maxSize]);

    const handleCropConfirm = useCallback(async () => {
        if (!tempImage || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsUploading(true);

        try {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = tempImage;
            });

            // 输出尺寸（正方形）
            const outputSize = 200;
            canvas.width = outputSize;
            canvas.height = outputSize;

            // 清空画布
            ctx.clearRect(0, 0, outputSize, outputSize);

            // 应用旋转
            ctx.save();
            ctx.translate(outputSize / 2, outputSize / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-outputSize / 2, -outputSize / 2);

            // 绘制裁切后的图片
            ctx.drawImage(
                img,
                crop.x,
                crop.y,
                crop.size,
                crop.size,
                0,
                0,
                outputSize,
                outputSize
            );

            ctx.restore();

            // 转换为 Blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
                    'image/jpeg',
                    0.9
                );
            });

            // 生成文件名（时间戳 + 随机字符）
            const fileName = `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
            const directory = avatarDef.directory || '/avatars';

            // 上传文件
            const formData = new FormData();
            formData.append('file', blob, fileName);

            const response = await fetch(`/api/files/upload?path=${encodeURIComponent(directory)}`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success && result.data?.path) {
                // 保存相对路径
                onChange(result.data.path);
            } else {
                throw new Error(result.error || '上传失败');
            }

            setTempImage(null);
            setIsCropping(false);
        } catch (error) {
            console.error('头像上传失败:', error);
            alert('头像上传失败，请重试');
        } finally {
            setIsUploading(false);
        }
    }, [tempImage, crop, rotation, onChange, avatarDef.directory]);

    const handleCropCancel = () => {
        setTempImage(null);
        setIsCropping(false);
    };

    const handleRemove = () => {
        onChange(null);
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    // 简化的裁切控制
    const handleCropChange = (direction: 'left' | 'right' | 'up' | 'down' | 'in' | 'out') => {
        setCrop((prev) => {
            const step = 10;
            let { x, y, size } = prev;

            switch (direction) {
                case 'left':
                    x = Math.max(0, x - step);
                    break;
                case 'right':
                    x = Math.min(imageSize.width - size, x + step);
                    break;
                case 'up':
                    y = Math.max(0, y - step);
                    break;
                case 'down':
                    y = Math.min(imageSize.height - size, y + step);
                    break;
                case 'in':
                    size = Math.max(50, size - step * 2);
                    break;
                case 'out':
                    size = Math.min(Math.min(imageSize.width, imageSize.height), size + step * 2);
                    break;
            }

            return { x, y, size };
        });
    };

    return (
        <div className="space-y-2">
            <canvas ref={canvasRef} className="hidden" />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* 裁切模式 */}
            {isCropping && tempImage && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4 space-y-4">
                        <h3 className="text-lg font-medium">裁切头像</h3>
                        
                        {/* 预览区域 */}
                        <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
                            <img
                                src={tempImage}
                                alt="预览"
                                className="absolute inset-0 w-full h-full object-contain"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    clipPath: `inset(${(crop.y / imageSize.height) * 100}% ${100 - ((crop.x + crop.size) / imageSize.width) * 100}% ${100 - ((crop.y + crop.size) / imageSize.height) * 100}% ${(crop.x / imageSize.width) * 100}%)`,
                                }}
                            />
                            {/* 裁切框指示 */}
                            <div className="absolute inset-0 pointer-events-none border-4 border-purple-500/50 rounded-full m-4" />
                        </div>

                        {/* 控制按钮 */}
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => handleCropChange('left')}
                                className="p-2 bg-slate-100 rounded hover:bg-slate-200"
                                title="左移"
                            >
                                ←
                            </button>
                            <button
                                onClick={() => handleCropChange('up')}
                                className="p-2 bg-slate-100 rounded hover:bg-slate-200"
                                title="上移"
                            >
                                ↑
                            </button>
                            <button
                                onClick={() => handleCropChange('down')}
                                className="p-2 bg-slate-100 rounded hover:bg-slate-200"
                                title="下移"
                            >
                                ↓
                            </button>
                            <button
                                onClick={() => handleCropChange('right')}
                                className="p-2 bg-slate-100 rounded hover:bg-slate-200"
                                title="右移"
                            >
                                →
                            </button>
                            <button
                                onClick={() => handleCropChange('out')}
                                className="p-2 bg-slate-100 rounded hover:bg-slate-200"
                                title="放大"
                            >
                                +
                            </button>
                            <button
                                onClick={() => handleCropChange('in')}
                                className="p-2 bg-slate-100 rounded hover:bg-slate-200"
                                title="缩小"
                            >
                                -
                            </button>
                            <button
                                onClick={handleRotate}
                                className="p-2 bg-slate-100 rounded hover:bg-slate-200"
                                title="旋转"
                            >
                                <RotateCw className="h-4 w-4" />
                            </button>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleCropCancel}
                                disabled={isUploading}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCropConfirm}
                                disabled={isUploading}
                                className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-1 disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        上传中...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        确定
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 显示模式 */}
            <div className="flex items-center gap-4">
                {/* 头像预览 */}
                <div
                    className={cn(
                        'relative w-20 h-20 rounded-full overflow-hidden bg-slate-100',
                        'border-2 border-dashed border-slate-300',
                        !disabled && 'cursor-pointer hover:border-purple-400'
                    )}
                    onClick={() => !disabled && fileInputRef.current?.click()}
                >
                    {stringValue ? (
                        <img
                            src={imageUrl}
                            alt="头像"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <User className="h-8 w-8 text-slate-300" />
                        </div>
                    )}
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className={cn(
                            'flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                            'hover:border-purple-300 hover:text-purple-600',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <Upload className="h-4 w-4" />
                        上传头像
                    </button>
                    {stringValue && !disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg"
                        >
                            <X className="h-4 w-4" />
                            移除
                        </button>
                    )}
                    {stringValue && !stringValue.startsWith('data:') && (
                        <p className="text-xs text-slate-400 max-w-[150px] truncate" title={stringValue}>
                            {stringValue}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Control;
