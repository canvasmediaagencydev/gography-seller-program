import StatusBadge from '../ui/StatusBadge'
import StatusSelector from '../ui/StatusSelector'
import { formatDate, formatPrice } from '@/utils/bookingUtils'

interface CustomerCardProps {
  customer: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    created_at: string | null
    referred_by_code: string | null
    bookings?: {
      id: string
      status: string | null
      total_amount: number
      created_at: string | null
      trips?: {
        title: string
      } | null
    }[]
  }
  onStatusUpdate: (bookingId: string, newStatus: string) => void
  updatingStatus: string | null
}

export default function CustomerCard({ 
  customer, 
  onStatusUpdate, 
  updatingStatus 
}: CustomerCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{customer.full_name}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span>เข้าร่วม {customer.created_at && formatDate(customer.created_at)}</span>
                {customer.referred_by_code && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                    แนะนำโดย: {customer.referred_by_code}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-6 py-5">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">ข้อมูลติดต่อ</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">{customer.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-600">{customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Bookings Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">การจองทริป</h4>
            {customer.bookings && customer.bookings.length > 0 ? (
              <div className="space-y-3">
                {customer.bookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm">{booking.trips?.title}</h5>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                          <span>{booking.created_at && formatDate(booking.created_at)}</span>
                          <span className="font-medium text-gray-700">{formatPrice(booking.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Management */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">สถานะ:</span>
                        <StatusBadge status={booking.status} />
                      </div>
                      
                      {/* Status Selector */}
                      <StatusSelector
                        currentStatus={booking.status}
                        bookingId={booking.id}
                        onStatusChange={onStatusUpdate}
                        isLoading={updatingStatus === booking.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H9.5" />
                </svg>
                <p className="text-gray-500 text-sm font-medium">ยังไม่มีการจอง</p>
                <p className="text-gray-400 text-xs">รอลูกค้าจองทริป</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
