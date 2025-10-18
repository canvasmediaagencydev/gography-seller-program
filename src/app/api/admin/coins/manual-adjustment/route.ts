import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { seller_id, amount, description, reason } = body

    // Validation
    if (!seller_id || !amount || !description) {
      return NextResponse.json({
        error: 'Missing required fields: seller_id, amount, description'
      }, { status: 400 })
    }

    if (amount === 0) {
      return NextResponse.json({ error: 'Amount cannot be zero' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Verify seller exists
    const { data: seller, error: sellerError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('id', seller_id)
      .eq('role', 'seller')
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Use admin client to add/deduct coins
    const adminSupabase = createAdminClient()

    const transactionType = amount > 0 ? 'bonus' : 'adjustment'

    const { data: transactionId, error: adjustmentError } = await adminSupabase.rpc('add_coin_transaction', {
      p_seller_id: seller_id,
      p_transaction_type: transactionType,
      p_source_type: 'admin',
      p_source_id: null as any,
      p_amount: amount,
      p_description: description,
      p_metadata: {
        adjusted_by: user.id,
        adjusted_by_email: profile.email || '',
        reason: reason || '',
        manual_adjustment: true
      }
    })

    if (adjustmentError) {
      console.error('Error adjusting coins:', adjustmentError)
      return NextResponse.json({ error: 'Failed to adjust coins: ' + adjustmentError.message }, { status: 500 })
    }

    // Get updated balance
    const { data: updatedBalance } = await supabase
      .from('seller_coins')
      .select('*')
      .eq('seller_id', seller_id)
      .single()

    return NextResponse.json({
      message: `Successfully ${amount > 0 ? 'added' : 'deducted'} ${Math.abs(amount)} coins`,
      transaction_id: transactionId,
      seller: {
        id: seller.id,
        full_name: seller.full_name,
        email: seller.email
      },
      new_balance: updatedBalance?.balance || 0
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/coins/manual-adjustment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
