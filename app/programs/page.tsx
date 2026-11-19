import { Suspense } from 'react'
import { createPublicClient } from '@/lib/supabase-public'
import ProgramsClient from './ProgramsClient'

// Halaman publik: daftar program dibaca di server dan di-cache 60 detik (ISR),
// sehingga data sudah ada di HTML dan tidak perlu menunggu rangkaian permintaan
// dari peramban. Bila gagal, null dikirim dan peramban mengambil sendiri.
export const revalidate = 60

async function getPrograms() {
  try {
    const supabase = createPublicClient()
    if (!supabase) return null
    const { data, error } = await supabase
      .from('programs')
      .select('*, classes:classes(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('ISR programs error:', error.message)
      return null
    }
    return data || []
  } catch (e: any) {
    console.error('ISR programs exception:', e?.message || e)
    return null
  }
}

export default async function ProgramsPage() {
  const programs = await getPrograms()
  return (
    <Suspense fallback={null}>
      <ProgramsClient initialPrograms={programs as any} />
    </Suspense>
  )
}
