# Fix Referral Status Synchronization
# Script untuk menjalankan perbaikan sinkronisasi status referral

Write-Host "🔧 Running referral status synchronization fix..." -ForegroundColor Yellow

# Run the SQL fix
try {
    psql -h localhost -p 54322 -U postgres -d postgres -f supabase/fix-referral-status-sync.sql
    Write-Host "✅ Referral status synchronization fix completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error running the fix: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 What was fixed:" -ForegroundColor Cyan
Write-Host "   • Created/updated trigger to sync referral status with enrollment status"
Write-Host "   • Added manual backup function calls in admin approval process"
Write-Host "   • Synced all existing referral statuses"
Write-Host ""
Write-Host "🧪 To test the fix:" -ForegroundColor Yellow
Write-Host "   1. Go to admin payments page"
Write-Host "   2. Approve a pending payment"
Write-Host "   3. Check trainer referral dashboard - status should now show 'confirmed'"
Write-Host ""
Write-Host "🔄 To manually sync all referral statuses:" -ForegroundColor Cyan
Write-Host "   SELECT * FROM sync_all_referral_status();"
