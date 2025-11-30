import crypto from 'crypto'

const ALLOWED_FILE_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    document: ['application/pdf'],
    video: ['video/mp4', 'video/webm']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_EXTENSIONS = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    document: ['pdf'],
    video: ['mp4', 'webm']
}

export function validateFile(
    file: File,
    allowedCategory: 'image' | 'document' | 'video'
): { valid: boolean; error?: string } {
    // 1. Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File terlalu besar. Maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB`
        }
    }

    // 2. Check MIME type
    if (!ALLOWED_FILE_TYPES[allowedCategory].includes(file.type)) {
        return {
            valid: false,
            error: `Tipe file tidak diizinkan. Diizinkan: ${ALLOWED_FILE_TYPES[allowedCategory].join(', ')}`
        }
    }

    // 3. Check extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS[allowedCategory].includes(ext)) {
        return {
            valid: false,
            error: 'Ekstensi file tidak diizinkan'
        }
    }

    return { valid: true }
}

export function generateSecureFileName(originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'
    return `${crypto.randomUUID()}.${ext}`
}
