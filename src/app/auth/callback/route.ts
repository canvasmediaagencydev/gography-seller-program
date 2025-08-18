import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user profile exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      // If profile doesn't exist (Google signup), create one
      if (!profile) {
        const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
        
        await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            phone: '', // Will need to be updated later
            role: 'seller',
            status: 'pending'
          })
      }

      // Use production URL if available, fallback to origin
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
      return NextResponse.redirect(`${redirectUrl}${next}`)
    }
  }

  // Return the user to an error page with instructions
  const errorRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
  return NextResponse.redirect(`${errorRedirectUrl}/auth/login?error=Something went wrong`)
}
