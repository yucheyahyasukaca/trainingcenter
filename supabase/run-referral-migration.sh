#!/bin/bash

# Referral System Migration Script
# Jalankan script ini untuk menginstall sistem referral ke database Supabase

echo "🚀 Starting Referral System Migration..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if user is logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please login first:"
    echo "   supabase login"
    exit 1
fi

echo "📋 Running database migration..."

# Run the referral system SQL
supabase db reset --linked

# Apply the referral system schema
psql "$(supabase status | grep 'DB URL' | awk '{print $3}')" -f create-referral-system.sql

if [ $? -eq 0 ]; then
    echo "✅ Referral system migration completed successfully!"
    echo ""
    echo "📊 What was created:"
    echo "   • referral_codes table"
    echo "   • referral_tracking table" 
    echo "   • referral_rewards table"
    echo "   • Database functions for referral management"
    echo "   • Views for analytics"
    echo "   • Triggers for automation"
    echo "   • RLS policies for security"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Deploy the API endpoints"
    echo "   2. Deploy the UI components"
    echo "   3. Test the referral workflow"
    echo "   4. Train trainers on the new system"
    echo ""
    echo "📚 Documentation: REFERRAL_SYSTEM_DOCUMENTATION.md"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
