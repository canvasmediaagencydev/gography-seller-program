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
              const { data: seatsData } = await supabase
                .rpc('get_available_seats', { schedule_id: schedule.id })
              
              
              return {
                ...schedule,
                realTimeSeats: seatsData || 0
              }
            } catch (err) {
              
              // Fallback calculation
              const { data: bookings } = await supabase
                .from('bookings')
                .select('status')
                .eq('trip_schedule_id', schedule.id)
                .in('status', ['approved', 'pending', 'inprogress'])

              const bookedSeats = bookings?.length || 0
              const realTimeSeats = Math.max(0, schedule.available_seats - bookedSeats)
              
              
              return {
                ...schedule,
                realTimeSeats
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
