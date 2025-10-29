import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { redirect, notFound } from 'next/navigation'

export default async function ShortLinkPage({
  params,
}: {
  params: Promise<{ code: string }> | { code: string }
}) {
  // Handle both sync and async params (Next.js 13 vs 15)
  const resolvedParams = params instanceof Promise ? await params : params
  const { code } = resolvedParams

  if (!code) {
    notFound()
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Fetch short link using admin client (bypasses RLS)
  const { data: shortLink, error } = await supabaseAdmin
    .from('short_links')
    .select('*')
    .eq('short_code', code)
    .maybeSingle()

  if (error) {
    console.error('Error fetching short link:', error)
    notFound()
  }

  if (!shortLink) {
    console.log('Short link not found for code:', code)
    notFound()
  }

  // Check if link is active
  if (!shortLink.is_active) {
    console.log('Short link is inactive:', code)
    notFound()
  }

  // Check if link has expired
  if (shortLink.expires_at) {
    const expiresAt = new Date(shortLink.expires_at)
    const now = new Date()
    if (now > expiresAt) {
      console.log('Short link has expired:', code)
      notFound()
    }
  }

  // Increment click count (async, don't wait for it)
  supabaseAdmin
    .from('short_links')
    .update({ click_count: shortLink.click_count + 1 })
    .eq('id', shortLink.id)
    .then(() => {
      console.log('Click count incremented for:', code)
    })
    .catch((err) => {
      console.error('Error incrementing click count:', err)
    })

  // Redirect to destination - this will throw a NEXT_REDIRECT error which is expected
  // Don't catch this error, let Next.js handle it
  redirect(shortLink.destination_url)
}
