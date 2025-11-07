import { NextRequest, NextResponse } from 'next/server'
import { notifyNewSellerRegistration } from '@/lib/line-notify'

/**
 * API endpoint to send LINE notification when a new seller registers
 * This is called from the client-side after email registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, registrationMethod } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Send LINE notification (this is non-blocking and won't fail the request)
    await notifyNewSellerRegistration({
      email,
      fullName,
      registrationMethod: registrationMethod || 'email'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in LINE notification endpoint:', error)
    // Return success even if notification fails - we don't want to break the registration flow
    return NextResponse.json({ success: true })
  }
}
