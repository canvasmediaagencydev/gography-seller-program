'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '../../../../../database.types'
import BookingCard from './components/BookingCard'
import CreateBookingModal from './components/CreateBookingModal'
import BookingFilters from './components/BookingFilters'
import BookingStats from './components/BookingStats'

interface BookingWithDetails extends Tables<'bookings'> {
  customers?: {
    full_name: string
    email: string
    phone: string | null
    id_card: string | null
    passport_number: string | null
  }
  trip_schedules?: {
    departure_date: string
    return_date: string
    registration_deadline: string
    available_seats: number
    trips?: {
      title: string
      price_per_person: number
      commission_type: string | null
      commission_value: number
      countries?: {
        name: string
        flag_emoji: string | null
      }
    }
  }
  seller?: {
    id: string
    full_name: string | null
    email: string | null
    referral_code: string | null
    avatar_url: string | null
  }
}

interface Seller {
  id: string
  full_name: string | null
  email: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface TripWithSchedules extends Tables<'trips'> {
  countries?: {
    name: string
    flag_emoji: string | null
  }
  trip_schedules?: Array<{
    id: string
    departure_date: string
    return_date: string
    registration_deadline: string
    available_seats: number
    is_active: boolean | null
  }>
}

interface AdminBookingsClientProps {
  initialBookings: BookingWithDetails[]
  sellers: Seller[]
  trips: TripWithSchedules[]
}

type BookingStatus = 'all' | 'pending' | 'inprogress' | 'approved' | 'rejected' | 'cancelled'

export default function AdminBookingsClient({ 
  initialBookings, 
  sellers, 
  trips 
}: AdminBookingsClientProps) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>(initialBookings)
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>(initialBookings)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [sellerFilter, setSellerId] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const supabase = createClient()

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, statusFilter, paymentStatusFilter, sellerFilter, dateFilter])

  const filterBookings = () => {
    let filtered = [...bookings]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.customers?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customers?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.trip_schedules?.trips?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.seller?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Payment Status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.payment_status === paymentStatusFilter)
    }

    // Seller filter
    if (sellerFilter !== 'all') {
      if (sellerFilter === 'none') {
        filtered = filtered.filter(booking => !booking.seller_id)
      } else {
        filtered = filtered.filter(booking => booking.seller_id === sellerFilter)
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(booking => {
        if (!booking.created_at) return false
        const bookingDate = new Date(booking.created_at)
        
        switch (dateFilter) {
          case 'today':
            return bookingDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return bookingDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return bookingDate >= monthAgo
          default:
            return true
        }
      })
    }

    setFilteredBookings(filtered)
  }

  const refreshBookings = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
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
          )
        `)
        .order('created_at', { ascending: false })
      
      // Manually fetch seller information for each booking
      if (data) {
        const bookingsWithSellers = await Promise.all(
          data.map(async (booking) => {
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
        
        setBookings(bookingsWithSellers as BookingWithDetails[])
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/bookings/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update booking status')
      }

      // Refresh bookings
      await refreshBookings()
    } catch (error) {
      console.error('Error updating booking status:', error)
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะการจอง')
    }
  }

  const updatePaymentStatus = async (bookingId: string, paymentStatus: string) => {
    try {
      const response = await fetch('/api/admin/bookings/update-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          paymentStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update payment status')
      }

      // Refresh bookings
      await refreshBookings()
    } catch (error) {
      console.error('Error updating payment status:', error)
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะการชำระเงิน: ' + (error as Error).message)
    }
  }

  const handleBookingCreated = () => {
    setShowCreateModal(false)
    refreshBookings()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">จัดการการจอง</h1>
            <p className="mt-1 text-gray-600">
              สร้าง แก้ไข และจัดการการจองทั้งหมดในระบบ
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            สร้างการจองใหม่
          </button>
        </div>
      </div>

      {/* Stats */}
      <BookingStats bookings={bookings} />

      {/* Filters */}
      <BookingFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentStatusFilter={paymentStatusFilter}
        setPaymentStatusFilter={setPaymentStatusFilter}
        sellerFilter={sellerFilter}
        setSellerId={setSellerId}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        sellers={sellers}
        onRefresh={refreshBookings}
        loading={loading}
      />

      {/* Bookings List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900">ไม่พบการจอง</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              ลองปรับเปลี่ยนตัวกรองการค้นหา หรือสร้างการจองใหม่
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-gray-50 rounded-lg border border-gray-200">
                <BookingCard
                  booking={booking}
                  onStatusUpdate={updateBookingStatus}
                  onPaymentStatusUpdate={updatePaymentStatus}
                  sellers={sellers}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal
          onClose={() => setShowCreateModal(false)}
          onBookingCreated={handleBookingCreated}
          sellers={sellers}
          trips={trips}
        />
      )}
    </div>
  )
}
