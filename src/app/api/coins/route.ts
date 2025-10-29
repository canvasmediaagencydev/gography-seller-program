import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const transactionType = searchParams.get('transaction_type') || ''
    const startDate = searchParams.get('start_date') || ''
    const endDate = searchParams.get('end_date') || ''

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create cache key
    const cacheKey = `coins_${user.id}_${page}_${pageSize}_${transactionType}_${startDate}_${endDate}`

    // Check cache first
    const cachedResult = apiCache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Get coin balance
    const { data: coinBalance, error: balanceError } = await supabase
      .from('seller_coins')
      .select('*')
      .eq('seller_id', user.id)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Error fetching coin balance:', balanceError)
      return NextResponse.json({ error: 'Failed to fetch coin balance' }, { status: 500 })
    }

    // Build transactions query
    let transactionsQuery = supabase
      .from('coin_transactions')
      .select('*', { count: 'exact' })
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (transactionType) {
      transactionsQuery = transactionsQuery.eq('transaction_type', transactionType as any)
    }
    if (startDate) {
      transactionsQuery = transactionsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      transactionsQuery = transactionsQuery.lte('created_at', endDate)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    transactionsQuery = transactionsQuery.range(from, to)

    const { data: transactions, error: transactionsError, count } = await transactionsQuery

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const result = {
      balance: coinBalance || {
        seller_id: user.id,
        locked_balance: 0,
        redeemable_balance: 0,
        total_balance: 0,
        total_earned: 0,
        total_redeemed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Calculate total_balance if coinBalance exists
      ...(coinBalance && {
        balance: {
          ...coinBalance,
          total_balance: (coinBalance.locked_balance || 0) + (coinBalance.redeemable_balance || 0)
        }
      }),
      transactions: transactions || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }

    // Cache the result for 30 seconds
    apiCache.set(cacheKey, result, 30000)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/coins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
