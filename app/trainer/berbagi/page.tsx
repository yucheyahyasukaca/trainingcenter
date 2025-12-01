import AmplifyDashboard from '@/components/dashboard/AmplifyDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'BERBAGI - Referral | Training Center',
    description: 'Program Referral Gemini untuk Pendidik',
}

export default function AmplifyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
            <div className="container mx-auto px-4 py-8">
                <AmplifyDashboard />
            </div>
        </div>
    )
}
