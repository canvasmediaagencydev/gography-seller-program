import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '../../database.types'

interface ScheduleWithSeats extends Tables<'trip_schedules'> {
  realTimeSeats?: number
}

export function useTripSchedules(tripId: string) {
  const [schedules, setSchedules] = useState<ScheduleWithSeats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchSchedulesWithSeats = async () => {
      setLoading(true)
      setError(null)

      try {
        
        // First, check if there are any schedules at all for this trip
        const { data: allSchedules, error: allSchedulesError } = await supabase
          .from('trip_schedules')
          .select('*')
          .eq('trip_id', tripId)


        if (allSchedulesError) {
          throw allSchedulesError
        }

        // Fetch active schedules (including today and future dates)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Start of today
        
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('trip_schedules')
          .select('*')
          .eq('trip_id', tripId)
          .eq('is_active', true)
          .gte('departure_date', today.toISOString().split('T')[0]) // >= today (date only)
          .order('departure_date', { ascending: true })


        if (schedulesError) {
          throw schedulesError
        }

        if (!schedulesData || schedulesData.length === 0) {
          setSchedules([])
          return
        }

        // Get real-time seats for each schedule
        const schedulesWithSeats = await Promise.all(
          schedulesData.map(async (schedule) => {
            try {
              // Try RPC function first
              const { data: seatsData, error: rpcError } = await supabase
                .rpc('get_available_seats', { schedule_id: schedule.id })
              
              if (!rpcError && seatsData !== null && seatsData !== undefined) {
                return {
                  ...schedule,
                  realTimeSeats: Math.max(0, seatsData)
                }
              }
              
              throw new Error('RPC function failed or returned null')
            } catch (err) {
              console.log(`RPC failed for schedule ${schedule.id}, using fallback calculation`)
              
              // Fallback calculation
              try {
                const { data: bookings, error: bookingError } = await supabase
                  .from('bookings')
                  .select('status')
                  .eq('trip_schedule_id', schedule.id)
                  .in('status', ['approved', 'pending', 'inprogress'])

                if (bookingError) {
                  console.error('Booking query error:', bookingError)
                  // If booking query fails, return original seats
                  return {
                    ...schedule,
                    realTimeSeats: schedule.available_seats
                  }
                }

                // Safely calculate booked seats
                const bookedSeats = Array.isArray(bookings) ? bookings.length : 0
                const realTimeSeats = Math.max(0, schedule.available_seats - bookedSeats)
                
                console.log(`Fallback calculation for schedule ${schedule.id}:`, {
                  originalSeats: schedule.available_seats,
                  bookedSeats,
                  realTimeSeats
                })
                
                return {
                  ...schedule,
                  realTimeSeats
                }
              } catch (fallbackErr) {
                console.error('Fallback calculation failed:', fallbackErr)
                // Last resort: return original seats
                return {
                  ...schedule,
                  realTimeSeats: schedule.available_seats
                }
              }
            }
          })
        )

        setSchedules(schedulesWithSeats)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedulesWithSeats()

    // Set up real-time subscription for booking changes
    const channel = supabase
      .channel(`trip-schedules-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          // Only refetch if the booking is for this trip
          if (payload.new && (payload.new as any).trip_schedule_id && schedules.some(s => s.id === (payload.new as any).trip_schedule_id)) {
            fetchSchedulesWithSeats()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tripId])

  return { schedules, loading, error, refetch: () => setSchedules([]) }
}
