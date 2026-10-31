import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { useFavorites } from './useFavorites'
import { useObjectUrl } from './useObjectUrl'
import { useRecentlyUsed } from './useRecentlyUsed'

function renderHookNative<T, P>(hook: (props: P) => T, initialProps?: P) {
    let current!: T
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    function TestComponent({ props }: { props: P }) {
        current = hook(props)
        return null
    }

    act(() => {
        root.render(<TestComponent props={initialProps as P} />)
    })

    return {
        get result() {
            return { current }
        },
        rerender(newProps?: P) {
            act(() => {
                root.render(<TestComponent props={newProps as P} />)
            })
        },
        unmount() {
            act(() => {
                root.unmount()
            })
            container.remove()
        },
    }
}

describe('Custom Hooks', () => {
    describe('useFavorites', () => {
        it('initializes with empty favorites', () => {
            const hook = renderHookNative(() => useFavorites())
            expect(hook.result.current.favorites).toEqual([])
            expect(hook.result.current.isFavorite('compressor')).toBe(false)
            hook.unmount()
        })

        it('toggles favorites on and off', () => {
            const hook = renderHookNative(() => useFavorites())

            act(() => {
                hook.result.current.toggleFavorite('compressor')
            })
            expect(hook.result.current.favorites).toContain('compressor')
            expect(hook.result.current.isFavorite('compressor')).toBe(true)

            act(() => {
                hook.result.current.toggleFavorite('compressor')
            })
            expect(hook.result.current.favorites).not.toContain('compressor')
            expect(hook.result.current.isFavorite('compressor')).toBe(false)
            hook.unmount()
        })

        it('handles localStorage errors gracefully without throwing', () => {
            const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('QuotaExceededError')
            })
            const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceededError')
            })

            const hook = renderHookNative(() => useFavorites())
            expect(hook.result.current.favorites).toEqual([])

            act(() => {
                hook.result.current.toggleFavorite('ocr')
            })
            expect(hook.result.current.isFavorite('ocr')).toBe(true)

            getItemSpy.mockRestore()
            setItemSpy.mockRestore()
            hook.unmount()
        })
    })

    describe('useRecentlyUsed', () => {
        it('adds recent tools in order and ignores home', () => {
            const hook = renderHookNative(() => useRecentlyUsed())

            act(() => {
                hook.result.current.addRecent('home')
            })
            expect(hook.result.current.recentTools).toEqual([])

            act(() => {
                hook.result.current.addRecent('compressor')
                hook.result.current.addRecent('resizer')
            })
            expect(hook.result.current.recentTools).toEqual(['resizer', 'compressor'])

            // re-adding compressor moves it to the front
            act(() => {
                hook.result.current.addRecent('compressor')
            })
            expect(hook.result.current.recentTools).toEqual(['compressor', 'resizer'])
            hook.unmount()
        })

        it('caps recent tools at maximum limit (6)', () => {
            const hook = renderHookNative(() => useRecentlyUsed())
            const tools = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']

            act(() => {
                tools.forEach(t => hook.result.current.addRecent(t))
            })

            expect(hook.result.current.recentTools.length).toBe(6)
            expect(hook.result.current.recentTools[0]).toBe('t8')
            hook.unmount()
        })
    })

    describe('useObjectUrl', () => {
        it('returns null for null or undefined blob', () => {
            const hook = renderHookNative(({ blob }) => useObjectUrl(blob), { blob: null as Blob | null })
            expect(hook.result.current).toBeNull()
            hook.unmount()
        })

        it('creates an object URL and revokes it on unmount', () => {
            const blob = new Blob(['sample'], { type: 'image/png' })
            const hook = renderHookNative(({ blob }) => useObjectUrl(blob), { blob: blob as Blob | null })

            expect(hook.result.current).toMatch(/^blob:/)
            const createdUrl = hook.result.current

            hook.unmount()
            expect(URL.revokeObjectURL).toHaveBeenCalledWith(createdUrl)
        })

        it('revokes the old URL when blob changes', () => {
            const blob1 = new Blob(['one'], { type: 'image/png' })
            const blob2 = new Blob(['two'], { type: 'image/png' })
            const hook = renderHookNative(({ blob }) => useObjectUrl(blob), { blob: blob1 as Blob | null })

            const firstUrl = hook.result.current
            expect(firstUrl).toBeTruthy()

            hook.rerender({ blob: blob2 })

            expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstUrl)
            expect(hook.result.current).not.toBe(firstUrl)
            hook.unmount()
        })
    })
})
