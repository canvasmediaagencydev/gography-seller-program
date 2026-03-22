import { NextRequest, NextResponse } from 'next/server'
import { notifySellerProfileUpdate } from '@/lib/line-notify'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * API endpoint to send LINE notification when a seller completes their profile verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fullName, phone } = body

    if (!userId || !fullName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user email from Supabase Auth
    const supabase = await createClient()

    // Try to get email from user_profiles first
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single()

    let email = profile?.email

    // If no email in profile, get from auth.users using admin client
    if (!email) {
      const adminClient = createAdminClient()
      const { data: authData } = await adminClient.auth.admin.getUserById(userId)
      email = authData?.user?.email
    }

    if (!email) {
      console.error('User email not found')
      return NextResponse.json({ success: true })
    }

    // Send LINE notification (this is non-blocking and won't fail the request)
    await notifySellerProfileUpdate({
      email: email,
      fullName,
      phone,
      updateType: 'profile_completed'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in LINE notification endpoint:', error)
    // Return success even if notification fails - we don't want to break the verification flow
    return NextResponse.json({ success: true })
  }
}
