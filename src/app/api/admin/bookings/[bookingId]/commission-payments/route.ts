import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const supabase = await createClient()
    const { bookingId } = await params
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch commission payments for the booking
    const { data: commissionPayments, error } = await supabase
      .from('commission_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching commission payments:', error)
      return NextResponse.json({ error: 'Failed to fetch commission payments' }, { status: 500 })
    }

    return NextResponse.json(commissionPayments || [])

  } catch (error) {
    console.error('Error in commission payments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
