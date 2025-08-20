import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '6')
    const filter = searchParams.get('filter') || 'all'
    const countries = searchParams.get('countries')?.split(',').filter(Boolean) || []
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get available countries from existing trips
    const { data: availableCountries } = await supabase
      .from('trips')
      .select(`
        country_id,
        countries (
          id,
          name,
          flag_emoji
        )
      `)
      .eq('is_active', true)
      .not('country_id', 'is', null)

    // Extract unique countries
    const uniqueCountries = availableCountries
      ?.filter((trip: any) => trip.countries)
      ?.reduce((acc: any[], trip: any) => {
        const country = trip.countries
        if (!acc.find(c => c.id === country.id)) {
          acc.push({
            id: country.id,
            name: country.name,
            flag_emoji: country.flag_emoji
          })
        }
        return acc
      }, [])
      ?.sort((a: any, b: any) => a.name.localeCompare(b.name)) || []

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || null

    // Build base query for counting (before pagination)
    let countQuery = supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Apply country filter if specified
    if (countries.length > 0) {
      countQuery = countQuery.in('country_id', countries)
    }

    // For seller filters, we need to get all trips first to filter properly
    let filteredTripIds: string[] = []
    let totalFilteredCount = 0

    if (userRole === 'seller' && filter !== 'all') {
      // Get all active trips with their data for filtering
      let allTripsQuery = supabase
        .from('trips')
        .select(`
          id,
          *,
          countries (
            id,
            name,
            flag_emoji
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Apply country filter if specified
      if (countries.length > 0) {
        allTripsQuery = allTripsQuery.in('country_id', countries)
      }

      const { data: allTrips } = await allTripsQuery

      // Get trips with schedules and seller data for filtering
      const tripsWithSellerData = await Promise.all(
        (allTrips || []).map(async (trip: any) => {
          // Get next upcoming schedule
          const { data: nextSchedule } = await supabase
            .from('trip_schedules')
            .select('*')
            .eq('trip_id', trip.id)
            .eq('is_active', true)
            .gt('departure_date', new Date().toISOString())
            .order('departure_date', { ascending: true })
            .limit(1)
            .single()

          // Get available seats if schedule exists
          let availableSeats = null
          if (nextSchedule) {
            const { data: availableSeatsData } = await supabase
              .rpc('get_available_seats', { schedule_id: nextSchedule.id })
            availableSeats = availableSeatsData
          }

          // Get seller bookings count
          let sellerBookingsCount = 0
          if (nextSchedule) {
            const { count } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('seller_id', user.id)
              .eq('trip_schedule_id', nextSchedule.id)
              .in('status', ['confirmed', 'pending'])
            
            sellerBookingsCount = count || 0
          }

          return {
            ...trip,
            next_schedule: nextSchedule,
            available_seats: availableSeats,
            seller_bookings_count: sellerBookingsCount
          }
        })
      )

      // Apply filter
      let filteredTrips = tripsWithSellerData
      switch (filter) {
        case 'sold':
          filteredTrips = tripsWithSellerData.filter((trip: any) => trip.seller_bookings_count && trip.seller_bookings_count > 0)
          break
        case 'not_sold':
          filteredTrips = tripsWithSellerData.filter((trip: any) => !trip.seller_bookings_count || trip.seller_bookings_count === 0)
          break
        case 'full':
          filteredTrips = tripsWithSellerData.filter((trip: any) => trip.available_seats === 0)
          break
      }

      filteredTripIds = filteredTrips.map(trip => trip.id)
      totalFilteredCount = filteredTrips.length

      // Get paginated results from filtered trips
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const paginatedFilteredTrips = filteredTrips.slice(from, to + 1)

      const totalPages = Math.ceil(totalFilteredCount / pageSize)

      return NextResponse.json({
        trips: paginatedFilteredTrips,
        totalCount: totalFilteredCount,
        currentPage: page,
        totalPages,
        pageSize,
        userRole,
        userId: user.id,
        availableCountries: uniqueCountries
      })
    }

    // For 'all' filter or non-seller users, use normal pagination
    let query = supabase
      .from('trips')
      .select(`
        *,
        countries (
          id,
          name,
          flag_emoji
        )
      `, { count: 'exact' })
      .eq('is_active', true)

    // Apply country filter if specified
    if (countries.length > 0) {
      query = query.in('country_id', countries)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // Order by created_at
    query = query.order('created_at', { ascending: false })

    const { data: tripsData, error: tripsError, count } = await query

    if (tripsError) {
      throw tripsError
    }

    // Get next schedules for each trip (for 'all' filter)
    const tripsWithSchedules = await Promise.all(
      (tripsData || []).map(async (trip: any) => {
        // Get next upcoming schedule
        const { data: nextSchedule } = await supabase
          .from('trip_schedules')
          .select('*')
          .eq('trip_id', trip.id)
          .eq('is_active', true)
          .gt('departure_date', new Date().toISOString())
          .order('departure_date', { ascending: true })
          .limit(1)
          .single()

        // Get available seats if schedule exists
        let availableSeats = null
        if (nextSchedule) {
          const { data: availableSeatsData } = await supabase
            .rpc('get_available_seats', { schedule_id: nextSchedule.id })
          availableSeats = availableSeatsData
        }

        // Get seller bookings count (only for seller view)
        let sellerBookingsCount = 0
        if (userRole === 'seller' && nextSchedule) {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .eq('trip_schedule_id', nextSchedule.id)
            .in('status', ['confirmed', 'pending'])
          
          sellerBookingsCount = count || 0
        }

        return {
          ...trip,
          countries: trip.countries,
          next_schedule: nextSchedule,
          available_seats: availableSeats,
          seller_bookings_count: sellerBookingsCount
        }
      })
    )

    const totalPages = Math.ceil((count || 0) / pageSize)

    return NextResponse.json({
      trips: tripsWithSchedules,
      totalCount: count || 0,
      currentPage: page,
      totalPages,
      pageSize,
      userRole,
      userId: user.id,
      availableCountries: uniqueCountries
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
