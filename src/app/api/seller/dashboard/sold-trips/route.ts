import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiCache } from '@/lib/cache'
import type { SoldTripsResponse, PeriodFilter, CommissionStatusFilter } from '@/types/dashboard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'all') as PeriodFilter
    const commissionStatus = (searchParams.get('commissionStatus') || 'all') as CommissionStatusFilter
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to bypass RLS on trips/trip_schedules
    // (inactive trips should still appear in seller's sold history)
    const adminClient = createAdminClient()

    // Cache key
    const cacheKey = `seller_sold_trips_${user.id}_${period}_${commissionStatus}_${page}_${pageSize}`
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

    // Build query using admin client to bypass RLS on joined tables
    let bookingsQuery = adminClient
      .from('bookings')
      .select(`
        id,
        total_amount,
        commission_amount,
        created_at,
        trip_schedule_id,
        trip_schedules!inner (
          id,
          trip_id,
          departure_date,
          return_date,
          trips!inner (
            id,
            title,
            cover_image_url
          )
        ),
        customers (
          id,
          full_name
        )
      `, { count: 'exact' })
      .eq('seller_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (dateFilter) {
      bookingsQuery = bookingsQuery.gte('created_at', dateFilter)
    }

    // Get total count first
    const { count: totalCount, error: countError } = await bookingsQuery

    if (countError) {
      console.error('Sold trips count error:', countError)
      throw countError
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    bookingsQuery = bookingsQuery.range(from, to)

    const { data: bookings, error: bookingsError } = await bookingsQuery

    if (bookingsError) {
      console.error('Sold trips query error:', bookingsError)
      throw bookingsError
    }

    // Get commission payment statuses for these bookings
    const bookingIds = bookings?.map(b => b.id) || []

    let commissionMap: { [key: string]: 'paid' | 'pending' } = {}

    if (bookingIds.length > 0) {
      const { data: commissions } = await adminClient
        .from('commission_payments')
        .select('booking_id, status')
        .in('booking_id', bookingIds)
        .eq('seller_id', user.id)

      commissions?.forEach(c => {
        if (c.booking_id) {
          commissionMap[c.booking_id] = c.status === 'paid' ? 'paid' : 'pending'
        }
      })
    }

    // Map bookings to sold trips format
    let trips = bookings?.map((booking: any) => {
      const schedule = booking.trip_schedules
      const trip = schedule?.trips

      return {
        bookingId: booking.id,
        tripId: trip?.id || '',
        tripTitle: trip?.title || '',
        coverImageUrl: trip?.cover_image_url || null,
        departureDate: schedule?.departure_date || '',
        returnDate: schedule?.return_date || '',
        customerCount: 1, // Each booking is for one customer
        totalAmount: booking.total_amount || 0,
        commissionAmount: booking.commission_amount || 0,
        commissionStatus: commissionMap[booking.id] || 'pending' as const,
        createdAt: booking.created_at || ''
      }
    }) || []

    // Filter by commission status if specified
    if (commissionStatus !== 'all') {
      trips = trips.filter(t => t.commissionStatus === commissionStatus)
    }

    const filteredCount = commissionStatus !== 'all' ? trips.length : (totalCount || 0)

    const response: SoldTripsResponse = {
      trips,
      totalCount: filteredCount,
      currentPage: page,
      totalPages: Math.ceil(filteredCount / pageSize)
    }

    // Cache for 30 seconds
    apiCache.set(cacheKey, response, 30000)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Sold trips API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
