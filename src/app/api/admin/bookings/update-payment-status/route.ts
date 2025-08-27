import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  handleDepositPayment, 
  handleFullPayment, 
  handleCancellationAfterDeposit 
} from '@/utils/commissionUtils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { bookingId, paymentStatus } = await request.json()

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

    // Get current booking to check previous payment status
    const { data: currentBooking } = await supabase
      .from('bookings')
      .select('payment_status, total_amount, deposit_amount')
      .eq('id', bookingId)
      .single()

    if (!currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Handle different payment status transitions
    try {
      switch (paymentStatus) {
        case 'deposit_paid':
          // Calculate deposit amount if not set
          if (!currentBooking.deposit_amount) {
            const depositAmount = currentBooking.total_amount * 0.5 // 50% deposit
            const remainingAmount = currentBooking.total_amount - depositAmount
            
            await supabase
              .from('bookings')
              .update({
                deposit_amount: depositAmount,
                remaining_amount: remainingAmount
              })
              .eq('id', bookingId)
          }
          
          await handleDepositPayment(bookingId)
          break

        case 'fully_paid':
          await handleFullPayment(bookingId)
          break

        case 'cancelled':
          // Only handle commission cancellation if deposit was paid
          if (currentBooking.payment_status === 'deposit_paid') {
            await handleCancellationAfterDeposit(bookingId)
          } else {
            // Just update booking status if no deposit was paid
            await supabase
              .from('bookings')
              .update({
                payment_status: 'cancelled',
                cancelled_at: new Date().toISOString()
              })
              .eq('id', bookingId)
          }
          break

        case 'pending':
          // Reset to pending status
          await supabase
            .from('bookings')
            .update({
              payment_status: 'pending',
              deposit_paid_at: null,
              full_payment_at: null,
              cancelled_at: null
            })
            .eq('id', bookingId)
          
          // Reset commission payments to pending
          await supabase
            .from('commission_payments')
            .update({
              status: 'pending',
              paid_at: null
            })
            .eq('booking_id', bookingId)
          break

        default:
          return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
      }

      return NextResponse.json({ success: true })

    } catch (error) {
      console.error('Error handling payment status change:', error)
      return NextResponse.json({ 
        error: 'Failed to update payment status and commission flow' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in payment status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
