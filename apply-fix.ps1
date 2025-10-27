# Script untuk apply fix learning contents RLS policy
# Ini akan menampilkan SQL yang perlu dijalankan di Supabase

Write-Host "========================================" -ForegroundColor Cyan
政党Host "FIX: Learning Contents Not Showing All" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Script SQL yang perlu dijalankan di Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host ""

$sqlFix = @"
-- Drop policy lama
DROP POLICY IF EXISTS "Users can view published content" ON public.learning_contents;

-- Buat policy baru yang benar
CREATE POLICY "Users can view published content"
ON public.learning_contents
FOR SELECT
TO authenticated
USING (
    status = 'published' AND (
        is_free = true
        OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.participants p ON e.participant_id = p.id
            JOIN public.classes c ON e.class_id = c.id
            WHERE c.id = learning_contents.class_id
            AND p.user_id = auth.uid()
            AND e.status = 'approved'
        )
    )
);
"@

Write-Host $sqlFix -ForegroundColor White

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cara menjalankan:" -ForegroundColor Yellow
Write-Host "1. Buka https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Pilih project Anda" -ForegroundColor White
Write-Host "3. Pergi ke SQL Editor" -ForegroundColor White
Write-Host "4. Copy-paste SQL di atas" -ForegroundColor White
Write-Host "5. Klik Run atau tekan Ctrl+Enter" -ForegroundColor White
Write-Host "6. Restart aplikasi Next.js" -ForegroundColor White
Write-Host "7. Clear browser cache dan test ulang" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

