/**
 * Central site URL configuration.
 * Defaults to the production domain https://imagekitpro.cc.
 * Can be overridden via VITE_SITE_URL in staging / previews.
 */
export const SITE_URL: string =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) || 'https://imagekitpro.cc'

export function getCanonicalUrl(path: string = '/'): string {
    const normalized = path.startsWith('/') ? path : `/${path}`
    return `${SITE_URL}${normalized === '/' ? '/' : normalized}`
}
