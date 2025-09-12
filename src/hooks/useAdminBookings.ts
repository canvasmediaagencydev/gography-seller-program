import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface UseAdminBookingsResult {
  bookings: any[]
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  totalPages: number
  pageSize: number
  refreshBookings: (filters?: BookingFilters) => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

export interface BookingFilters {
  search?: string
  status?: string
  paymentStatus?: string
  sellerId?: string
  page?: number
  pageSize?: number
}

export function useAdminBookings(pageSize: number = 20): UseAdminBookingsResult {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  const supabase = createClient()

  const fetchBookings = useCallback(async (filters: BookingFilters = {}, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true)
      }
      setError(null)

      const params = new URLSearchParams({
        page: (filters.page || 1).toString(),
        pageSize: (filters.pageSize || pageSize).toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.paymentStatus && filters.paymentStatus !== 'all' && { paymentStatus: filters.paymentStatus }),
        ...(filters.sellerId && filters.sellerId !== 'all' && { sellerId: filters.sellerId })
      })

      const response = await fetch(`/api/admin/bookings?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch bookings')
      }

      const data = await response.json()
      
      if (append) {
        setBookings(prev => [...prev, ...data.bookings])
      } else {
        setBookings(data.bookings)
      }
      
      setTotalCount(data.totalCount)
      setCurrentPage(data.currentPage)
      setTotalPages(data.totalPages)
      setHasMore(data.currentPage < data.totalPages)

    } catch (err: any) {
      setError(err.message)
      console.error('Fetch bookings error:', err)
      toast.error(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  const refreshBookings = useCallback(async (filters: BookingFilters = {}) => {
    setCurrentPage(1)
    await fetchBookings({ ...filters, page: 1 }, false)
  }, [fetchBookings])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    
    const nextPage = currentPage + 1
    await fetchBookings({ page: nextPage }, true)
  }, [currentPage, hasMore, loading, fetchBookings])

  // Update single booking in state (for optimistic updates)
  const updateBookingInState = useCallback(async (bookingId: string) => {
    try {
      // Fetch updated booking data
      const { data: updatedBooking } = await supabase
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
        .eq('id', bookingId)
        .single()

      if (updatedBooking) {
        // Fetch seller info if exists
        let seller = null
        if (updatedBooking.seller_id) {
          const { data: sellerData } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, referral_code, avatar_url')
            .eq('id', updatedBooking.seller_id)
            .single()
          seller = sellerData
        }

        const bookingWithSeller = { 
          ...updatedBooking, 
          seller,
          trip_schedules: {
            ...updatedBooking.trip_schedules,
            trips: {
              ...updatedBooking.trip_schedules?.trips,
              countries: updatedBooking.trip_schedules?.trips?.countries || undefined
            }
          }
        }

        // Update state
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId ? bookingWithSeller : booking
          )
        )
      }
    } catch (error) {
      console.error('Error updating booking in state:', error)
      // Fallback to full refresh if single update fails
      await refreshBookings()
    }
  }, [supabase, refreshBookings])

  // Initial fetch
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  return {
    bookings,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    refreshBookings,
    loadMore,
    hasMore,
    // Export the update function for use in components
    updateBookingInState
  } as UseAdminBookingsResult & { updateBookingInState: (bookingId: string) => Promise<void> }
}