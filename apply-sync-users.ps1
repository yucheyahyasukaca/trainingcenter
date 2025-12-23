# Script to help apply the user sync migration
$sqlFile = Join-Path $PSScriptRoot "supabase\migrations\20250101_sync_users.sql"

if (Test-Path $sqlFile) {
    $sqlContent = Get-Content $sqlFile -Raw
} else {
    Write-Error "Migration file not found at $sqlFile"
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "USER SYNC MECHANISM SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This SQL script will:" -ForegroundColor Yellow
Write-Host "1. Create a function to auto-create user profiles on signup"
Write-Host "2. Create a trigger to fire this function automatically"
Write-Host "3. Backfill profiles for any existing users who are missing them"
Write-Host ""
Write-Host "Please run the following SQL in your Supabase Dashboard SQL Editor:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host $sqlContent -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. Go to https://supabase.com/dashboard"
Write-Host "2. Select your project"
Write-Host "3. Open the SQL Editor"
Write-Host "4. Create a NEW query"
Write-Host "5. Paste the SQL above"
Write-Host "6. Click RUN"
Write-Host ""
Write-Host "After running this, try logging in with a Google account to verify!" -ForegroundColor Green
