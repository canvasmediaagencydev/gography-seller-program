import { NextRequest, NextResponse } from 'next/server'
import { notifySellerProfileUpdate } from '@/lib/line-notify'
import { createClient } from '@/lib/supabase/server'

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

    // Get user email from user_profiles
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (!profile || !profile.email) {
      console.error('User profile not found or email missing')
      return NextResponse.json({ success: true })
    }

    // Send LINE notification (this is non-blocking and won't fail the request)
    await notifySellerProfileUpdate({
      email: profile.email,
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
