# Certificate Production Issue - Root Cause & Solution

## Masalah

Setelah build untuk production, certificate tidak bisa diakses dengan error 500 pada endpoint berikut:
- `/api/admin/certificate-templates` 
- `/api/admin/certificate-requirements`

## Root Cause Analysis

### 1. **Missing Environment Variable di Production**

API routes certificate menggunakan `getSupabaseAdmin()` yang memerlukan environment variable:
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key dari Supabase

Environment variable ini **tidak ada** di production, sehingga API gagal initialize Supabase admin client dan mengembalikan error 500.

### 2. **Kenapa Bekerja di Localhost?**

Di localhost, environment variable ada di file `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Namun file ini **tidak di-deploy** ke production (karena security), jadi environment variable tidak tersedia.

### 3. **Error Handling yang Kurang Informatif**

API routes sebelumnya tidak memberikan error message yang jelas, sehingga sulit debugging.

## Solusi yang Diimplementasikan

### 1. **Improved Error Handling di `lib/supabase-admin.ts`**

Added detailed error messages untuk membantu debugging:

```typescript
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set')
    console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables')
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }

  // Log untuk production debugging
  if (process.env.NODE_ENV === 'production') {
    console.log('✓ Using Supabase admin client in production')
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}
```

### 2. **Improved Error Response di API Routes**

Updated error handling di semua certificate API routes:

```typescript
} catch (error: any) {
  console.error('Error in GET /api/admin/certificate-templates:', error)
  console.error('Error message:', error?.message)
  
  const errorMessage = error?.message || 'Internal server error'
  return NextResponse.json({ 
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
  }, { status: 500 })
}
```

### 3. **Files yang Diupdate**

- ✅ `lib/supabase-admin.ts` - Added detailed error logging
- ✅ `app/api/admin/certificate-templates/route.ts` - Improved error handling
- ✅ `app/api/admin/certificate-requirements/route.ts` - Improved error handling
- ✅ `app/api/admin/certificates/route.ts` - Improved error handling
- ✅ `app/api/admin/certificate-signatories/route.ts` - Improved error handling

## Cara Fix di Production

### Step 1: Tambahkan Environment Variable

**Via Vercel Dashboard:**

1. Login ke [Vercel Dashboard](https://vercel.com)
2. Pilih project Anda
3. Pergi ke **Settings** > **Environment Variables**
4. Klik **Add New**
5. Tambahkan variable:
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Service role key dari Supabase (Settings > API > service_role key)
   - **Environments**: Production (dan Preview jika perlu)
6. Klik **Save**

### Step 2: Redeploy

After adding the environment variable, you need to redeploy:

**Via Vercel Dashboard:**
1. Go to **Deployments**
2. Click the **⋮** menu on the latest deployment
3. Select **Redeploy**

**Via CLI:**
```bash
vercel --prod
```

### Step 3: Verify

1. Check production logs untuk memastikan environment variable loaded:
   ```
   ✓ Using Supabase admin client in production
   ✓ Supabase URL: https://...
   ✓ Service role key: eyJhbGc...
   ```

2. Test API endpoint:
   ```bash
   curl https://your-domain.com/api/admin/certificate-templates
   ```

3. Check browser console - seharusnya tidak ada error 500

## Security Notes

⚠️ **PENTING**: 
- Service role key adalah **secret** dan tidak boleh di-expose ke client
- **Jangan** commit `.env` files ke repository
- Service role key hanya digunakan di **server-side** API routes
- Use anon key untuk client-side operations

## Testing Checklist

- [ ] Environment variable `SUPABASE_SERVICE_ROLE_KEY` sudah ditambahkan di production
- [ ] Project sudah di-redeploy setelah set env var
- [ ] Production logs menampilkan "Using Supabase admin client in production"
- [ ] API `/api/admin/certificate-templates` berhasil diakses
- [ ] API `/api/admin/certificate-requirements` berhasil diakses
- [ ] Tidak ada error 500 di browser console
- [ ] Certificate management UI berfungsi dengan baik

## Expected Behavior

**Before Fix:**
```
GET https://academy.garuda-21.com/api/admin/certificate-templates
Status: 500 Internal Server Error
Response: { "error": "Internal server error" }
```

**After Fix:**
```
GET https://academy.garuda-21.com/api/admin/certificate-templates
Status: 200 OK
Response: { "data": [...] }
```

## References

- [PRODUCTION_ENV_SETUP.md](./PRODUCTION_ENV_SETUP.md) - Detailed setup guide
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys#service-role-key)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Summary

✅ **Root Cause**: Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable in production  
✅ **Solution**: Set environment variable and redeploy  
✅ **Improvement**: Better error handling and logging for easier debugging  
✅ **Result**: Certificate API berfungsi dengan baik di production  

