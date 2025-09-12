import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'

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

    // Create cache key
    const cacheKey = `trips_${user.id}_${filter}_${page}_${pageSize}_${countries.join(',')}`
    
    // Check cache first
    const cachedResult = apiCache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || null

    // Get available countries from existing trips - cache this separately as it changes less frequently
    const countriesCacheKey = 'available_countries'
    let uniqueCountries = apiCache.get(countriesCacheKey)
    
    if (!uniqueCountries) {
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
      uniqueCountries = availableCountries
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
      
      // Cache countries for 5 minutes
      apiCache.set(countriesCacheKey, uniqueCountries, 300000)
    }

    // Use optimized fallback logic
    const result = await fallbackTripsQuery(supabase, user, userRole, page, pageSize, filter, countries, uniqueCountries)
    
    // Cache the result for 30 seconds
    if (result) {
      const resultData = await result.json()
      apiCache.set(cacheKey, resultData, 30000)
      return NextResponse.json(resultData)
    }
    
    return result

  } catch (error: any) {
    console.error('API Error:', error)
    
    // If error is related to RPC function not existing, use fallback
    if (error.message?.includes('function') && error.message?.includes('does not exist')) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '6')
        const filter = searchParams.get('filter') || 'all'
        const countries = searchParams.get('countries')?.split(',').filter(Boolean) || []
        
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const userRole = profile?.role || null
        
        // Get available countries with simple query
        const { data: countriesData } = await supabase
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

        const availableCountries = countriesData
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
        
        return await fallbackTripsQuery(supabase, user, userRole, page, pageSize, filter, countries, availableCountries)
      }
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Fallback function with original logic but some optimizations
async function fallbackTripsQuery(supabase: any, user: any, userRole: string | null, page: number, pageSize: number, filter: string, countries: string[], availableCountries: any[]) {
  // Use a more efficient approach - get trips first, then batch process
  let baseQuery = supabase
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
    baseQuery = baseQuery.in('country_id', countries)
  }

  // For 'all' filter or when we can apply direct pagination
  if (filter === 'all') {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    baseQuery = baseQuery.range(from, to).order('created_at', { ascending: false })
    
    const { data: tripsData, error: tripsError, count } = await baseQuery

    if (tripsError) throw tripsError

    // Process trips in batches to reduce queries
    const tripsWithData = await processTripsBatch(supabase, tripsData || [], user.id, userRole)
    
    return NextResponse.json({
      trips: tripsWithData,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / pageSize),
      pageSize,
      userRole,
      userId: user.id,
      availableCountries
    })
  }

  // For filtered results, we need all trips first (but optimized)
  const { data: allTrips } = await baseQuery.order('created_at', { ascending: false })
  
  if (!allTrips) {
    return NextResponse.json({
      trips: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      pageSize,
      userRole,
      userId: user.id,
      availableCountries
    })
  }

  // Process all trips efficiently
  const tripsWithData = await processTripsBatch(supabase, allTrips, user.id, userRole)
  
  // Apply filter
  let filteredTrips = tripsWithData
  switch (filter) {
    case 'sold':
      filteredTrips = tripsWithData.filter((trip: any) => 
        trip.seller_bookings_count && trip.seller_bookings_count > 0
      )
      break
    case 'not_sold':
      filteredTrips = tripsWithData.filter((trip: any) => 
        !trip.seller_bookings_count || trip.seller_bookings_count === 0
      )
      break
    case 'full':
      filteredTrips = tripsWithData.filter((trip: any) => 
        trip.available_seats !== null && trip.available_seats === 0
      )
      break
  }

  // Apply pagination to filtered results
  const totalFilteredCount = filteredTrips.length
  const from = (page - 1) * pageSize
  const to = from + pageSize
  const paginatedTrips = filteredTrips.slice(from, to)

  return NextResponse.json({
    trips: paginatedTrips,
    totalCount: totalFilteredCount,
    currentPage: page,
    totalPages: Math.ceil(totalFilteredCount / pageSize),
    pageSize,
    userRole,
    userId: user.id,
    availableCountries
  })
}

// Optimized batch processing function
async function processTripsBatch(supabase: any, trips: any[], userId: string, userRole: string | null) {
  if (!trips.length) return []

  const tripIds = trips.map(t => t.id)
  
  // Single query to get all schedules 
  const { data: schedulesWithBookings, error: schedulesError } = await supabase
    .from('trip_schedules')
    .select('*')
    .in('trip_id', tripIds)
    .eq('is_active', true)
    .order('departure_date', { ascending: true })

  // Process each trip with the pre-loaded data
  return trips.map(trip => {
    const tripSchedules = schedulesWithBookings?.filter((s: any) => s.trip_id === trip.id) || []
    
    // Get next upcoming schedule
    const nextSchedule = tripSchedules
      .filter((s: any) => new Date(s.departure_date) > new Date())
      .sort((a: any, b: any) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime())[0] || null

    // For now, use the original available_seats from schedule without booking deduction
    // TODO: Fix bookings query when RLS policy is resolved
    let availableSeats = null
    if (nextSchedule) {
      availableSeats = nextSchedule.available_seats // Use original seats
    }

    // Seller bookings count - set to 0 for now due to RLS issues
    // TODO: Fix this when RLS policy is resolved
    let sellerBookingsCount = 0

    // Clean next schedule data
    const cleanNextSchedule = nextSchedule

    // Clean trip schedules
    const cleanTripSchedules = tripSchedules

    // Debug log the final result
    const result = {
      ...trip,
      trip_schedules: cleanTripSchedules,
      next_schedule: cleanNextSchedule,
      available_seats: availableSeats,
      seller_bookings_count: sellerBookingsCount
    }
    
    console.log(`Final result for ${trip.title}:`, {
      available_seats: result.available_seats,
      next_schedule_available_seats: result.next_schedule?.available_seats
    })
    
    return result
  })
}
