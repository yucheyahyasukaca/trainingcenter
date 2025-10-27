export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatTime(timeString: string): string {
  // Handle both "HH:MM:SS" and "HH:MM" formats
  const time = timeString.includes(':') ? timeString : `${timeString}:00`
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

// Convert markdown text to HTML with support for bullets and numbered lists
export function markdownToHtml(text: string): string {
  if (!text) return ''
  
  let htmlContent = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-2" />')
    // Links
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')

  // Handle bullet lists (- item)
  htmlContent = htmlContent.replace(/(?:^|\n)(?:- (.+)(?:\n|$))+/gim, (match) => {
    const items = match.match(/- (.+)/g) || []
    const listItems = items.map(item => item.replace(/- (.+)/, '<li>$1</li>')).join('\n')
    return `<ul style="list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0;">\n${listItems}\n</ul>`
  })

  // Handle numbered lists (1. item, 2. item, etc.)
  htmlContent = htmlContent.replace(/(?:^|\n)(?:^\d+\. (.+)(?:\n|$))+/gim, (match) => {
    const items = match.match(/\d+\. (.+)/g) || []
    const listItems = items.map(item => item.replace(/\d+\. (.+)/, '<li>$1</li>')).join('\n')
    return `<ol style="list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0;">\n${listItems}\n</ol>`
  })

  // Convert remaining newlines to <br />
  htmlContent = htmlContent.replace(/\n/g, '<br />')

  return htmlContent
}

