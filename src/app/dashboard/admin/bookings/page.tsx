import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminBookingsClient from './AdminBookingsClient'

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch initial data for the client component
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      customers (
        full_name,
        email,
        phone,
        id_card,
        passport_number
      ),
      trip_schedules (
        departure_date,
        return_date,
        registration_deadline,
        available_seats,
        trips (
          title,
          price_per_person,
          commission_type,
          commission_value,
          countries (
            name,
            flag_emoji
          )
        )
      ),
      commission_payments (
        id,
        payment_type,
        amount,
        status,
        paid_at
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Manually fetch seller information for each booking
  let bookingsWithSellers: any[] = []
  if (bookings) {
    bookingsWithSellers = await Promise.all(
      bookings.map(async (booking) => {
        if (booking.seller_id) {
          const { data: seller } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, referral_code, avatar_url')
            .eq('id', booking.seller_id)
            .single()
          
          return { ...booking, seller }
        }
        return { ...booking, seller: null }
      })
    )
  }

  // Fetch sellers for the create booking form
  const { data: sellers } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, referral_code, avatar_url')
    .eq('role', 'seller')
    .eq('status', 'approved')
    .order('full_name')

  // Fetch active trips with schedules for the create booking form
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      *,
      countries (
        name,
        flag_emoji
      ),
      trip_schedules (
        id,
        departure_date,
        return_date,
        registration_deadline,
        available_seats,
        is_active
      )
    `)
    .eq('is_active', true)
    .order('title')

  // Transform trips data to match TripWithSchedules type
  const transformedTrips = trips?.map(trip => ({
    ...trip,
    countries: trip.countries || undefined
  })) || []

  return (
    <AdminBookingsClient 
      initialBookings={bookingsWithSellers || []}
      sellers={sellers || []}
      trips={transformedTrips}
    />
  )
}
