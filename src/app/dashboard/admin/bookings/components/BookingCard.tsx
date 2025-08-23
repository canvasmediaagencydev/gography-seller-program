import { useState } from 'react'
import { Tables } from '../../../../../../database.types'

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

interface BookingCardProps {
  booking: BookingWithDetails
  onStatusUpdate: (bookingId: string, status: string) => Promise<void>
  sellers: Seller[]
}

export default function BookingCard({ booking, onStatusUpdate, sellers }: BookingCardProps) {
  const [updating, setUpdating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [editingSeller, setEditingSeller] = useState(false)
  const [selectedSellerId, setSelectedSellerId] = useState(booking.seller_id || '')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string | null) => {
    const statusConfig = {
      pending: { label: 'รออนุมัติ', bg: 'bg-yellow-100', text: 'text-yellow-800' },
      inprogress: { label: 'กำลังดำเนินการ', bg: 'bg-purple-100', text: 'text-purple-800' },
      approved: { label: 'อนุมัติแล้ว', bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { label: 'ปฏิเสธ', bg: 'bg-red-100', text: 'text-red-800' },
      cancelled: { label: 'ยกเลิก', bg: 'bg-gray-100', text: 'text-gray-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      await onStatusUpdate(booking.id, newStatus)
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleSellerUpdate = async () => {
    try {
      const response = await fetch('/api/admin/bookings/update-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          sellerId: selectedSellerId || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update seller')
      }

      setEditingSeller(false)
      // Trigger a refresh of the bookings list
      window.location.reload()
    } catch (error) {
      console.error('Error updating seller:', error)
      alert('เกิดข้อผิดพลาดในการอัพเดท Seller')
    }
  }

  const trip = booking.trip_schedules?.trips
  const customer = booking.customers

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Trip and Customer Info */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {trip?.title || 'ไม่พบข้อมูลทริป'}
                </h3>
                {trip?.countries?.flag_emoji && (
                  <span className="text-lg">{trip.countries.flag_emoji}</span>
                )}
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>ลูกค้า:</strong> {customer?.full_name || 'ไม่พบข้อมูล'}</p>
                <p><strong>อีเมล:</strong> {customer?.email || 'ไม่ระบุ'}</p>
                {customer?.phone && <p><strong>โทร:</strong> {customer.phone}</p>}
                {booking.trip_schedules && (
                  <p><strong>วันเดินทาง:</strong> {formatDate(booking.trip_schedules.departure_date)} - {formatDate(booking.trip_schedules.return_date)}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">{formatCurrency(booking.total_amount)}</p>
              <p className="text-sm text-gray-500">คอมมิชชั่น: {formatCurrency(booking.commission_amount)}</p>
              <p className="text-xs text-gray-400 mt-1">
                จองเมื่อ: {booking.created_at ? formatDate(booking.created_at) : 'ไม่ระบุ'}
              </p>
            </div>
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Seller:</span>
              {booking.seller ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">{booking.seller.full_name || booking.seller.email}</span>
                  <span className="text-xs text-gray-500">({booking.seller.referral_code})</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">ไม่มี Seller</span>
              )}
            </div>
            
            <button
              onClick={() => setEditingSeller(!editingSeller)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              แก้ไข
            </button>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusBadge(booking.status)}
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showDetails ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {booking.status !== 'approved' && booking.status !== 'rejected' && booking.status !== 'cancelled' && (
                <>
                  <button
                    onClick={() => handleStatusChange('approved')}
                    disabled={updating}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                  >
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    disabled={updating}
                    className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    ปฏิเสธ
                  </button>
                </>
              )}
              
              {booking.status === 'approved' && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updating}
                  className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                >
                  ยกเลิก
                </button>
              )}

              <select
                value={booking.status || 'pending'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="pending">รออนุมัติ</option>
                <option value="inprogress">กำลังดำเนินการ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">ข้อมูลลูกค้า</h4>
              <div className="space-y-1 text-gray-600">
                <p>ID Card: {customer?.id_card || 'ไม่ระบุ'}</p>
                <p>Passport: {customer?.passport_number || 'ไม่ระบุ'}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">ข้อมูลทริป</h4>
              <div className="space-y-1 text-gray-600">
                <p>ราคาต่อคน: {trip ? formatCurrency(trip.price_per_person) : 'ไม่ระบุ'}</p>
                <p>ประเทศ: {trip?.countries?.name || 'ไม่ระบุ'}</p>
                <p>ที่นั่งว่าง: {booking.trip_schedules?.available_seats || 0} ที่นั่ง</p>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">หมายเหตุ</h4>
              <p className="text-gray-600 text-sm">{booking.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Seller */}
      {editingSeller && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">เลือก Seller:</label>
            <select
              value={selectedSellerId}
              onChange={(e) => setSelectedSellerId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ไม่มี Seller</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.full_name || seller.email} ({seller.referral_code})
                </option>
              ))}
            </select>
            <button
              onClick={handleSellerUpdate}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              บันทึก
            </button>
            <button
              onClick={() => {
                setEditingSeller(false)
                setSelectedSellerId(booking.seller_id || '')
              }}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-400 text-sm font-medium"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
