import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================
// 简单的 DropdownMenu 组件（胶囊风格）
// ============================================

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "center" | "end"
  className?: string
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

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

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {/* Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "absolute z-50 mt-2 min-w-[160px] rounded-2xl border bg-popover p-1.5 shadow-lg",
              "animate-in fade-in-0 zoom-in-95",
              align === "start" && "left-0",
              align === "center" && "left-1/2 -translate-x-1/2",
              align === "end" && "right-0",
              className
            )}
          >
            <DropdownMenuContext.Provider value={{ close: () => setIsOpen(false) }}>
              {children}
            </DropdownMenuContext.Provider>
          </div>
        </>
      )}
    </div>
  )
}

// Context for closing menu
const DropdownMenuContext = React.createContext<{ close: () => void }>({
  close: () => {},
})

// ============================================
// Menu Items
// ============================================

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean
}

export function DropdownMenuItem({
  children,
  className,
  destructive,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { close } = React.useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    close()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-border", className)} />
}

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("px-3 py-1.5 text-xs font-medium text-muted-foreground", className)}>
      {children}
    </div>
  )
}

