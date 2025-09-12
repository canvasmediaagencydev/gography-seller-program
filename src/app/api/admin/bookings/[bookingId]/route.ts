import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - Get single booking by ID (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const supabase = await createClient()
    
    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get booking data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Fetch related data
    let customer = null
    if (booking.customer_id) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, id_card, passport_number')
        .eq('id', booking.customer_id)
        .single()
      customer = customerData
    }

    let trip_schedules = null
    if (booking.trip_schedule_id) {
      const { data: scheduleData } = await supabase
        .from('trip_schedules')
        .select(`
          id,
          departure_date,
          return_date,
          registration_deadline,
          available_seats,
          trips (
            id,
            title,
            price_per_person,
            commission_type,
            commission_value,
            countries (
              name,
              flag_emoji
            )
          )
        `)
        .eq('id', booking.trip_schedule_id)
        .single()
      trip_schedules = scheduleData
    }

    // Get seller data using admin client
    let seller = null
    if (booking.seller_id) {
      const adminSupabase = createAdminClient()
      const { data: sellerData } = await adminSupabase
        .from('user_profiles')
        .select('id, full_name, email, referral_code, avatar_url')
        .eq('id', booking.seller_id)
        .single()
      seller = sellerData
    }

    // Get commission payments
    const { data: commission_payments } = await supabase
      .from('commission_payments')
      .select('id, payment_type, amount, status, paid_at')
      .eq('booking_id', bookingId)

    const bookingWithRelations = {
      ...booking,
      customers: customer,
      trip_schedules,
      seller,
      commission_payments: commission_payments || []
    }

    return NextResponse.json({
      booking: bookingWithRelations
    })

  } catch (error: any) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}