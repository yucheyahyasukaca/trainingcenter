# Fix Referral System Script
# Script ini untuk memperbaiki sistem referral yang error

Write-Host "🔧 Fixing Referral System..." -ForegroundColor Yellow

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in to Supabase
try {
    $status = supabase status 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
    Write-Host "✅ Connected to Supabase" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Supabase. Please login first:" -ForegroundColor Red
    Write-Host "   supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Checking referral tables..." -ForegroundColor Blue

# Check current tables
try {
    $dbUrl = (supabase status | Select-String "DB URL").ToString().Split(":")[1].Trim()
    
    Write-Host "🔍 Checking existing tables..." -ForegroundColor Blue
    Get-Content "check-referral-tables.sql" | psql $dbUrl
    
    Write-Host "🔧 Ensuring referral tables exist..." -ForegroundColor Blue
    Get-Content "ensure-referral-tables.sql" | psql $dbUrl
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Referral system fixed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 What was fixed:" -ForegroundColor Cyan
        Write-Host "   • Ensured all referral tables exist" -ForegroundColor White
        Write-Host "   • Created missing functions" -ForegroundColor White
        Write-Host "   • Created missing views" -ForegroundColor White
        Write-Host "   • Added missing columns to enrollments" -ForegroundColor White
        Write-Host "   • Set up RLS policies" -ForegroundColor White
        Write-Host "   • Created indexes" -ForegroundColor White
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Restart your development server" -ForegroundColor White
        Write-Host "   2. Try accessing the referral dashboard again" -ForegroundColor White
        Write-Host "   3. Check browser console for any remaining errors" -ForegroundColor White
    } else {
        Write-Host "❌ Fix failed. Please check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error fixing referral system: $_" -ForegroundColor Red
    Write-Host "Please check your Supabase connection and try again." -ForegroundColor Yellow
    exit 1
}
