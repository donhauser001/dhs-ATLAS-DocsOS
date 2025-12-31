import { useEffect, useCallback } from 'react'

type HotkeyCallback = (event: KeyboardEvent) => void

interface HotkeyOptions {
  /** 是否在输入框中也触发 */
  enableOnInput?: boolean
}

/**
 * 全局快捷键 hook
 * 
 * @example
 * useHotkey('k', { ctrl: true }, () => console.log('Ctrl+K pressed'))
 * useHotkey('/', { meta: true }, () => console.log('Cmd+/ pressed'))
 */
export function useHotkey(
  key: string,
  modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean },
  callback: HotkeyCallback,
  options: HotkeyOptions = {}
) {
  const { enableOnInput = false } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 检查是否在输入框中
      if (!enableOnInput) {
        const target = event.target as HTMLElement
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        if (isInput) return
      }

      // 检查按键
      const keyMatch = event.key.toLowerCase() === key.toLowerCase()
      const ctrlMatch = modifiers.ctrl ? event.ctrlKey : !event.ctrlKey
      const metaMatch = modifiers.meta ? event.metaKey : !event.metaKey
      const shiftMatch = modifiers.shift ? event.shiftKey : !event.shiftKey
      const altMatch = modifiers.alt ? event.altKey : !event.altKey

      // Cmd/Ctrl 统一处理（Mac 用 Cmd，Windows 用 Ctrl）
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdOrCtrl = modifiers.meta || modifiers.ctrl
      const cmdOrCtrlMatch = cmdOrCtrl
        ? isMac
          ? event.metaKey
          : event.ctrlKey
        : true

      if (keyMatch && (cmdOrCtrl ? cmdOrCtrlMatch : ctrlMatch && metaMatch) && shiftMatch && altMatch) {
        event.preventDefault()
        callback(event)
      }
    },
    [key, modifiers, callback, enableOnInput]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * 简化版：Cmd/Ctrl + Key
 */
export function useCmdKey(key: string, callback: HotkeyCallback, options?: HotkeyOptions) {
  useHotkey(key, { meta: true }, callback, options)
}

