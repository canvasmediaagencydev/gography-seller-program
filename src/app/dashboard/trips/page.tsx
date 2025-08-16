import { createClient } from '@/lib/supabase/server'
import TripCard from '@/components/TripCard'

export default async function TripsPage() {
  const supabase = await createClient()
  
  // Get current user for seller-specific data
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  // Get user profile to check role
  const { data: profile } = userId ? await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single() : { data: null }

  // For now, let's query the data manually until we implement the RPC function
  // Get all active trips with related data
  const { data: trips, error } = await supabase
    .from('trips')
    .select(`
      *,
      countries (
        name,
        flag_emoji
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}</p>
        </div>
      </div>
    )
  }

  // Get next schedules for each trip
  const tripsWithSchedules = await Promise.all(
    (trips || []).map(async (trip) => {
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
      if (userId && profile?.role === 'seller' && nextSchedule) {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', userId)
          .eq('trip_schedule_id', nextSchedule.id)
          .in('status', ['confirmed', 'pending'])
        
        sellerBookingsCount = count || 0
      }

      return {
        ...trip,
        countries: trip.countries as any,
        next_schedule: nextSchedule,
        available_seats: availableSeats,
        seller_bookings_count: sellerBookingsCount
      }
    })
  )

  const viewType = profile?.role === 'seller' ? 'seller' : 'general'

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ข้อมูล Trips</h1>
        <p className="text-gray-600">รายละเอียดทริปและสถานที่ท่องเที่ยวทั้งหมด</p>
      </div>

      {tripsWithSchedules && tripsWithSchedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tripsWithSchedules.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              viewType={viewType}
              currentSellerId={userId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีข้อมูล Trips</h3>
          <p className="mt-1 text-sm text-gray-500">
            ยังไม่มีทริปที่สร้างขึ้นในระบบ
          </p>
        </div>
      )}
    </div>
  )
}
