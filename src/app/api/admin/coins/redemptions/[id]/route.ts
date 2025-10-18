import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, rejection_reason, notes } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'paid'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason is required when rejecting' }, { status: 400 })
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Get redemption details
    const { data: redemption, error: fetchError } = await supabase
      .from('coin_redemptions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !redemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 })
    }

    // Check if redemption is in pending status
    if (redemption.status !== 'pending' && redemption.status !== 'approved') {
      return NextResponse.json({
        error: `Cannot update redemption with status: ${redemption.status}`
      }, { status: 400 })
    }

    // If approving or rejecting, we need to use admin client to deduct coins
    const adminSupabase = createAdminClient()

    // Build update object
    const updateData: any = {
      status
    }

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = user.id

      // Deduct coins from seller balance using the add_coin_transaction function
      const { error: deductError } = await adminSupabase.rpc('add_coin_transaction', {
        p_seller_id: redemption.seller_id,
        p_transaction_type: 'redeem',
        p_source_type: 'admin',
        p_source_id: id,
        p_amount: -redemption.coin_amount,
        p_description: `Coin redemption approved: ${redemption.coin_amount} coins to ${redemption.cash_amount} THB`,
        p_metadata: {
          redemption_id: id,
          cash_amount: redemption.cash_amount,
          conversion_rate: redemption.conversion_rate
        }
      })

      if (deductError) {
        console.error('Error deducting coins:', deductError)
        return NextResponse.json({ error: 'Failed to deduct coins: ' + deductError.message }, { status: 500 })
      }
    }

    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason
    }

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    // Update redemption
    const { data: updatedRedemption, error: updateError } = await supabase
      .from('coin_redemptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating redemption:', updateError)
      return NextResponse.json({ error: 'Failed to update redemption' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Redemption ${status} successfully`,
      redemption: updatedRedemption
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/coins/redemptions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
