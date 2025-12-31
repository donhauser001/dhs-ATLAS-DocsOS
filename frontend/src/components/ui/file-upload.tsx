import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Upload, X, FileImage, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from './button'

interface FileUploadProps {
  /** 文件分类，决定存储路径 */
  category: string
  /** 当前文件路径（用于显示已上传的文件） */
  value?: string
  /** 文件变化回调 */
  onChange?: (filePath: string | null) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
  /** 接受的文件类型 */
  accept?: string
  /** 最大文件大小（MB） */
  maxSizeMB?: number
  /** 提示文字 */
  hint?: string
}

interface UploadResponse {
  success: boolean
  data?: {
    filename: string
    originalName: string
    mimetype: string
    size: number
    path: string
    url: string
  }
  error?: {
    code: string
    message: string
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('atlas-auth')
  if (token) {
    try {
      const parsed = JSON.parse(token)
      if (parsed.state?.token) {
        return {
          Authorization: `Bearer ${parsed.state.token}`,
        }
      }
    } catch {
      // ignore
    }
  }
  return {}
}

export function FileUpload({
  category,
  value,
  onChange,
  disabled = false,
  className,
  accept = 'image/*,.pdf',
  maxSizeMB = 10,
  hint,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 判断是否是图片
  const isImage = (path: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(path)
  }

  // 获取文件预览 URL
  const getPreviewUrl = useCallback((filePath: string) => {
    if (!filePath) return null
    // 如果是完整 URL 则直接返回
    if (filePath.startsWith('http')) return filePath
    // 否则拼接 API 路径
    return `/api/files/${filePath}`
  }, [])

  // 上传文件
  const uploadFile = async (file: File) => {
    setError(null)
    setIsUploading(true)

    try {
      // 检查文件大小
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`文件大小不能超过 ${maxSizeMB}MB`)
      }

      const formData = new FormData()
      formData.append('file', file)

      // category 通过 query 参数传递，因为 multipart/form-data 的 body 需要 multer 处理后才能读取
      const response = await fetch(`/api/upload?category=${encodeURIComponent(category)}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      })

      const result: UploadResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || '上传失败')
      }

      const filePath = result.data!.path
      onChange?.(filePath)
    } catch (err: any) {
      setError(err.message || '上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    uploadFile(files[0])
  }

  // 拖拽事件处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return
    handleFileSelect(e.dataTransfer.files)
  }

  // 点击上传
  const handleClick = () => {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }

  // 删除文件
  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(null)
    setError(null)
  }

  // 渲染预览
  const renderPreview = () => {
    const filePath = value
    if (!filePath) return null

    const url = getPreviewUrl(filePath)
    const isImg = isImage(filePath)

    return (
      <div className="relative group">
        {isImg ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted">
            <img
              src={url!}
              alt="预览"
              className="w-full h-full object-contain"
              onError={() => setError('图片加载失败')}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {filePath.split('/').pop()}
              </p>
              <p className="text-xs text-muted-foreground">PDF 文件</p>
            </div>
          </div>
        )}
        
        {/* 删除按钮 */}
        {!disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // 渲染上传区域
  const renderUploadArea = () => (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-6 transition-colors cursor-pointer',
        isDragging && 'border-primary bg-primary/5',
        !isDragging && 'border-muted-foreground/25 hover:border-muted-foreground/50',
        disabled && 'opacity-50 cursor-not-allowed',
        isUploading && 'pointer-events-none'
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-2 text-center">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">上传中...</p>
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-muted">
              {isDragging ? (
                <FileImage className="h-6 w-6 text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragging ? '释放以上传' : '点击或拖拽上传'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hint || `支持图片和 PDF，最大 ${maxSizeMB}MB`}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className={cn('space-y-2', className)}>
      {value ? renderPreview() : renderUploadArea()}
      
      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {/* 已有文件时显示重新上传按钮 */}
      {value && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          重新上传
        </Button>
      )}
    </div>
  )
}

