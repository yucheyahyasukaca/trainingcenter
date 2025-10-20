# Fix Payment Proof Access Issue

## Problem
Error "Gagal Membuka File" meskipun file ada di bucket `payment-proofs`. Ini terjadi karena:
1. Signed URL sudah expired
2. RLS policies tidak mengizinkan akses
3. File path tidak sesuai dengan struktur bucket

## Solutions

### 1. Run Database Script
Execute `QUICK_FIX_PAYMENT_PROOFS.sql` in Supabase SQL Editor to:
- Fix bucket permissions
- Create fresh signed URLs
- Update RLS policies

### 2. Update Frontend Code

#### Update the enrollment page to handle payment proof URLs better:

```typescript
// app/programs/[id]/enroll/page.tsx

// Add this function to refresh payment proof URLs
async function refreshPaymentProofUrl(enrollmentId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_payment_proof_by_enrollment', { enrollment_id: enrollmentId })
      .single()
    
    if (error) throw error
    return data?.payment_proof_url
  } catch (error) {
    console.error('Error refreshing payment proof URL:', error)
    return null
  }
}

// Update the file upload handler
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = 'File harus berupa gambar (JPG, PNG) atau PDF'
      setError(errorMsg)
      addNotification({
        type: 'error',
        title: 'Format File Tidak Valid',
        message: errorMsg,
        duration: 5000
      })
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'Ukuran file maksimal 5MB'
      setError(errorMsg)
      addNotification({
        type: 'error',
        title: 'File Terlalu Besar',
        message: errorMsg,
        duration: 5000
      })
      return
    }

    setPaymentProof(file)
    setError('')
    
    // Show success notification for file selection
    addNotification({
      type: 'success',
      title: 'File Terpilih',
      message: `File "${file.name}" berhasil dipilih`,
      duration: 3000
    })
  }
}

// Update the enrollment creation to use proper file upload
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!program || !profile) return

  setSubmitting(true)
  setError('')

  try {
    // ... existing participant creation code ...

    // Upload payment proof if needed
    let proofUrl = ''
    if (program.price > 0 && paymentProof) {
      const fileExt = paymentProof.name.split('.').pop()
      const fileName = `${profile.id}_${program.id}_${Date.now()}.${fileExt}`
      const filePath = `${profile.id}/${fileName}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, paymentProof, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get signed URL for the uploaded file
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 days expiry

      if (signedUrlError) throw signedUrlError

      proofUrl = signedUrlData.signedUrl
    }

    // ... rest of enrollment creation code ...
  } catch (error: any) {
    console.error('Error enrolling:', error)
    const errorMessage = 'Gagal mendaftar: ' + error.message
    setError(errorMessage)
    
    addNotification({
      type: 'error',
      title: 'Gagal Mendaftar',
      message: errorMessage,
      duration: 8000
    })
  } finally {
    setSubmitting(false)
  }
}
```

#### Update the enrollment display page to refresh URLs:

```typescript
// app/my-enrollments/page.tsx

// Add this function to refresh payment proof URLs
const refreshPaymentProof = async (enrollmentId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_payment_proof_by_enrollment', { enrollment_id: enrollmentId })
      .single()
    
    if (error) throw error
    return data?.payment_proof_url
  } catch (error) {
    console.error('Error refreshing payment proof:', error)
    return null
  }
}

// Update the payment proof display component
const PaymentProofDisplay = ({ enrollment }: { enrollment: any }) => {
  const [proofUrl, setProofUrl] = useState(enrollment.payment_proof_url)
  const [loading, setLoading] = useState(false)

  const handleRefreshProof = async () => {
    setLoading(true)
    try {
      const newUrl = await refreshPaymentProof(enrollment.id)
      if (newUrl) {
        setProofUrl(newUrl)
        addNotification({
          type: 'success',
          title: 'URL Diperbarui',
          message: 'Link bukti pembayaran berhasil diperbarui',
          duration: 3000
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Gagal Memperbarui',
        message: 'Tidak dapat memperbarui link bukti pembayaran',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  if (!enrollment.payment_proof_url) return null

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2">
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 text-sm underline"
        >
          Lihat Bukti Pembayaran
        </a>
        <button
          onClick={handleRefreshProof}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          {loading ? 'Memperbarui...' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}
```

### 3. Alternative: Make Bucket Public (Less Secure)

If you want to make payment proofs publicly accessible (less secure but simpler):

```sql
-- Make payment-proofs bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';

-- Remove RLS policies
DROP POLICY IF EXISTS "Allow authenticated access to payment proofs" ON storage.objects;
```

### 4. Test the Fix

1. Run the database script
2. Try uploading a new payment proof
3. Check if existing payment proofs can be accessed
4. Verify the refresh functionality works

## Notes

- Signed URLs expire after a certain time (default 1 hour)
- The refresh function creates new signed URLs when needed
- RLS policies ensure only authenticated users can access files
- File paths should follow the pattern: `{user_id}/{filename}`
