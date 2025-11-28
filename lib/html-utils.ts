/**
 * Sanitize HTML to remove potentially dangerous tags and attributes
 * Only removes dangerous content, preserves all safe HTML tags
 */
function sanitizeHTML(html: string): string {
    if (!html) return ''
    
    let sanitized = html
    
    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // Remove style tags and their content (but preserve inline styles in style attributes)
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    
    // Remove event handlers (onclick, onload, etc.)
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
    
    // Remove javascript: and data: URLs from href and src
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src="#"')
    sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, 'href="#"')
    
    // Ensure all links open in new tab safely
    sanitized = sanitized.replace(/<a\s+([^>]*href\s*=\s*["'][^"']*["'][^>]*)>/gi, (match, attrs) => {
        if (!attrs.includes('target=')) {
            return match.replace('>', ' target="_blank" rel="noopener noreferrer">')
        }
        return match
    })
    
    return sanitized
}

/**
 * Clean up HTML content from rich text editor
 * Removes excessive spacing and normalizes HTML for email
 * Preserves inline styles and important formatting
 */
export function cleanEmailHTML(html: string): string {
    if (!html) return ''
    
    // First sanitize to remove dangerous content
    let cleaned = sanitizeHTML(html)

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
    
    // Remove multiple consecutive spaces and newlines in text content
    // This handles cases where Quill adds extra whitespace
    cleaned = cleaned.replace(/\s{2,}/g, ' ')
    
    // Remove spaces between closing and opening tags (except for inline elements)
    cleaned = cleaned.replace(/(<\/[^>]+>)\s+(<[^/][^>]*>)/g, (match, closingTag, openingTag) => {
      // Preserve space for inline elements
      const inlineElements = ['span', 'a', 'strong', 'em', 'b', 'i', 'u', 's', 'code', 'mark']
      const tagName = openingTag.match(/<(\w+)/)?.[1]?.toLowerCase()
      if (tagName && inlineElements.includes(tagName)) {
        return match // Keep space for inline elements
      }
      return closingTag + openingTag // Remove space for block elements
    })
    
    // Remove leading/trailing spaces in block elements
    cleaned = cleaned.replace(/(<p[^>]*>)\s+/g, '$1')
    cleaned = cleaned.replace(/\s+(<\/p>)/g, '$1')
    cleaned = cleaned.replace(/(<h[1-6][^>]*>)\s+/g, '$1')
    cleaned = cleaned.replace(/\s+(<\/h[1-6]>)/g, '$1')

    // Decode HTML entities that might have been double-encoded
    // But only decode if they're not part of a valid HTML tag
    // This ensures that &lt; becomes < and &gt; becomes > for proper rendering
    // But we need to be careful not to break existing tags
    
    // First, decode double-encoded entities in text content (not in tags)
    // We'll decode entities that appear outside of < > brackets
    const decodedParts: string[] = []
    let decodeLastIndex = 0
    const tagRegex2 = /<[^>]+>/g
    let match2
    
    while ((match2 = tagRegex2.exec(cleaned)) !== null) {
        // Add text before tag (decode entities here)
        if (match2.index > decodeLastIndex) {
            let text = cleaned.substring(decodeLastIndex, match2.index)
            // Decode HTML entities in text content
            text = text.replace(/&lt;/g, '<')
            text = text.replace(/&gt;/g, '>')
            text = text.replace(/&amp;amp;/g, '&amp;')
            text = text.replace(/&quot;/g, '"')
            text = text.replace(/&#39;/g, "'")
            text = text.replace(/&#x27;/g, "'")
            decodedParts.push(text)
        }
        // Add tag as-is (don't decode entities in tags)
        decodedParts.push(match2[0])
        decodeLastIndex = match2.index + match2[0].length
    }
    
    // Add remaining text
    if (decodeLastIndex < cleaned.length) {
        let text = cleaned.substring(decodeLastIndex)
        // Decode HTML entities in remaining text
        text = text.replace(/&lt;/g, '<')
        text = text.replace(/&gt;/g, '>')
        text = text.replace(/&amp;amp;/g, '&amp;')
        text = text.replace(/&quot;/g, '"')
        text = text.replace(/&#39;/g, "'")
        text = text.replace(/&#x27;/g, "'")
        decodedParts.push(text)
    }
    
    cleaned = decodedParts.join('')

    return cleaned.trim()
}
