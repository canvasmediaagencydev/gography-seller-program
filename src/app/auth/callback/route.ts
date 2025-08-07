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

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalhost = forwardedHost?.includes('localhost')
      
      if (isLocalhost) {
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=Something went wrong`)
}
