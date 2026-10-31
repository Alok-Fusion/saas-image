import { useEffect, useMemo } from 'react'

/**
 * Create an object URL for a blob and revoke it automatically when the blob
 * changes or the component unmounts.
 */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
    const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])

    useEffect(() => () => {
        if (url) URL.revokeObjectURL(url)
    }, [url])

    return url
}
