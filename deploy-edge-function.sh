#!/bin/bash

# Deploy Edge Function untuk Signup Without Email Confirmation
# Script ini akan deploy Edge Function ke Supabase

echo "🚀 Deploying Edge Function: signup-without-email-confirmation"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please login first:"
    echo "supabase login"
    exit 1
fi

# Deploy the function
echo "📦 Deploying function..."
supabase functions deploy signup-without-email-confirmation

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Test the function:"
    echo "   curl -X POST https://your-project.supabase.co/functions/v1/signup-without-email-confirmation \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
    echo "     -d '{\"email\":\"test@example.com\",\"password\":\"password123\",\"fullName\":\"Test User\"}'"
    echo ""
    echo "2. Test registration in your app:"
    echo "   http://localhost:3000/register/new"
    echo ""
    echo "🎉 Registration should now work without email confirmation!"
else
    echo "❌ Failed to deploy Edge Function"
    exit 1
fi
