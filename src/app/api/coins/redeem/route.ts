import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { coin_amount, bank_account_id } = body

    // Validation
    if (!coin_amount || coin_amount <= 0) {
      return NextResponse.json({ error: 'Invalid coin amount' }, { status: 400 })
    }

    if (!bank_account_id) {
      return NextResponse.json({ error: 'Bank account is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify bank account belongs to user
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', bank_account_id)
      .eq('seller_id', user.id)
      .single()

    if (bankError || !bankAccount) {
      return NextResponse.json({ error: 'Invalid bank account' }, { status: 400 })
    }

    // Check coin balance
    const { data: coinBalance, error: balanceError } = await supabase
      .from('seller_coins')
      .select('balance')
      .eq('seller_id', user.id)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Error fetching coin balance:', balanceError)
      return NextResponse.json({ error: 'Failed to fetch coin balance' }, { status: 500 })
    }

    const currentBalance = coinBalance?.balance || 0

    if (currentBalance < coin_amount) {
      return NextResponse.json({
        error: 'Insufficient coin balance',
        current_balance: currentBalance,
        requested_amount: coin_amount
      }, { status: 400 })
    }

    // Calculate cash amount (1 coin = 1 baht by default)
    const conversion_rate = 1.0
    const cash_amount = coin_amount * conversion_rate

    // Create redemption request
    const { data: redemption, error: redemptionError } = await supabase
      .from('coin_redemptions')
      .insert({
        seller_id: user.id,
        coin_amount,
        cash_amount,
        conversion_rate,
        bank_account_id,
        status: 'pending'
      })
      .select()
      .single()

    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError)
      return NextResponse.json({ error: 'Failed to create redemption request' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Redemption request created successfully',
      redemption
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/coins/redeem:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
