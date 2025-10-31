import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { NotificationProvider } from '@/components/ui/Notification'
import { ToastProvider } from '@/contexts/ToastContext'
import ToastContainer from '@/components/ui/ToastContainer'
import { GlobalToaster } from '@/components/GlobalToaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Garuda Academy - GARUDA-21 Training Center',
  description: 'Program pelatihan eksklusif AI & teknologi untuk profesional Indonesia. Bergerak, hadirkan dampak nyata!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
              <GlobalToaster />
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

