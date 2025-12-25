export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat('id-ID').format(number)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
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

  // Split by lines to process line-by-line for better control
  const lines = text.split('\n')
  let htmlContent = ''

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Process headings first (must be at start of line)
    if (line.match(/^### /)) {
      // H3
      line = line.replace(/^### (.+)$/, '<h3>$1</h3>')
    } else if (line.match(/^## /)) {
      // H2
      line = line.replace(/^## (.+)$/, '<h2>$1</h2>')
    } else if (line.match(/^# /)) {
      // H1
      line = line.replace(/^# (.+)$/, '<h1>$1</h1>')
    } else if (line.match(/^- /)) {
      // Bullet list item
      line = line.replace(/^- (.+)$/, '<li>$1</li>')
      // Check if previous line was also a list item
      if (i === 0 || !lines[i - 1].match(/^- /)) {
        line = '<ul style="list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0;">' + line
      }
      // Check if next line is not a list item
      if (i === lines.length - 1 || !lines[i + 1].match(/^- /)) {
        line = line + '</ul>'
      }
    } else if (line.match(/^\d+\. /)) {
      // Numbered list item
      line = line.replace(/^\d+\. (.+)$/, '<li>$1</li>')
      // Check if previous line was also a list item
      if (i === 0 || !lines[i - 1].match(/^\d+\. /)) {
        line = '<ol style="list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0;">' + line
      }
      // Check if next line is not a list item
      if (i === lines.length - 1 || !lines[i + 1].match(/^\d+\. /)) {
        line = line + '</ol>'
      }
    } else if (line.trim() === '') {
      // Empty line - skip it, we'll add <br /> only if needed and not for headings/lists
      continue
    } else {
      // Regular paragraph - wrap in <p> tag and process inline formatting
      line = '<p>' + line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-2" />')
        .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>') + '</p>'
    }

    htmlContent += line
  }

  return htmlContent
}

export function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only compress images
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'))
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          file.type,
          quality
        )
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}
