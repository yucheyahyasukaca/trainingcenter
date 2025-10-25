#!/bin/bash

# Fix Referral Status Synchronization
# Script untuk menjalankan perbaikan sinkronisasi status referral

echo "🔧 Running referral status synchronization fix..."

# Run the SQL fix
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/fix-referral-status-sync.sql

echo "✅ Referral status synchronization fix completed!"
echo ""
echo "📋 What was fixed:"
echo "   • Created/updated trigger to sync referral status with enrollment status"
echo "   • Added manual backup function calls in admin approval process"
echo "   • Synced all existing referral statuses"
echo ""
echo "🧪 To test the fix:"
echo "   1. Go to admin payments page"
echo "   2. Approve a pending payment"
echo "   3. Check trainer referral dashboard - status should now show 'confirmed'"
echo ""
echo "🔄 To manually sync all referral statuses:"
echo "   SELECT * FROM sync_all_referral_status();"
