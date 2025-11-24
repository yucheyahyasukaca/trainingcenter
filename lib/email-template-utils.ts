/**
 * Available template variables that can be used in email templates
 */
export const TEMPLATE_VARIABLES = {
    nama: 'Nama lengkap user',
    email: 'Email user',
    program: 'Nama program yang diikuti',
    kode_referral: 'Kode referral user',
    tanggal_daftar: 'Tanggal pendaftaran',
    role: 'Role user (trainer/participant)',
} as const

export type TemplateVariableKey = keyof typeof TEMPLATE_VARIABLES

/**
 * User data interface for template replacement
 */
export interface TemplateUserData {
    nama?: string
    email?: string
    program?: string
    kode_referral?: string
    tanggal_daftar?: string
    role?: string
    [key: string]: string | undefined
}

/**
 * Replace template variables with actual user data
 * Example: "Halo {{nama}}, selamat datang!" -> "Halo John Doe, selamat datang!"
 * 
 * @param template - The template string containing variables in {{variable}} format
 * @param userData - Object containing user data to replace variables with
 * @returns The template with all variables replaced
 */
export function replaceTemplateVariables(
    template: string,
    userData: TemplateUserData
): string {
    let result = template

    // Replace each variable in the template
    Object.keys(TEMPLATE_VARIABLES).forEach((key) => {
        const variableKey = key as TemplateVariableKey
        const regex = new RegExp(`{{\\s*${variableKey}\\s*}}`, 'g')
        const value = userData[variableKey] || ''
        
        // Log replacement for debugging
        if (variableKey === 'nama') {
            console.log(`🔄 Replacing {{${variableKey}}} dengan: "${value}"`)
        }
        
        // Only replace if value exists, otherwise leave the variable as-is
        if (value) {
            result = result.replace(regex, value)
        } else {
            console.warn(`⚠️ Variable {{${variableKey}}} tidak memiliki value, akan tetap sebagai {{${variableKey}}}`)
        }
    })

    return result
}

/**
 * Get a list of all variables used in a template
 * 
 * @param template - The template string to analyze
 * @returns Array of variable names found in the template
 */
export function getUsedVariables(template: string): string[] {
    const regex = /{{(\s*\w+\s*)}}/g
    const matches = Array.from(template.matchAll(regex))
    const variables = new Set<string>()

    for (const match of matches) {
        const variableName = match[1].trim()
        if (variableName in TEMPLATE_VARIABLES) {
            variables.add(variableName)
        }
    }

    return Array.from(variables)
}

/**
 * Validate if all variables in template are valid
 * 
 * @param template - The template string to validate
 * @returns Object with isValid flag and array of invalid variables
 */
export function validateTemplateVariables(template: string): {
    isValid: boolean
    invalidVariables: string[]
} {
    const regex = /{{(\s*\w+\s*)}}/g
    const matches = Array.from(template.matchAll(regex))
    const invalidVariables: string[] = []

    for (const match of matches) {
        const variableName = match[1].trim()
        if (!(variableName in TEMPLATE_VARIABLES)) {
            invalidVariables.push(variableName)
        }
    }

    return {
        isValid: invalidVariables.length === 0,
        invalidVariables,
    }
}

/**
 * Format date for template display
 */
export function formatTemplateDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}
