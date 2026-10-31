import type { ColorblindMatrix, ImageWorkerInput, PaletteColor, WorkerProgress } from '../workers/types'

export interface WorkerTask<T> {
    promise: Promise<T>
    cancel: () => void
}

interface RunOptions {
    transfer?: Transferable[]
    onProgress?: (progress: number) => void
}

export function runImageTask<T>(input: ImageWorkerInput, options: RunOptions = {}): WorkerTask<T> {
    const worker = new Worker(new URL('../workers/image.worker.ts', import.meta.url), {
        type: 'module',
    })

    let settled = false
    let rejectTask: (error: Error) => void = () => {}
    const promise = new Promise<T>((resolve, reject) => {
        rejectTask = reject
        worker.onmessage = (event: MessageEvent<{ ok?: boolean; result?: T; error?: string } & Partial<WorkerProgress>>) => {
            const data = event.data
            if (data.type === 'progress' && typeof data.progress === 'number') {
                options.onProgress?.(data.progress)
                return
            }
            if (settled) return
            settled = true
            worker.terminate()
            if (data.ok) resolve(data.result as T)
            else reject(new Error(data.error || 'Worker failed'))
        }

        worker.onerror = (event) => {
            if (settled) return
            settled = true
            worker.terminate()
            reject(new Error(event.message || 'Worker failed'))
        }

        worker.postMessage({ ...input, id: 1 }, options.transfer ?? [])
    })

    return {
        promise,
        cancel: () => {
            if (settled) return
            settled = true
            worker.terminate()
            const error = new Error('Cancelled')
            error.name = 'AbortError'
            rejectTask(error)
        },
    }
}

export type { ColorblindMatrix, PaletteColor }
