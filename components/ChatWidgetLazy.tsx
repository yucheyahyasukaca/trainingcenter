'use client'

import dynamic from 'next/dynamic'

// Chat dimuat belakangan (tidak ikut bundel awal) karena jarang dipakai.
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false })

export default function ChatWidgetLazy() {
  return <ChatWidget />
}
