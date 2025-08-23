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
  }
}

interface Seller {
  id: string
  full_name: string | null
  email: string | null
  referral_code: string | null
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
  const [sellerFilter, setSellerId] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const supabase = createClient()

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, statusFilter, sellerFilter, dateFilter])

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
                .select('id, full_name, email, referral_code')
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

  const handleBookingCreated = () => {
    setShowCreateModal(false)
    refreshBookings()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการการจอง</h1>
            <p className="text-gray-600 mt-1">สร้าง แก้ไข และจัดการการจองทั้งหมด</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            สร้างการจองใหม่
          </button>
        </div>

        {/* Stats */}
        <BookingStats bookings={bookings} />
      </div>

      {/* Filters */}
      <BookingFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sellerFilter={sellerFilter}
        setSellerId={setSellerId}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        sellers={sellers}
        onRefresh={refreshBookings}
        loading={loading}
      />

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">กำลังโหลด...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบการจอง</h3>
            <p className="text-gray-500">ลองเปลี่ยนตัวกรองหรือสร้างการจองใหม่</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onStatusUpdate={updateBookingStatus}
                sellers={sellers}
              />
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
