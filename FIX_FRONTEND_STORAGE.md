# Fix Frontend Storage Code

## Problem
The frontend is still trying to use signed URLs (`object/sign`) which are causing "Object not found" errors.

## Solution
Update the frontend code to use public URLs instead of signed URLs.

### 1. Update the enrollment page upload function

Replace the file upload code in `app/programs/[id]/enroll/page.tsx`:

```typescript
// OLD CODE (causing errors):
const { data: signedUrlData, error: signedUrlError } = await supabase.storage
  .from('payment-proofs')
  .createSignedUrl(filePath, 60 * 60 * 24 * 365)

// NEW CODE (use public URL):
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('payment-proofs')
  .upload(filePath, paymentProof)

if (uploadError) throw uploadError

// Use public URL directly
const publicUrl = `https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/${filePath}`
```

### 2. Complete updated upload function

```typescript
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

  // Use public URL directly (no signed URL needed)
  proofUrl = `https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/${filePath}`
}
```

### 3. Update file display function

For displaying payment proofs, use public URLs:

```typescript
// Function to get payment proof URL
const getPaymentProofUrl = (enrollment: any) => {
  if (!enrollment.payment_proof_url) return null
  
  // If it's already a public URL, return as is
  if (enrollment.payment_proof_url.includes('supabase.garuda-21.com/storage/v1/object/public/')) {
    return enrollment.payment_proof_url
  }
  
  // If it's a signed URL or old format, try to extract the file path
  const filePath = enrollment.payment_proof_url.split('payment-proofs/')[1]
  if (filePath) {
    return `https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/${filePath}`
  }
  
  return null
}
```

### 4. Update the enrollment display component

```typescript
const PaymentProofDisplay = ({ enrollment }: { enrollment: any }) => {
  const proofUrl = getPaymentProofUrl(enrollment)
  
  if (!proofUrl) return null

  return (
    <div className="mt-2">
      <a
        href={proofUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:text-primary-700 text-sm underline"
      >
        Lihat Bukti Pembayaran
      </a>
    </div>
  )
}
```

### 5. Test the fix

1. Run the database script `COMPLETE_STORAGE_RESET.sql`
2. Update the frontend code as shown above
3. Try uploading a new payment proof
4. Check if existing payment proofs can be accessed

### 6. Alternative: Quick fix for existing URLs

If you want to quickly fix existing URLs without changing the frontend:

```sql
-- Update existing URLs to use public format
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/' || 
  substring(payment_proof_url from 'payment-proofs/(.*)$')
WHERE payment_proof_url IS NOT NULL 
AND payment_proof_url NOT LIKE '%supabase.garuda-21.com/storage/v1/object/public/%';
```

## Notes

- Public URLs don't expire like signed URLs
- No need for authentication to access public files
- Simpler and more reliable for this use case
- Make sure the bucket is set to public in Supabase dashboard
