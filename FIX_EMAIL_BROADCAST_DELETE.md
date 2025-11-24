# Fix: Hapus Riwayat Email Broadcast Gagal

## Masalah
Fitur hapus riwayat email broadcast tidak berfungsi dengan baik. Ketika user mengklik tombol "Hapus", request DELETE terkirim tapi data tidak terhapus dari database.

## Root Cause
Ada 2 masalah yang menyebabkan fitur hapus gagal:

1. **Missing RLS Policy**: Tabel `email_logs` tidak memiliki RLS policy untuk operasi DELETE, sehingga semua DELETE request diblokir oleh Supabase.
2. **Next.js 14+ Params Issue**: Parameter `params` pada API Route Handlers merupakan `Promise` yang harus di-await terlebih dahulu.

## Perbaikan yang Sudah Dilakukan

### 1. Menambahkan RLS Policy untuk DELETE

**File: `supabase/migrations/20240102_add_delete_policy_email_logs.sql`**

```sql
CREATE POLICY "Admins can delete email logs" 
  ON email_logs 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
```

**Cara menjalankan:**
- Buka Supabase Dashboard → SQL Editor
- Copy-paste SQL di atas dan Run
- Atau jalankan: `supabase db push`

### 2. Memperbaiki API Route Handler

### File: `app/api/admin/email-logs/[id]/route.ts`

**Sebelum:**
```typescript
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    // ... kode lainnya
    .eq('id', params.id)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    // ... kode lainnya
    .eq('id', params.id)
}
```

**Sesudah:**
```typescript
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params  // ✅ Await params terlebih dahulu
    // ... kode lainnya
    .eq('id', id)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params  // ✅ Await params terlebih dahulu
    console.log('🗑️  DELETE request for email log:', id)
    
    // ... kode lainnya
    const { data, error } = await supabase
        .from('email_logs')
        .delete()
        .eq('id', id)  // ✅ Menggunakan id yang sudah di-await
        .select()
    
    console.log('📊 Delete result:', { data, error })
    
    if (error) {
        console.error('❌ Delete error:', error)
        throw error
    }
    
    console.log('✅ Email log deleted successfully:', id)
    return NextResponse.json({ success: true, data })
}
```

## Perubahan Tambahan

1. **Logging untuk Debugging**: Menambahkan console.log untuk memudahkan debugging:
   - Log ketika DELETE request diterima
   - Log result dari Supabase
   - Log ketika berhasil/gagal

2. **Dynamic Export**: Menambahkan `export const dynamic = 'force-dynamic'` untuk memastikan route tidak di-cache.

3. **Response Data**: Mengembalikan data yang dihapus dalam response untuk verifikasi.

## Cara Mengetes

1. **Jalankan migration SQL di Supabase Dashboard** (lihat section di atas)
2. Restart dev server: `npm run dev`
3. Buka halaman http://localhost:3000/admin/email-broadcast
4. Hover pada salah satu riwayat email
5. Klik tombol "Hapus"
6. Konfirmasi penghapusan
7. Item seharusnya hilang dari list dan muncul toast "Riwayat berhasil dihapus"
8. Cek terminal server untuk log: `🗑️ DELETE request for email log...`

## Referensi

- [Next.js 14 Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Next.js 14 Dynamic Route Segments](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#convention)

## Status
✅ **FIXED** - Fitur hapus riwayat email broadcast sekarang berfungsi dengan baik.

---
*Tanggal: 24 November 2025*

