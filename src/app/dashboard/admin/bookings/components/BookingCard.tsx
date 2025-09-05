import { useState } from 'react'
import { Tables } from '../../../../../../database.types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  Edit, 
  Phone, 
  PlaneTakeoff, 
  PlaneLanding, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle,
  Mail,
  User,
  MapPin
} from 'lucide-react'

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
  commission_payments?: {
    id: string
    payment_type: string
    amount: number
    status: string | null
    paid_at: string | null
  }[]
}

interface Seller {
  id: string
  full_name: string | null
  email: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface BookingCardProps {
  booking: BookingWithDetails
  onStatusUpdate: (bookingId: string, status: string) => Promise<void>
  onPaymentStatusUpdate: (bookingId: string, paymentStatus: string) => Promise<void>
  sellers: Seller[]
}

export default function BookingCard({ booking, onStatusUpdate, onPaymentStatusUpdate, sellers }: BookingCardProps) {
  const [updating, setUpdating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [editingSeller, setEditingSeller] = useState(false)
  const [selectedSellerId, setSelectedSellerId] = useState(booking.seller_id || '')

  // Use commission payments from booking data instead of fetching separately
  const commissionPayments = booking.commission_payments || []

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
      pending: { label: 'รออนุมัติ', variant: 'secondary' as const },
      inprogress: { label: 'กำลังดำเนินการ', variant: 'default' as const },
      approved: { label: 'อนุมัติแล้ว', variant: 'default' as const },
      rejected: { label: 'ปฏิเสธ', variant: 'destructive' as const },
      cancelled: { label: 'ยกเลิก', variant: 'outline' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={cn(
        status === 'approved' && 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50/80',
        status === 'pending' && 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50/80',
        status === 'inprogress' && 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50/80'
      )}>
        {config.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (paymentStatus: string | null) => {
    const statusConfig = {
      pending: { label: 'รอชำระ', variant: 'secondary' as const, icon: Clock },
      deposit_paid: { label: 'จ่ายมัดจำแล้ว', variant: 'default' as const, icon: DollarSign },
      fully_paid: { label: 'จ่ายครบแล้ว', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'ยกเลิกชำระ', variant: 'destructive' as const, icon: XCircle }
    }

    const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className={cn(
        'gap-1.5',
        paymentStatus === 'pending' && 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50/80',
        paymentStatus === 'deposit_paid' && 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50/80',
        paymentStatus === 'fully_paid' && 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50/80'
      )}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getCommissionStatusBadge = (status: string | null) => {
    const statusConfig = {
      pending: { label: 'รอจ่าย', variant: 'secondary' as const },
      paid: { label: 'จ่ายแล้ว', variant: 'default' as const },
      cancelled: { label: 'ยกเลิก', variant: 'destructive' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={cn(
        'text-xs',
        status === 'pending' && 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50/80',
        status === 'paid' && 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50/80'
      )}>
        {config.label}
      </Badge>
    )
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      await onStatusUpdate(booking.id, newStatus)
      toast.success('อัพเดทสถานะการจองสำเร็จ')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะการจอง')
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentStatusChange = async (newPaymentStatus: string) => {
    setUpdating(true)
    try {
      await onPaymentStatusUpdate(booking.id, newPaymentStatus)
      toast.success('อัพเดทสถานะการชำระเงินสำเร็จ')
      // No need to refresh commission payments as parent will refresh
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะการชำระเงิน')
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
      toast.success('อัพเดท Seller สำเร็จ')
      // Trigger a refresh of the bookings list
      window.location.reload()
    } catch (error) {
      console.error('Error updating seller:', error)
      toast.error('เกิดข้อผิดพลาดในการอัพเดท Seller')
    }
  }

  const trip = booking.trip_schedules?.trips
  const customer = booking.customers

  return (
    <Card className="transition-colors hover:shadow-md">
      <CardHeader className="pb-4">
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
                  <div className="flex items-center gap-2">
                    {getStatusBadge(booking.status)}
                    {getPaymentStatusBadge(booking.payment_status)}
                  </div>
                </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-md font-medium text-gray-900">{customer?.full_name || 'ไม่พบข้อมูล'}</p>
                      <p className="text-md text-gray-500">{customer?.email || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  {customer?.phone && (
                    <p className="text-md text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  {booking.trip_schedules && (
                    <>
                      <p className="text-md text-gray-600 flex items-center gap-2">
                        <PlaneTakeoff className="w-4 h-4" />
                        <span className="font-medium">วันเดินทาง:</span> 
                        {new Date(booking.trip_schedules.departure_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-md text-gray-600 flex items-center gap-2">
                        <PlaneLanding className="w-4 h-4" />
                        <span className="font-medium">วันกลับ:</span> 
                        {new Date(booking.trip_schedules.return_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </>
                  )}
                  <p className="text-md text-gray-500">
                    จองเมื่อ: {booking.created_at ? new Date(booking.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right min-w-0">
              <p className="text-xl font-semibold text-gray-900">฿{booking.total_amount.toLocaleString()}</p>
              <p className="text-md text-gray-600 mt-1">คอมมิชชั่น: ฿{booking.commission_amount.toLocaleString()}</p>
              {booking.deposit_amount && (
                <p className="text-sm text-blue-600 mt-1">มัดจำ: ฿{booking.deposit_amount.toLocaleString()}</p>
              )}
              {booking.remaining_amount && (
                <p className="text-sm text-orange-600 mt-1">คงเหลือ: ฿{booking.remaining_amount.toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Commission Flow Info */}
          {booking.seller && commissionPayments.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Commission Flow</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commissionPayments.map((payment, index) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.payment_type === 'deposit_commission' ? 'Commission มัดจำ (50%)' : 'Commission ยอดสุดท้าย (50%)'}
                      </p>
                      <p className="text-sm text-gray-600">฿{payment.amount.toLocaleString()}</p>
                      {payment.paid_at && (
                        <p className="text-xs text-gray-500">จ่ายเมื่อ: {new Date(payment.paid_at).toLocaleDateString('th-TH')}</p>
                      )}
                    </div>
                    <div>
                      {getCommissionStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller Info */}
          <div className="flex items-center justify-between mb-4 py-3 px-4 bg-white rounded-lg">
            <div className="flex items-center gap-3">
              {booking.seller?.avatar_url ? (
                <img 
                  src={booking.seller.avatar_url} 
                  alt={booking.seller.full_name || 'Seller'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-md font-medium text-gray-700">Seller</p>
                {booking.seller ? (
                  <div className="flex items-center gap-2">
                    <span className="text-md text-gray-900">{booking.seller.full_name || booking.seller.email}</span>
                    <span className="text-md text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{booking.seller.referral_code}</span>
                  </div>
                ) : (
                  <span className="text-md text-gray-500">ไม่มี Seller</span>
                )}
              </div>
            </div>
            <Button
              onClick={() => setEditingSeller(!editingSeller)}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4 mr-1" />
              แก้ไข
            </Button>
          </div>
  {/* Edit Seller */}
      {editingSeller && (
        <div className="mt-6">
          <Separator className="mb-4" />
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">แก้ไข Seller</h4>
            <div className="flex items-center gap-3">
              <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="เลือก Seller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ไม่มี Seller</SelectItem>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.full_name || seller.email} ({seller.referral_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSellerUpdate}>
                บันทึก
              </Button>
              <Button
                onClick={() => {
                  setEditingSeller(false)
                  setSelectedSellerId(booking.seller_id || '')
                }}
                variant="outline"
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Actions */}
        <div className="flex flex-col gap-4">
          {/* Payment Status Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground font-medium">สถานะการชำระ:</p>
              <Select 
                value={booking.payment_status || 'pending'}
                onValueChange={handlePaymentStatusChange}
                disabled={updating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รอชำระ</SelectItem>
                  <SelectItem value="deposit_paid">จ่ายมัดจำแล้ว</SelectItem>
                  <SelectItem value="fully_paid">จ่ายครบแล้ว</SelectItem>
                  <SelectItem value="cancelled">ยกเลิกชำระ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Booking Status Control */}
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground font-medium">สถานะการจอง:</p>
              <Select 
                value={booking.status || 'pending'}
                onValueChange={handleStatusChange}
                disabled={updating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รออนุมัติ</SelectItem>
                  <SelectItem value="inprogress">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>

              {updating && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
