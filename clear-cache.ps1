# Clear Cache Script untuk Fix Bad Request Error
# Jalankan: .\clear-cache.ps1

Write-Host "🧹 Clearing Next.js Cache..." -ForegroundColor Yellow

# Clear Next.js build cache
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cleared .next directory" -ForegroundColor Green
}

# Clear node_modules/.cache if exists
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Cleared node_modules cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Cache cleared successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your dev server (npm run dev)"
Write-Host "2. Clear browser cache:"
Write-Host "   - Press Ctrl + Shift + Delete"
Write-Host "   - Or open DevTools Console (F12) and run:"
Write-Host "     localStorage.clear(); sessionStorage.clear(); location.reload();"
Write-Host "3. Hard refresh: Ctrl + Shift + R"
Write-Host ""

