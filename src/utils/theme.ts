export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'imagekit_theme'

export function getInitialTheme(): Theme {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'dark' || saved === 'light') return saved
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light'
        }
    } catch {
        // Fallback for private mode
    }
    return 'dark'
}

export function saveTheme(theme: Theme): void {
    try {
        localStorage.setItem(STORAGE_KEY, theme)
    } catch {
        // Ignore quota
    }
}
