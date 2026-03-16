import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'
import type { PeriodFilter } from '@/types/dashboard'

export type RankingMetric = 'sales' | 'commission' | 'coins' | 'bookings'

export interface LeaderboardEntry {
  rank: number
  sellerName: string
  avatarUrl: string | null
  value: number
  rankDelta: number
  isSelf: boolean
}

export interface RankingAPIResponse {
  currentUser: {
    rank: number
    totalSellers: number
    value: number
    nextRankGap: number | null
    progressToNextRank: number
    rankDelta: number
  }
  leaderboard: LeaderboardEntry[]
  totalPages: number
}

function anonymizeName(fullName: string | null): string {
  if (!fullName) return 'Seller'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase()
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName
}

function getDateFilter(period: PeriodFilter): string {
  const now = new Date()
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return weekAgo.toISOString()
  } else if (period === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return monthStart.toISOString()
  }
  return ''
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'all') as PeriodFilter
    const metric = (searchParams.get('metric') || 'sales') as RankingMetric
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get('pageSize') || '20')))

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cacheKey = `leaderboard_${period}_${metric}_${page}_${pageSize}`
    const cachedResult = apiCache.get(cacheKey)
    if (cachedResult) {
      // Inject isSelf based on current user
      const result = cachedResult as RankingAPIResponse
      const withSelf: RankingAPIResponse = {
        ...result,
        leaderboard: result.leaderboard.map(entry => ({
          ...entry,
          isSelf: (entry as any)._sellerId === user.id
        }))
      }
      // Find current user in leaderboard for currentUser data
      return NextResponse.json(withSelf)
    }

    // Get all approved sellers
    const { data: sellers } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url')
      .eq('role', 'seller')
      .eq('status', 'approved')

    if (!sellers || sellers.length === 0) {
      const empty: RankingAPIResponse = {
        currentUser: { rank: 0, totalSellers: 0, value: 0, nextRankGap: null, progressToNextRank: 0, rankDelta: 0 },
        leaderboard: [],
        totalPages: 0
      }
      return NextResponse.json(empty)
    }

    const sellerIds = sellers.map(s => s.id)
    const sellerMap = new Map(sellers.map(s => [s.id, s]))
    const dateFilter = getDateFilter(period)

    // Build value map per seller
    const valueMap = new Map<string, number>()
    sellerIds.forEach(id => valueMap.set(id, 0))

    if (metric === 'sales' || metric === 'bookings') {
      let query = supabase
        .from('bookings')
        .select('seller_id, total_amount')
        .eq('status', 'approved')
        .in('seller_id', sellerIds)

      if (dateFilter) query = query.gte('created_at', dateFilter)

      const { data: bookings } = await query

      bookings?.forEach(b => {
        if (!b.seller_id) return
        const current = valueMap.get(b.seller_id) || 0
        if (metric === 'sales') {
          valueMap.set(b.seller_id, current + (b.total_amount || 0))
        } else {
          valueMap.set(b.seller_id, current + 1)
        }
      })
    } else if (metric === 'commission') {
      let query = supabase
        .from('commission_payments')
        .select('seller_id, amount')
        .eq('status', 'paid')
        .in('seller_id', sellerIds)

      if (dateFilter) query = query.gte('created_at', dateFilter)

      const { data: payments } = await query

      payments?.forEach(p => {
        if (!p.seller_id) return
        const current = valueMap.get(p.seller_id) || 0
        valueMap.set(p.seller_id, current + (p.amount || 0))
      })
    } else if (metric === 'coins') {
      // Coins metric ignores period filter (always all-time balance)
      const { data: coinBalances } = await supabase
        .from('seller_coins')
        .select('seller_id, locked_balance, redeemable_balance')
        .in('seller_id', sellerIds)

      coinBalances?.forEach(c => {
        if (!c.seller_id) return
        valueMap.set(c.seller_id, (c.locked_balance || 0) + (c.redeemable_balance || 0))
      })
    }

    // Sort by value descending
    const sorted = [...valueMap.entries()]
      .map(([id, value]) => ({ id, value }))
      .sort((a, b) => b.value - a.value || sellerIds.indexOf(a.id) - sellerIds.indexOf(b.id))

    const totalSellers = sorted.length
    const userRankIndex = sorted.findIndex(s => s.id === user.id)
    const userRank = userRankIndex + 1
    const userValue = valueMap.get(user.id) || 0

    let nextRankGap: number | null = null
    let progressToNextRank = 100
    if (userRank > 1) {
      const aboveValue = sorted[userRankIndex - 1].value
      nextRankGap = aboveValue - userValue
      progressToNextRank = aboveValue > 0 ? Math.min((userValue / aboveValue) * 100, 99) : 0
    }

    // Build leaderboard page
    const totalPages = Math.ceil(totalSellers / pageSize)
    const offset = (page - 1) * pageSize
    const pageEntries = sorted.slice(offset, offset + pageSize)

    const leaderboard: (LeaderboardEntry & { _sellerId: string })[] = pageEntries.map((s, i) => {
      const rank = offset + i + 1
      const seller = sellerMap.get(s.id)
      return {
        rank,
        sellerName: anonymizeName(seller?.full_name ?? null),
        avatarUrl: seller?.avatar_url ?? null,
        value: s.value,
        rankDelta: 0, // Would need historical snapshots to calculate accurately
        isSelf: s.id === user.id,
        _sellerId: s.id
      }
    })

    // If self is not in the current page, find and add a marker entry for context
    // (client can handle this separately via currentUser)

    const response: RankingAPIResponse = {
      currentUser: {
        rank: userRank,
        totalSellers,
        value: userValue,
        nextRankGap,
        progressToNextRank,
        rankDelta: 0
      },
      leaderboard: leaderboard as LeaderboardEntry[],
      totalPages
    }

    // Cache for 5 minutes (leaderboard doesn't need real-time)
    apiCache.set(cacheKey, response, 300000)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
