import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export interface AuthResult {
    user: any
    profile: any
}

// Create a Supabase client with the service role key for admin operations
// But for verifying the USER's session, we should use the anon key and the user's token
// Or we can use the service key to verify the token if we extract it manually

export async function validateAuth(request: NextRequest): Promise<AuthResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
        throw new Error('Unauthorized: No token provided')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
        throw new Error('Unauthorized: Invalid token')
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        throw new Error('Profile not found')
    }

    return { user, profile }
}

export async function validateAdmin(request: NextRequest): Promise<AuthResult> {
    const { user, profile } = await validateAuth(request)

    if (profile.role !== 'admin' && profile.role !== 'manager') {
        throw new Error('Forbidden: Admin access required')
    }

    return { user, profile }
}

export function withAdmin(
    handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        try {
            const auth = await validateAdmin(req)
            return await handler(req, auth)
        } catch (error: any) {
            console.error('[AuthError]', error.message)
            const status = error.message.startsWith('Unauthorized') ? 401 : 403
            return NextResponse.json(
                { error: error.message },
                { status }
            )
        }
    }
}
