import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'
import type { DashboardStatsResponse, PeriodFilter } from '@/types/dashboard'

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
    const cacheKey = `seller_dashboard_stats_${user.id}_${period}`
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

    // Get approved bookings for this seller
    let bookingsQuery = supabase
      .from('bookings')
      .select('id, total_amount, commission_amount, trip_schedule_id')
      .eq('seller_id', user.id)
      .eq('status', 'approved')

    if (dateFilter) {
      bookingsQuery = bookingsQuery.gte('created_at', dateFilter)
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery

    if (bookingsError) {
      console.error('Bookings query error:', bookingsError)
      throw bookingsError
    }

    // Calculate total sales
    const totalSales = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0

    // Calculate unique trips count
    const uniqueTripScheduleIds = new Set(bookings?.map(b => b.trip_schedule_id).filter(Boolean) || [])

    // Get unique trip IDs from schedules
    let tripsCount = 0
    if (uniqueTripScheduleIds.size > 0) {
      const scheduleIds = Array.from(uniqueTripScheduleIds) as string[]
      const { data: schedules } = await supabase
        .from('trip_schedules')
        .select('trip_id')
        .in('id', scheduleIds)

      const uniqueTripIds = new Set(schedules?.map(s => s.trip_id).filter((id): id is string => id !== null) || [])
      tripsCount = uniqueTripIds.size
    }

    // Get commission payments
    let commissionsQuery = supabase
      .from('commission_payments')
      .select('amount, status')
      .eq('seller_id', user.id)

    if (dateFilter) {
      commissionsQuery = commissionsQuery.gte('created_at', dateFilter)
    }

    const { data: commissions, error: commissionsError } = await commissionsQuery

    if (commissionsError) {
      console.error('Commissions query error:', commissionsError)
    }

    // Calculate paid and pending commissions
    const paidCommissions = commissions
      ?.filter(c => c.status === 'paid')
      ?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    const pendingCommissions = commissions
      ?.filter(c => c.status === 'pending')
      ?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    // Get commission goal from user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('commission_goal')
      .eq('id', user.id)
      .single()

    const commissionGoal = profile?.commission_goal || 50000 // Default goal 50,000 THB

    // Calculate progress to goal using total paid commission (same as คอมมิชชั่นรวม)
    const progress = commissionGoal > 0 ? Math.min((paidCommissions / commissionGoal) * 100, 100) : 0

    const response: DashboardStatsResponse = {
      stats: {
        totalSales,
        tripsCount,
        totalCommission: paidCommissions,
        pendingCommission: pendingCommissions
      },
      commissionGoal: {
        current: paidCommissions,
        goal: commissionGoal,
        progress
      }
    }

    // Cache for 30 seconds
    apiCache.set(cacheKey, response, 30000)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { commission_goal } = body

    if (typeof commission_goal !== 'number' || commission_goal < 0) {
      return NextResponse.json({ error: 'Invalid commission goal' }, { status: 400 })
    }

    // Update user profile
    const { error } = await supabase
      .from('user_profiles')
      .update({ commission_goal })
      .eq('id', user.id)

    if (error) {
      throw error
    }

    // Clear cache
    apiCache.clearPattern(`seller_dashboard_stats_${user.id}`)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update commission goal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
