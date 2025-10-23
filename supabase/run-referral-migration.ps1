# Referral System Migration Script for Windows
# Jalankan script ini untuk menginstall sistem referral ke database Supabase

Write-Host "🚀 Starting Referral System Migration..." -ForegroundColor Green

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

Write-Host "📋 Running database migration..." -ForegroundColor Blue

# Run the referral system SQL
try {
    # Get the database URL
    $dbUrl = (supabase status | Select-String "DB URL").ToString().Split(":")[1].Trim()
    
    # Run the SQL file
    Write-Host "📝 Applying referral system schema..." -ForegroundColor Blue
    Get-Content "create-referral-system.sql" | psql $dbUrl
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Referral system migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 What was created:" -ForegroundColor Cyan
        Write-Host "   • referral_codes table" -ForegroundColor White
        Write-Host "   • referral_tracking table" -ForegroundColor White
        Write-Host "   • referral_rewards table" -ForegroundColor White
        Write-Host "   • Database functions for referral management" -ForegroundColor White
        Write-Host "   • Views for analytics" -ForegroundColor White
        Write-Host "   • Triggers for automation" -ForegroundColor White
        Write-Host "   • RLS policies for security" -ForegroundColor White
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Deploy the API endpoints" -ForegroundColor White
        Write-Host "   2. Deploy the UI components" -ForegroundColor White
        Write-Host "   3. Test the referral workflow" -ForegroundColor White
        Write-Host "   4. Train trainers on the new system" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 Documentation: REFERRAL_SYSTEM_DOCUMENTATION.md" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Migration failed. Please check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running migration: $_" -ForegroundColor Red
    Write-Host "Please check your Supabase connection and try again." -ForegroundColor Yellow
    exit 1
}
