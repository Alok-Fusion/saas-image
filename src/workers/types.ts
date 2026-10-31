export interface PaletteColor {
    hex: string
    rgb: string
    count: number
    percentage: number
}

export type ColorblindMatrix = [[number, number, number], [number, number, number], [number, number, number]]

export const CHAR_SETS = {
    standard: ' .:-=+*#%@',
    blocks: ' ░▒▓█',
    simple: ' .-:=+*#',
} as const

export type CharSetKey = keyof typeof CHAR_SETS

export type ImageWorkerInput =
    | { kind: 'ascii'; file: File; width: number; charSet: CharSetKey; inverted: boolean }
    | { kind: 'palette'; file: File; numColors: number }
    | { kind: 'hash'; file: File }
    | { kind: 'colorblind'; file: File; matrix: ColorblindMatrix; maxDimension?: number }
    | {
        kind: 'inpaint'
        data: ArrayBuffer
        width: number
        height: number
        x: number
        y: number
        sw: number
        sh: number
    }

export interface WorkerSuccess<T = unknown> {
    id?: number
    ok: true
    result: T
}

export interface WorkerFailure {
    id?: number
    ok: false
    error: string
}

export interface WorkerProgress {
    type: 'progress'
    progress: number
}

export type WorkerResponse<T = unknown> = WorkerSuccess<T> | WorkerFailure | WorkerProgress
