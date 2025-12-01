export function getAppBaseUrl(): string {
    // Check for standard environment variables
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL
    }

    // Check for Vercel environment variable
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`
    }

    // Production fallback
    if (process.env.NODE_ENV === 'production') {
        return 'https://academy.garuda-21.com'
    }

    // Fallback to localhost for development
    return 'http://localhost:3000'
}

export function getEmailBaseUrl(): string {
    // Check for specific email base URL first (optional override)
    if (process.env.NEXT_PUBLIC_EMAIL_BASE_URL) {
        return process.env.NEXT_PUBLIC_EMAIL_BASE_URL
    }

    // Check standard app URL, but ignore localhost
    if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
        return process.env.NEXT_PUBLIC_APP_URL
    }

    // Always fallback to production URL for emails
    // This ensures emails sent from local dev still point to production
    return 'https://academy.garuda-21.com'
}
