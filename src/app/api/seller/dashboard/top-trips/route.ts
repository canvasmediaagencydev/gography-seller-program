import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiCache } from '@/lib/cache'
import type { TopTripsResponse, PeriodFilter } from '@/types/dashboard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'all') as PeriodFilter
    const limit = parseInt(searchParams.get('limit') || '3')

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
    const cacheKey = `seller_top_trips_${user.id}_${period}_${limit}`
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

    // Get bookings with trip info using admin client to bypass RLS on joined tables
    let bookingsQuery = adminClient
      .from('bookings')
      .select(`
        id,
        total_amount,
        commission_amount,
        trip_schedule_id,
        trip_schedules!inner (
          id,
          trip_id,
          trips!inner (
            id,
            title,
            cover_image_url
          )
        )
      `)
      .eq('seller_id', user.id)
      .eq('status', 'approved')

    if (dateFilter) {
      bookingsQuery = bookingsQuery.gte('created_at', dateFilter)
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery

    if (bookingsError) {
      console.error('Top trips query error:', bookingsError)
      throw bookingsError
    }

    // Aggregate by trip
    const tripStats: { [key: string]: {
      tripId: string
      tripTitle: string
      coverImageUrl: string | null
      bookingsCount: number
      totalAmount: number
      commission: number
    }} = {}

    bookings?.forEach((booking: any) => {
      const trip = booking.trip_schedules?.trips
      if (!trip) return

      const tripId = trip.id

      if (!tripStats[tripId]) {
        tripStats[tripId] = {
          tripId,
          tripTitle: trip.title,
          coverImageUrl: trip.cover_image_url,
          bookingsCount: 0,
          totalAmount: 0,
          commission: 0
        }
      }

      tripStats[tripId].bookingsCount += 1
      tripStats[tripId].totalAmount += booking.total_amount || 0
      tripStats[tripId].commission += booking.commission_amount || 0
    })

    // Sort by bookings count and take top N
    const sortedTrips = Object.values(tripStats)
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, limit)

    const response: TopTripsResponse = {
      trips: sortedTrips
    }

    // Cache for 2 minutes
    apiCache.set(cacheKey, response, 120000)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Top trips API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
