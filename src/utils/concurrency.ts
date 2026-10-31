export function getConcurrencyLimit(total: number): number {
    const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 2
    return Math.max(1, Math.min(4, cores, total))
}

/** Run tasks with a small concurrency limit while preserving result order. */
export async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    task: (item: T, index: number) => Promise<R>,
    onProgress?: (done: number, total: number) => void
): Promise<R[]> {
    const results = new Array<R>(items.length)
    let next = 0
    let done = 0

    const worker = async () => {
        while (true) {
            const index = next
            next += 1
            if (index >= items.length) return
            results[index] = await task(items[index], index)
            done += 1
            onProgress?.(done, items.length)
        }
    }

    await Promise.all(
        Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () => worker())
    )
    return results
}
