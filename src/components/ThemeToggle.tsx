import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getInitialTheme, saveTheme, type Theme } from '../utils/theme'

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme)

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        saveTheme(theme)
    }, [theme])

    const toggle = () => {
        setTheme(t => (t === 'dark' ? 'light' : 'dark'))
    }

    return (
        <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? (
                <Sun size={17} strokeWidth={2} />
            ) : (
                <Moon size={17} strokeWidth={2} />
            )}
        </button>
    )
}
