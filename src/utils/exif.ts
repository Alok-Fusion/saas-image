export interface ExifSummary {
    hasExif: boolean
    hasGps: boolean
    fields: Record<string, string>
}

interface TiffContext {
    view: DataView
    tiff: number
    little: boolean
}

interface IfdEntry {
    tag: number
    type: number
    count: number
    entryOffset: number
}

const ORIENTATION_NAMES: Record<number, string> = {
    1: 'Normal',
    2: 'Mirrored horizontally',
    3: 'Rotated 180°',
    4: 'Mirrored vertically',
    5: 'Mirrored and rotated 90° CW',
    6: 'Rotated 90° CW',
    7: 'Mirrored and rotated 90° CCW',
    8: 'Rotated 90° CCW',
}

function readAscii(ctx: TiffContext, entry: IfdEntry): string {
    const { view, tiff, little } = ctx
    const size = entry.count
    const position = size <= 4 ? entry.entryOffset + 8 : tiff + view.getUint32(entry.entryOffset + 8, little)
    let value = ''
    for (let i = 0; i < size; i++) {
        const code = view.getUint8(position + i)
        if (code === 0) break
        value += String.fromCharCode(code)
    }
    return value.trim()
}

function readShort(ctx: TiffContext, entry: IfdEntry): number {
    const { view, little } = ctx
    const position = entry.count * 2 <= 4 ? entry.entryOffset + 8 : ctx.tiff + view.getUint32(entry.entryOffset + 8, little)
    return view.getUint16(position, little)
}

function readRationals(ctx: TiffContext, entry: IfdEntry): number[] {
    const { view, little, tiff } = ctx
    const position = tiff + view.getUint32(entry.entryOffset + 8, little)
    const values: number[] = []
    for (let i = 0; i < entry.count; i++) {
        const numerator = view.getUint32(position + i * 8, little)
        const denominator = view.getUint32(position + i * 8 + 4, little)
        values.push(denominator === 0 ? 0 : numerator / denominator)
    }
    return values
}

function walkIfd(ctx: TiffContext, offset: number, callback: (entry: IfdEntry) => void): void {
    const { view, tiff, little } = ctx
    if (offset <= 0 || tiff + offset + 2 > view.byteLength) return
    const count = view.getUint16(tiff + offset, little)
    for (let i = 0; i < count; i++) {
        const entryOffset = tiff + offset + 2 + i * 12
        if (entryOffset + 12 > view.byteLength) return
        callback({
            tag: view.getUint16(entryOffset, little),
            type: view.getUint16(entryOffset + 2, little),
            count: view.getUint32(entryOffset + 4, little),
            entryOffset,
        })
    }
}

function formatCoordinate(values: number[], reference: string): string {
    if (values.length < 3) return ''
    const [degrees, minutes, seconds] = values
    return `${degrees}° ${minutes}′ ${seconds.toFixed(2)}″ ${reference}`
}

export async function parseExif(file: File): Promise<ExifSummary> {
    const summary: ExifSummary = { hasExif: false, hasGps: false, fields: {} }

    if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
        return summary
    }

    const buffer = await file.arrayBuffer()
    if (buffer.byteLength < 12) return summary
    const view = new DataView(buffer)
    if (view.getUint16(0) !== 0xffd8) return summary

    let offset = 2
    while (offset + 4 < view.byteLength) {
        if (view.getUint8(offset) !== 0xff) break
        const marker = view.getUint16(offset)
        if (marker === 0xffe1) {
            const length = view.getUint16(offset + 2)
            if (offset + 4 + 6 > view.byteLength) break
            const header = view.getUint32(offset + 4)
            if (header !== 0x45786966) {
                offset += 2 + length
                continue
            }

            const tiff = offset + 10
            if (tiff + 8 > view.byteLength) break
            const byteOrder = view.getUint16(tiff)
            if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) break
            const little = byteOrder === 0x4949
            if (view.getUint16(tiff + 2, little) !== 42) break

            summary.hasExif = true
            const ctx: TiffContext = { view, tiff, little }
            const ifd0 = view.getUint32(tiff + 4, little)

            let exifIfd = 0
            let gpsIfd = 0

            walkIfd(ctx, ifd0, (entry) => {
                try {
                    switch (entry.tag) {
                        case 0x010f: {
                            const make = readAscii(ctx, entry)
                            if (make) summary.fields['Camera make'] = make
                            break
                        }
                        case 0x0110: {
                            const model = readAscii(ctx, entry)
                            if (model) summary.fields['Camera model'] = model
                            break
                        }
                        case 0x0131: {
                            const software = readAscii(ctx, entry)
                            if (software) summary.fields['Software'] = software
                            break
                        }
                        case 0x0132: {
                            const modified = readAscii(ctx, entry)
                            if (modified) summary.fields['Date modified'] = modified
                            break
                        }
                        case 0x0112: {
                            const orientation = readShort(ctx, entry)
                            summary.fields['Orientation'] = ORIENTATION_NAMES[orientation] ?? `Tag ${orientation}`
                            break
                        }
                        case 0x8769:
                            exifIfd = view.getUint32(entry.entryOffset + 8, little)
                            break
                        case 0x8825:
                            gpsIfd = view.getUint32(entry.entryOffset + 8, little)
                            break
                    }
                } catch {
                    // Ignore malformed individual tags.
                }
            })

            if (exifIfd) {
                walkIfd(ctx, exifIfd, (entry) => {
                    try {
                        if (entry.tag === 0x9003) {
                            const taken = readAscii(ctx, entry)
                            if (taken) summary.fields['Date taken'] = taken
                        }
                    } catch {
                        // Ignore malformed date tags.
                    }
                })
            }

            if (gpsIfd) {
                let latitude = ''
                let longitude = ''
                let latitudeRef = 'N'
                let longitudeRef = 'E'
                let altitude = ''

                walkIfd(ctx, gpsIfd, (entry) => {
                    try {
                        switch (entry.tag) {
                            case 0x0001:
                                latitudeRef = readAscii(ctx, entry) || 'N'
                                break
                            case 0x0002:
                                latitude = formatCoordinate(readRationals(ctx, entry), latitudeRef)
                                break
                            case 0x0003:
                                longitudeRef = readAscii(ctx, entry) || 'E'
                                break
                            case 0x0004:
                                longitude = formatCoordinate(readRationals(ctx, entry), longitudeRef)
                                break
                            case 0x0006: {
                                const values = readRationals(ctx, entry)
                                if (values.length > 0 && values[0] > 0) altitude = `${values[0].toFixed(1)} m`
                                break
                            }
                        }
                    } catch {
                        // Ignore malformed GPS tags.
                    }
                })

                if (latitude && longitude) {
                    summary.hasGps = true
                    summary.fields['GPS location'] = `${latitude}, ${longitude}`
                }
                if (altitude) summary.fields['GPS altitude'] = altitude
            }

            break
        }

        if (marker === 0xffda) break
        const length = view.getUint16(offset + 2)
        if (length < 2) break
        offset += 2 + length
    }

    return summary
}
