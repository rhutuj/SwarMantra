import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error'
}

interface ToastContextValue {
  addToast: (message: string, type: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = String(++toastId)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItemComponent key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItemComponent({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  return (
    <div
      className={`animate-slide-in rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
        toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
      }`}
    >
      {toast.message}
    </div>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
