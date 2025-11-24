# Troubleshooting: Email History Tidak Muncul di Production

## 🔍 Masalah
History email muncul di localhost tapi tidak muncul di production.

## ✅ Perbaikan yang Sudah Ditambahkan

1. **Enhanced Logging** di API endpoint
   - Log environment variables status
   - Log query results
   - Log error details

2. **Better Error Handling** di frontend
   - Check response type (array vs object)
   - Better error messages
   - Fallback ke empty array

3. **Force Dynamic** di API route
   - Mencegah caching issue
   - Memastikan data selalu fresh

## 🔧 Langkah Troubleshooting

### 1. Check Environment Variables di Production

Pastikan environment variables sudah diset di production:

```bash
# Vercel
NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key

# Railway
railway variables list

# Docker/Other
docker exec container env | grep SUPABASE
```

**Cara check:**
1. Login ke production dashboard (Vercel/Railway/etc)
2. Pergi ke **Settings** > **Environment Variables**
3. Pastikan kedua variable ada dan benar

### 2. Check Production Logs

**Vercel:**
1. Login ke Vercel Dashboard
2. Pilih project
3. Pergi ke **Deployments** > pilih deployment terbaru
4. Klik **Logs**
5. Cari log dengan keyword:
   - `🔍 Fetching email logs...`
   - `❌ Error fetching email logs`
   - `✅ Fetched X email logs`

**Railway:**
```bash
railway logs
```

**Docker:**
```bash
docker logs container-name
```

### 3. Check Browser Console

1. Buka production website
2. Buka browser DevTools (F12)
3. Pergi ke **Console** tab
4. Refresh halaman email broadcast
5. Cari log:
   - `🔄 Fetching email logs...`
   - `📡 Response status: 200`
   - `✅ Fetched X email logs`

### 4. Check Network Tab

1. Buka browser DevTools (F12)
2. Pergi ke **Network** tab
3. Refresh halaman
4. Cari request ke `/api/admin/email-logs`
5. Klik request tersebut
6. Check:
   - **Status**: Harus 200 (OK)
   - **Response**: Harus array `[]` atau array dengan data
   - **Headers**: Check jika ada error

### 5. Test API Endpoint Langsung

Test API endpoint di production:

```bash
# Ganti dengan URL production Anda
curl https://your-domain.com/api/admin/email-logs

# Atau dengan browser
# Buka: https://your-domain.com/api/admin/email-logs
```

**Expected Response:**
```json
[
  {
    "id": "...",
    "template_id": "...",
    "recipient_count": 1,
    "status": "sent",
    "sent_at": "2025-01-02T...",
    "email_templates": {
      "name": "...",
      "subject": "..."
    }
  }
]
```

**Jika Error:**
```json
{
  "error": "Error message",
  "details": {...}
}
```

### 6. Check Database Production

Pastikan data ada di database production:

1. Login ke Supabase Dashboard
2. Pilih project production
3. Pergi ke **Table Editor** > `email_logs`
4. Check apakah ada data

**Jika tidak ada data:**
- Email broadcast belum pernah dikirim di production
- Data hanya ada di local database

### 7. Check RLS Policy

Pastikan RLS policy sudah di-apply di production:

1. Login ke Supabase Dashboard
2. Pilih project production
3. Pergi ke **Authentication** > **Policies**
4. Cari table `email_logs`
5. Pastikan ada policy:
   - **SELECT**: "Admins can view email logs"
   - **DELETE**: "Admins can delete email logs"

**Jika policy tidak ada:**
- Run migration di production:
  ```bash
  supabase db push
  # atau
  supabase migration up
  ```

### 8. Check CORS/Network Issues

Jika API endpoint tidak bisa diakses:

1. Check browser console untuk CORS error
2. Check network tab untuk failed requests
3. Check firewall/proxy settings
4. Test dengan curl (lihat step 5)

## 🐛 Common Issues & Solutions

### Issue 1: "Missing Supabase configuration"

**Error:**
```json
{
  "error": "Supabase configuration missing",
  "details": {
    "url": false,
    "key": false
  }
}
```

**Solution:**
- Set environment variables di production
- Redeploy setelah set env vars

### Issue 2: "RLS policy violation"

**Error:**
```json
{
  "error": "new row violates row-level security policy"
}
```

**Solution:**
- Check RLS policy di Supabase
- Pastikan service role key digunakan (bypass RLS)

### Issue 3: "Table does not exist"

**Error:**
```json
{
  "error": "relation \"email_logs\" does not exist"
}
```

**Solution:**
- Run migrations di production
- Check apakah table sudah dibuat

### Issue 4: Empty Array Response

**Response:**
```json
[]
```

**Possible Causes:**
- Tidak ada data di database production
- Email broadcast belum pernah dikirim di production
- Data hanya ada di local database

**Solution:**
- Kirim broadcast baru di production
- Check database production untuk data

### Issue 5: CORS Error

**Error:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
- Check Next.js middleware
- Check Supabase CORS settings
- Check production server CORS config

## 📝 Checklist Debug

- [ ] Environment variables sudah diset di production
- [ ] Sudah redeploy setelah set env vars
- [ ] Check production logs untuk error
- [ ] Check browser console untuk error
- [ ] Test API endpoint langsung (curl/browser)
- [ ] Check database production untuk data
- [ ] Check RLS policy di production
- [ ] Check network tab untuk failed requests
- [ ] Compare local vs production environment

## 🚀 Quick Fix

Jika semua sudah dicek tapi masih tidak muncul:

1. **Force refresh browser:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

2. **Clear browser cache:**
   - Settings > Clear browsing data > Cached images and files

3. **Redeploy production:**
   ```bash
   # Vercel
   vercel --prod
   
   # Railway
   railway up
   ```

4. **Check API response langsung:**
   - Buka: `https://your-domain.com/api/admin/email-logs`
   - Lihat response di browser

## 📞 Next Steps

Jika masih tidak muncul setelah semua langkah di atas:

1. **Share production logs** (dari step 2)
2. **Share browser console logs** (dari step 3)
3. **Share API response** (dari step 5)
4. **Share database screenshot** (dari step 6)

Dengan informasi ini, kita bisa debug lebih lanjut.

---
**Last Updated:** 2025-01-02  
**Status:** ✅ Enhanced logging & error handling added

