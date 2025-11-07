import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { notifyNewSellerRegistration } from '@/lib/line-notify'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const role = searchParams.get('role') ?? 'seller'

  console.log('Callback - Environment NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
  console.log('Callback - Origin:', origin)

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

      let finalRedirectPath = next
      
      // If profile doesn't exist (Google signup), create one
      if (!profile) {
        const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''

        await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            phone: '', // Will need to be updated later
            role: role,
            status: 'pending'
          })

        // Send LINE notification to admin (non-blocking)
        notifyNewSellerRegistration({
          email: data.user.email || '',
          fullName: fullName,
          registrationMethod: 'google'
        }).catch(err => console.error('Failed to send LINE notification:', err))

        // For new users (registration), use role-based redirect
        finalRedirectPath = role === 'admin' ? '/dashboard/admin/sellers' : '/dashboard/trips'
      } else {
        // For existing users (login), use their existing role
        finalRedirectPath = profile.role === 'admin' ? '/dashboard/admin/sellers' : '/dashboard/trips'
      }

      // Always use the origin that the user came from to avoid redirect loops
      // This ensures we redirect to the same domain the user is currently on
      console.log('Callback - Final redirect URL:', `${origin}${finalRedirectPath}`)
      return NextResponse.redirect(`${origin}${finalRedirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=Something went wrong`)
}
