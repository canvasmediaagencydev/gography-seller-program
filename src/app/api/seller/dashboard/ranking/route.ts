import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'
import type { RankingResponse, PeriodFilter } from '@/types/dashboard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'all') as PeriodFilter

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cache key
    const cacheKey = `seller_ranking_${user.id}_${period}`
    const cachedResult = apiCache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Calculate date range based on period
    let dateFilter = ''
    const now = new Date()
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = weekAgo.toISOString()
    } else if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      dateFilter = monthStart.toISOString()
    }

    // Get all approved sellers
    const { data: sellers } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'seller')
      .eq('status', 'approved')

    const sellerIds = sellers?.map(s => s.id) || []
    const totalSellers = sellerIds.length

    if (totalSellers === 0) {
      const response: RankingResponse = {
        ranking: {
          rank: 0,
          totalSellers: 0,
          totalSales: 0,
          nextRankThreshold: null,
          progressToNextRank: 0
        }
      }
      return NextResponse.json(response)
    }

    // Get all approved bookings grouped by seller
    let bookingsQuery = supabase
      .from('bookings')
      .select('seller_id, total_amount')
      .eq('status', 'approved')
      .in('seller_id', sellerIds)

    if (dateFilter) {
      bookingsQuery = bookingsQuery.gte('created_at', dateFilter)
    }

    const { data: allBookings } = await bookingsQuery

    // Calculate total sales per seller
    const sellerSales: { [key: string]: number } = {}
    sellerIds.forEach(id => {
      sellerSales[id] = 0
    })

    allBookings?.forEach(booking => {
      if (booking.seller_id) {
        sellerSales[booking.seller_id] = (sellerSales[booking.seller_id] || 0) + (booking.total_amount || 0)
      }
    })

    // Sort sellers by sales
    const sortedSellers = Object.entries(sellerSales)
      .map(([id, sales]) => ({ id, sales }))
      .sort((a, b) => b.sales - a.sales)

    // Find current user's rank
    const userRank = sortedSellers.findIndex(s => s.id === user.id) + 1
    const userSales = sellerSales[user.id] || 0

    // Find next rank threshold
    let nextRankThreshold: number | null = null
    let progressToNextRank = 100

    if (userRank > 1) {
      // Get the seller above current user
      const sellerAbove = sortedSellers[userRank - 2]
      nextRankThreshold = sellerAbove.sales

      // Calculate progress to next rank
      if (nextRankThreshold > 0) {
        progressToNextRank = Math.min((userSales / nextRankThreshold) * 100, 100)
      }
    }

    const response: RankingResponse = {
      ranking: {
        rank: userRank,
        totalSellers,
        totalSales: userSales,
        nextRankThreshold,
        progressToNextRank
      }
    }

    // Cache for 1 minute
    apiCache.set(cacheKey, response, 60000)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Ranking API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
