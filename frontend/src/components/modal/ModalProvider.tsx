import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ModalShell } from './ModalShell'
import type { ModalRegistry, OpenModalOptions } from './types'

// ============================================================
// 弹窗状态管理
// ============================================================

interface ModalState {
  id: string
  props: Record<string, unknown>
  initialData?: Record<string, unknown>
  onSuccess?: () => void
}

interface ModalContextValue {
  openModal: (
    id: string,
    props?: Record<string, unknown>,
    options?: OpenModalOptions
  ) => void
  closeModal: () => void
  /** AI/脚本 直接提交表单（绕过 UI） */
  submitForm: (
    id: string,
    data: Record<string, unknown>,
    props?: Record<string, unknown>
  ) => Promise<void>
}

const ModalContext = createContext<ModalContextValue | null>(null)

// ============================================================
// Provider
// ============================================================

interface ModalProviderProps {
  children: ReactNode
  registry: ModalRegistry
}

export function ModalProvider({ children, registry }: ModalProviderProps) {
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState<ModalState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  // 打开弹窗
  const openModal = useCallback(
    (
      id: string,
      props: Record<string, unknown> = {},
      options?: OpenModalOptions
    ) => {
      if (!registry[id]) {
        console.error(`[Modal] 未注册的弹窗: ${id}`)
        return
      }
      setError('')
      setCurrent({
        id,
        props,
        initialData: options?.initialData,
        onSuccess: options?.onSuccess,
      })
    },
    [registry]
  )

  // 关闭弹窗
  const closeModal = useCallback(() => {
    setCurrent(null)
    setError('')
    setSubmitting(false)
  }, [])

  // 提交处理
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      if (!current) return

      const entry = registry[current.id]
      if (!entry?.onSubmit) {
        console.warn(`[Modal] ${current.id} 没有定义 onSubmit`)
        return
      }

      setSubmitting(true)
      setError('')

      try {
        await entry.onSubmit(data, { props: current.props })

        // 刷新缓存
        if (entry.invalidateKeys) {
          for (const key of entry.invalidateKeys) {
            queryClient.invalidateQueries({ queryKey: key })
          }
        }

        current.onSuccess?.()
        closeModal()
      } catch (err) {
        setError(err instanceof Error ? err.message : '操作失败')
      } finally {
        setSubmitting(false)
      }
    },
    [current, registry, queryClient, closeModal]
  )

  // AI/脚本 直接提交（绕过 UI）
  const submitForm = useCallback(
    async (
      id: string,
      data: Record<string, unknown>,
      props: Record<string, unknown> = {}
    ) => {
      const entry = registry[id]
      if (!entry) {
        throw new Error(`未注册的弹窗: ${id}`)
      }
      if (!entry.onSubmit) {
        throw new Error(`${id} 没有定义 onSubmit`)
      }

      await entry.onSubmit(data, { props })

      // 刷新缓存
      if (entry.invalidateKeys) {
        for (const key of entry.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key })
        }
      }
    },
    [registry, queryClient]
  )

  // 监听全局事件（供 AI/脚本 调用）
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      const { id, props, options } = customEvent.detail || {}
      if (id) openModal(id, props, options)
    }

    const handleSubmitEvent = async (e: Event) => {
      const customEvent = e as CustomEvent
      const { id, data, props } = customEvent.detail || {}
      if (id && data) {
        try {
          await submitForm(id, data, props)
          window.dispatchEvent(
            new CustomEvent('modal:submit:success', { detail: { id } })
          )
        } catch (err) {
          window.dispatchEvent(
            new CustomEvent('modal:submit:error', {
              detail: { id, error: err instanceof Error ? err.message : '操作失败' },
            })
          )
        }
      }
    }

    window.addEventListener('modal:open', handleOpenEvent)
    window.addEventListener('modal:submit', handleSubmitEvent)

    return () => {
      window.removeEventListener('modal:open', handleOpenEvent)
      window.removeEventListener('modal:submit', handleSubmitEvent)
    }
  }, [openModal, submitForm])

  // 渲染弹窗
  const renderModal = () => {
    if (!current) return null

    const entry = registry[current.id]
    if (!entry) return null

    const FormComponent = entry.component

    return (
      <ModalShell
        title={entry.meta.title}
        width={entry.meta.width}
        onClose={closeModal}
      >
        <FormComponent
          {...current.props}
          initialData={current.initialData}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
          error={error}
        />
      </ModalShell>
    )
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal, submitForm }}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal 必须在 ModalProvider 内使用')
  }
  return context
}
