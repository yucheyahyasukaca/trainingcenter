/**
 * Clean up HTML content from rich text editor
 * Removes excessive spacing and normalizes HTML
 */
export function cleanEmailHTML(html: string): string {
    // Remove empty paragraphs
    let cleaned = html.replace(/<p><br><\/p>/g, '<br>')

    // Replace multiple <br> tags with single one
    cleaned = cleaned.replace(/(<br\s*\/?>){3,}/gi, '<br><br>')

    // Remove leading/trailing whitespace in paragraphs
    cleaned = cleaned.replace(/<p>\s+/g, '<p>')
    cleaned = cleaned.replace(/\s+<\/p>/g, '</p>')

    // Normalize multiple spaces to single space
    cleaned = cleaned.replace(/\s{2,}/g, ' ')

    return cleaned.trim()
}
