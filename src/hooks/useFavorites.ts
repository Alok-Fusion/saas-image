import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'imagekit_favorites'

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    }, [favorites])

    const toggleFavorite = useCallback((tool: string) => {
        setFavorites(prev =>
            prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
        )
    }, [])

    const isFavorite = useCallback((tool: string) => favorites.includes(tool), [favorites])

    return { favorites, toggleFavorite, isFavorite }
}
