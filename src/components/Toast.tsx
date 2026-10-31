import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
    id: number
    kind: ToastKind
    message: string
}

interface ToastApi {
    show: (message: string, kind?: ToastKind) => void
    success: (message: string) => void
    error: (message: string) => void
}

const ToastContext = createContext<ToastApi>({
    show: () => {},
    success: () => {},
    error: () => {},
})

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const show = useCallback((message: string, kind: ToastKind = 'info') => {
        const id = Date.now() + Math.floor(Math.random() * 1000)
        setToasts((current) => [...current.slice(-3), { id, kind, message }])
        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id))
        }, kind === 'error' ? 6000 : 3500)
    }, [])

    const api = useMemo<ToastApi>(
        () => ({
            show,
            success: (message: string) => show(message, 'success'),
            error: (message: string) => show(message, 'error'),
        }),
        [show]
    )

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.kind}`}>
                        <span className="toast-icon" aria-hidden="true">
                            {toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i'}
                        </span>
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
    return useContext(ToastContext)
}
