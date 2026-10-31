import type { ImageInfo } from './imageProcessing'

export interface ImageWithHash {
    file: File
    url: string
    info: ImageInfo
    hash: string
}

export interface DuplicateGroup {
    hash: string
    images: ImageWithHash[]
}

export function calculateSimilarity(hash1: string, hash2: string): number {
    let differences = 0
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) differences++
    }
    return ((hash1.length - differences) / hash1.length) * 100
}

export function findDuplicates(imageList: ImageWithHash[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = []
    const processed = new Set<number>()

    for (let i = 0; i < imageList.length; i++) {
        if (processed.has(i)) continue

        const group: ImageWithHash[] = [imageList[i]]
        processed.add(i)

        for (let j = i + 1; j < imageList.length; j++) {
            if (processed.has(j)) continue

            const similarity = calculateSimilarity(imageList[i].hash, imageList[j].hash)

            if (similarity >= 90) {
                group.push(imageList[j])
                processed.add(j)
            }
        }

        if (group.length > 1) {
            groups.push({ hash: imageList[i].hash, images: group })
        }
    }

    return groups
}

