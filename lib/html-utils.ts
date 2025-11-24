/**
 * Clean up HTML content from rich text editor
 * Removes excessive spacing and normalizes HTML for email
 * Preserves inline styles and important formatting
 */
export function cleanEmailHTML(html: string): string {
    if (!html) return ''
    
    let cleaned = html

    // Replace &nbsp; with regular space (React Quill uses &nbsp; for spaces)
    // But be careful - only replace standalone &nbsp;, not those in attributes
    cleaned = cleaned.replace(/(?<!["'])(&nbsp;)(?!["'])/g, ' ')

    // Remove empty paragraphs (but preserve divs with content)
    cleaned = cleaned.replace(/<p><br\s*\/?><\/p>/gi, '')
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '')

    // Replace multiple <br> tags with single one (max 2 consecutive)
    cleaned = cleaned.replace(/(<br\s*\/?>){3,}/gi, '<br><br>')

    // Remove leading/trailing whitespace in paragraphs (but preserve content)
    cleaned = cleaned.replace(/<p>(\s+)/g, '<p>')
    cleaned = cleaned.replace(/(\s+)<\/p>/g, '</p>')

    // Normalize whitespace in text nodes only (not in attributes or tags)
    // Split by tags, normalize text, then rejoin
    const parts: string[] = []
    let lastIndex = 0
    const tagRegex = /<[^>]+>/g
    let match

    while ((match = tagRegex.exec(cleaned)) !== null) {
        // Add text before tag (normalized)
        if (match.index > lastIndex) {
            const text = cleaned.substring(lastIndex, match.index)
            // Normalize multiple spaces to single space
            const normalized = text.replace(/\s{2,}/g, ' ')
            parts.push(normalized)
        }
        // Add tag as-is (preserves attributes and styles)
        parts.push(match[0])
        lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < cleaned.length) {
        const text = cleaned.substring(lastIndex)
        const normalized = text.replace(/\s{2,}/g, ' ')
        parts.push(normalized)
    }

    cleaned = parts.join('')

    // Final cleanup: remove excessive spacing between block elements
    // But preserve single line breaks for readability
    cleaned = cleaned.replace(/(<\/p>)\s{2,}(<p>)/g, '</p><p>')
    cleaned = cleaned.replace(/(<\/h[1-6]>)\s{2,}(<p>)/g, '$1<p>')
    cleaned = cleaned.replace(/(<\/p>)\s{2,}(<h[1-6]>)/g, '</p>$2')
    cleaned = cleaned.replace(/(<\/div>)\s{2,}(<div)/g, '</div><div')

    return cleaned.trim()
}
