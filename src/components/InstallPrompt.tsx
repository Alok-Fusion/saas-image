import { useState, useEffect } from 'react'
import { DownloadCloud, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
    const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Only show if user has completed a task once (respecting "never on first load" requirement)
        const hasCompletedTask = typeof window !== 'undefined' && localStorage.getItem('ik_task_completed') === 'true'
        const isDismissed = typeof window !== 'undefined' && sessionStorage.getItem('ik_install_dismissed') === 'true'

        const handler = (e: Event) => {
            e.preventDefault()
            const installEvent = e as BeforeInstallPromptEvent
            setPromptEvent(installEvent)

            if (hasCompletedTask && !isDismissed) {
                setIsVisible(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!promptEvent) return
        await promptEvent.prompt()
        const choice = await promptEvent.userChoice
        if (choice.outcome === 'accepted') {
            setIsVisible(false)
        }
        setPromptEvent(null)
    }

    const handleDismiss = () => {
        setIsVisible(false)
        sessionStorage.setItem('ik_install_dismissed', 'true')
    }

    if (!isVisible || !promptEvent) return null

    return (
        <aside
            className="pwa-install-banner"
            role="dialog"
            aria-label="Install app"
            style={{
                position: 'fixed',
                bottom: 'calc(var(--spacing-4) + var(--safe-bottom))',
                left: 'var(--spacing-4)',
                right: 'var(--spacing-4)',
                maxWidth: '440px',
                margin: '0 auto',
                zIndex: 'var(--z-toast)',
                background: 'var(--color-bg-surface-elevated)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--spacing-3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <DownloadCloud size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Install ImageKit Pro
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        Add to home screen for offline access
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                    type="button"
                    onClick={handleInstall}
                    className="btn btn-primary btn-sm"
                    style={{ minHeight: '36px', padding: '0 12px' }}
                >
                    Install
                </button>
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Dismiss install prompt"
                    style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-muted)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                    }}
                >
                    <X size={16} />
                </button>
            </div>
        </aside>
    )
}
