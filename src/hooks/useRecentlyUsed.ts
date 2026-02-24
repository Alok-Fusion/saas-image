import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'imagekit_recent'
const MAX_RECENT = 6

export function useRecentlyUsed() {
    const [recentTools, setRecentTools] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentTools))
    }, [recentTools])

    const addRecent = useCallback((tool: string) => {
        if (tool === 'home') return
        setRecentTools(prev => {
            const filtered = prev.filter(t => t !== tool)
            return [tool, ...filtered].slice(0, MAX_RECENT)
        })
    }, [])

    return { recentTools, addRecent }
}
