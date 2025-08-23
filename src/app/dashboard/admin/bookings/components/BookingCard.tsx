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
      pending: { label: 'รออนุมัติ', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      inprogress: { label: 'กำลังดำเนินการ', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      approved: { label: 'อนุมัติแล้ว', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      rejected: { label: 'ปฏิเสธ', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      cancelled: { label: 'ยกเลิก', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
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
    <div className="p-6  transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Trip and Customer Info */}
          <div className="flex items-start gap-6 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {trip?.title || 'ไม่พบข้อมูลทริป'}
                  </h3>
                  {trip?.countries?.flag_emoji && (
                    <span className="text-base">{trip.countries.flag_emoji}</span>
                  )}
                </div>
                {getStatusBadge(booking.status)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {customer?.full_name?.charAt(0) || 'N'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer?.full_name || 'ไม่พบข้อมูล'}</p>
                      <p className="text-xs text-gray-500">{customer?.email || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  {customer?.phone && (
                    <p className="text-sm text-gray-600 ml-10">โทร: {customer.phone}</p>
                  )}
                </div>

                <div className="space-y-1">
                  {booking.trip_schedules && (
                    <>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">วันเดินทาง:</span> {new Date(booking.trip_schedules.departure_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">วันกลับ:</span> {new Date(booking.trip_schedules.return_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </>
                  )}
                  <p className="text-xs text-gray-500">
                    จองเมื่อ: {booking.created_at ? new Date(booking.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right min-w-0">
              <p className="text-xl font-semibold text-gray-900">฿{booking.total_amount.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">คอมมิชชั่น: ฿{booking.commission_amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between mb-4 py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Seller</p>
                {booking.seller ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">{booking.seller.full_name || booking.seller.email}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{booking.seller.referral_code}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">ไม่มี Seller</span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setEditingSeller(!editingSeller)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
            >
              แก้ไข
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <svg className={`h-4 w-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
              {showDetails ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
            </button>

            <div className="flex items-center gap-2">
              <select
                value={booking.status || 'pending'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <option value="pending">รออนุมัติ</option>
                <option value="inprogress">กำลังดำเนินการ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
                <option value="cancelled">ยกเลิก</option>
              </select>

              {updating && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">ข้อมูลลูกค้า</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">บัตรประชาชน:</span>
                    <span className="text-gray-900">{customer?.id_card || 'ไม่ระบุ'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">หนังสือเดินทาง:</span>
                    <span className="text-gray-900">{customer?.passport_number || 'ไม่ระบุ'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">ข้อมูลทริป</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ราคาต่อคน:</span>
                    <span className="text-gray-900">฿{trip ? trip.price_per_person.toLocaleString() : 'ไม่ระบุ'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ประเทศ:</span>
                    <span className="text-gray-900">{trip?.countries?.name || 'ไม่ระบุ'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">หมายเหตุ</h4>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Seller */}
      {editingSeller && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">แก้ไข Seller</h4>
            <div className="flex items-center gap-3">
              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                บันทึก
              </button>
              <button
                onClick={() => {
                  setEditingSeller(false)
                  setSelectedSellerId(booking.seller_id || '')
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
