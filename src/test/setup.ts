import { afterEach, beforeEach, vi } from 'vitest'

// Tell React we are in a testing environment that supports act()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let urlCounter = 0

beforeEach(() => {
    urlCounter = 0
    globalThis.URL.createObjectURL = vi.fn((_blob: Blob) => `blob:mock-url-${++urlCounter}`)
    globalThis.URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
    vi.clearAllMocks()
    try {
        localStorage.clear()
    } catch {
        // Ignore in environments without localStorage
    }
})
