import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

// ============================================
// 简单的自定义 Select 组件（胶囊风格）
// ============================================

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "请选择...",
  disabled = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-full border border-input bg-background pl-5 pr-4 py-2 text-sm",
          "ring-offset-background transition-all",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn(!selectedOption && "text-muted-foreground")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="max-h-60 overflow-auto scrollbar-none">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  option.disabled && "cursor-not-allowed opacity-50",
                  option.value === value && "bg-accent"
                )}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Native Select（原生下拉，也是胶囊风格）
// ============================================

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full appearance-none rounded-full border border-input bg-background pl-5 pr-12 py-2 text-sm",
          "ring-offset-background transition-shadow",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)
NativeSelect.displayName = "NativeSelect"

