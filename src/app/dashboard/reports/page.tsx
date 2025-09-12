'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSystem, ErrorSystem } from '@/components/ui'

interface BookingWithDetails {
  id: string
  total_amount: number
  commission_amount: number
  status: string | null
  payment_status: string | null
  booking_date: string | null
  created_at: string | null
  deposit_amount: number | null
  remaining_amount: number | null
  deposit_paid_at: string | null
  full_payment_at: string | null
  cancelled_at: string | null
  customers?: {
    full_name: string
    email: string
    phone: string | null
  }
  trip_schedules?: {
    departure_date: string
    return_date: string
    trips?: {
      title: string
      price_per_person: number
    }
  }
  commission_payments?: {
    id: string
    payment_type: string
    amount: number
    status: string | null
    paid_at: string | null
  }[]
}

interface UserProfile {
  [key: string]: any
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = async (isRefresh = false) => {
      try {
        // Only show full loading screen on initial load, not on refresh
        if (!isRefresh) {
          setLoading(true)
        }
        setError(null)

        // Get user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError || !profileData) {
          setError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้')
          return
        }

        if (profileData.status !== 'approved') {
          router.push('/dashboard?error=Reports access requires approval')
          return
        }

        setProfile(profileData)

        // Get seller's bookings with commission payments
        const { data: userBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            customers (
              full_name,
              email,
              phone
            ),
            trip_schedules (
              departure_date,
              return_date,
              trips (
                title,
                price_per_person
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
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })

        let allBookings = userBookings || []

        // Also try to get bookings by referral code if none found
        if ((!userBookings || userBookings.length === 0) && profileData.referral_code) {
          const { data: refBookings } = await supabase
            .from('bookings')
            .select(`
              *,
              customers (
                full_name,
                email,
                phone
              ),
              trip_schedules (
                departure_date,
                return_date,
                trips (
                  title,
                  price_per_person
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
            .eq('referral_code', profileData.referral_code)
            .order('created_at', { ascending: false })
          
          allBookings = refBookings || []
        }

        if (bookingsError) {
          console.error('Bookings error:', bookingsError)
        }

        setBookings(allBookings as BookingWithDetails[])

      } catch (error) {
        console.error('Error fetching reports data:', error)
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน')
      } finally {
        if (isRefresh) {
          setRefreshing(false)
        } else {
          setLoading(false)
        }
      }
    }

    const handleRefresh = async () => {
      if (refreshing) return // Prevent multiple clicks
      
      setRefreshing(true)
      setError(null)
      
      try {
        await fetchData(true)
      } catch (error) {
        console.error('Refresh error:', error)
        setError('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล')
      } finally {
        setRefreshing(false)
      }
    }

    useEffect(() => {
      fetchData()
    }, [supabase, router])

  // Calculate stats using new commission system
  const approvedBookings = bookings?.filter(b => b.status === 'approved') || []
  
  // Calculate commission from commission_payments instead of booking.commission_amount
  const allCommissionPayments = bookings?.flatMap(b => b.commission_payments || []) || []
  const totalCommissionEarned = allCommissionPayments
    .filter(cp => cp.status === 'paid')
    .reduce((sum, cp) => sum + cp.amount, 0)
  const totalCommissionPending = allCommissionPayments
    .filter(cp => cp.status === 'pending')
    .reduce((sum, cp) => sum + cp.amount, 0)
  const totalCommissionAll = totalCommissionEarned + totalCommissionPending

  const totalSales = approvedBookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0)
  const totalBookings = bookings?.length || 0
  const confirmedBookings = approvedBookings.length
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0
  
  // Payment status breakdown - ใช้ระบบเดียวกับ admin
  const fullyPaidBookings = bookings?.filter(b => b.payment_status === 'completed').length || 0
  const partialPaidBookings = bookings?.filter(b => b.payment_status === 'partial').length || 0
  const pendingPaymentBookings = bookings?.filter(b => b.payment_status === 'pending').length || 0
  const refundedBookings = bookings?.filter(b => b.payment_status === 'refunded').length || 0

  if (loading) {
    return <LoadingSystem variant="dashboard" />
  }

  if (error) {
    return <ErrorSystem variant="fullscreen" message={error} />
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-0">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">รายงานการขาย</h1>
            <p className="mt-1 text-sm md:text-base text-gray-600">
              ภาพรวมและสถิติการจองของคุณ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500">อัปเดตล่าสุด</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date().toLocaleDateString('th-TH')}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg 
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              {refreshing ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">คอมมิชชั่นที่ได้รับ</p>
              <p className="text-lg md:text-2xl font-semibold text-green-600 mt-1">
                ฿{totalCommissionEarned.toLocaleString()}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">คอมมิชชั่นรอรับ</p>
              <p className="text-lg md:text-2xl font-semibold text-orange-600 mt-1">
                ฿{totalCommissionPending.toLocaleString()}
              </p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">ยอดขายรวม</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900 mt-1">
                ฿{totalSales.toLocaleString()}
              </p>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">จำนวนการจอง</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900 mt-1">{totalBookings}</p>
              <p className="text-xs text-gray-500 mt-1">ทั้งหมด</p>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">ยืนยันแล้ว</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900 mt-1">{confirmedBookings}</p>
              <p className="text-xs text-gray-500 mt-1">จาก {totalBookings} รายการ</p>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปสถานะการชำระเงิน</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl md:text-2xl font-semibold text-green-600">{fullyPaidBookings}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">จ่ายครบแล้ว</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl md:text-2xl font-semibold text-blue-600">{partialPaidBookings}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">จ่ายมัดจำแล้ว</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-xl md:text-2xl font-semibold text-red-600">{refundedBookings}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">ยกเลิก</div>
          </div>
        </div>
      </div>

      {/* Bookings List - Professional Card Layout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">รายการจองล่าสุด</h3>
                <p className="text-sm text-gray-600">รายการการจองที่อัปเดตล่าสุด</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <span className="px-3 py-1 bg-white rounded-full text-gray-700 border border-gray-200">
                  {Math.min(bookings?.length || 0, 10)} / {bookings?.length || 0} รายการ
                </span>
              </div>
              {totalCommissionEarned > 0 && (
                <div className="px-3 py-1 bg-green-100 rounded-full text-green-700 text-sm font-medium">
                  ได้รับแล้ว ฿{totalCommissionEarned.toLocaleString()}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="รีเฟรชข้อมูล"
              >
                <svg 
                  className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                {refreshing ? '' : 'รีเฟรช'}
              </button>
            </div>
          </div>
        </div>
        
        {bookings && bookings.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {bookings.slice(0, 10).map((booking, index) => {
              const commissionEarned = booking.commission_payments
                ?.filter(cp => cp.status === 'paid')
                .reduce((sum, cp) => sum + cp.amount, 0) || 0
              const commissionPending = booking.commission_payments
                ?.filter(cp => cp.status === 'pending')
                .reduce((sum, cp) => sum + cp.amount, 0) || 0

              const getPaymentStatusBadge = (status: string | null) => {
                const statusConfig = {
                  partial: { 
                    label: 'จ่ายมัดจำแล้ว', 
                    bg: 'bg-blue-50 text-blue-700', 
                    border: 'border-blue-200',
                    dot: 'bg-blue-400'
                  },
                  completed: { 
                    label: 'จ่ายครบแล้ว', 
                    bg: 'bg-green-50 text-green-700', 
                    border: 'border-green-200',
                    dot: 'bg-green-400'
                  },
                  refunded: { 
                    label: 'ยกเลิกชำระ', 
                    bg: 'bg-red-50 text-red-700', 
                    border: 'border-red-200',
                    dot: 'bg-red-400'
                  }
                }
                const config = statusConfig[status as keyof typeof statusConfig]
                
                if (!config) return null
                
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bg} ${config.border}`}>
                    <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                    {config.label}
                  </span>
                )
              }

              const getBookingStatusBadge = (status: string | null) => {
                const statusConfig = {
                  approved: { 
                    label: 'ยืนยันแล้ว', 
                    bg: 'bg-green-50 text-green-700', 
                    border: 'border-green-200',
                    dot: 'bg-green-400'
                  },
                  pending: { 
                    label: 'รอดำเนินการ', 
                    bg: 'bg-yellow-50 text-yellow-700', 
                    border: 'border-yellow-200',
                    dot: 'bg-yellow-400'
                  },
                  inprogress: { 
                    label: 'กำลังดำเนินการ', 
                    bg: 'bg-blue-50 text-blue-700', 
                    border: 'border-blue-200',
                    dot: 'bg-blue-400'
                  },
                  cancelled: { 
                    label: 'ยกเลิกแล้ว', 
                    bg: 'bg-gray-50 text-gray-700', 
                    border: 'border-gray-200',
                    dot: 'bg-gray-400'
                  },
                  rejected: { 
                    label: 'ไม่อนุมัติ', 
                    bg: 'bg-red-50 text-red-700', 
                    border: 'border-red-200',
                    dot: 'bg-red-400'
                  }
                }
                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
                
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bg} ${config.border}`}>
                    <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                    {config.label}
                  </span>
                )
              }

              return (
                <div key={booking.id} className={`relative p-6 hover:bg-gray-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  {/* Card Content */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Left Section - Customer & Trip Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        {/* Customer Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-gray-900 truncate">
                            {booking.customers?.full_name || 'ไม่มีข้อมูลลูกค้า'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {booking.trip_schedules?.trips?.title || 'ไม่มีข้อมูลทริป'}
                          </p>
                          {booking.trip_schedules?.departure_date && (
                            <div className="flex items-center gap-1 mt-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs text-gray-500">
                                {new Date(booking.trip_schedules.departure_date).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Section - Financial Info */}
                    <div className="flex flex-col sm:flex-row gap-6 lg:gap-8">
                      {/* Amount */}
                      <div className="text-center sm:text-left">
                        <p className="text-xs text-gray-500 mb-1">ยอดรวม</p>
                        <p className="text-xl font-bold text-gray-900">
                          ฿{Number(booking.total_amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(booking.created_at || '').toLocaleDateString('th-TH')}
                        </p>
                      </div>

                      {/* Commission */}
                      <div className="text-center sm:text-left">
                        <p className="text-xs text-gray-500 mb-1">คอมมิชชั่น</p>
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-green-600">
                            ฿{commissionEarned.toLocaleString()}
                          </p>
                          {commissionPending > 0 && (
                            <p className="text-sm text-orange-600">
                              + ฿{commissionPending.toLocaleString()} รอรับ
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Status */}
                    <div className="flex flex-col gap-3 lg:items-end">
                      {getPaymentStatusBadge(booking.payment_status)}
                      {getBookingStatusBadge(booking.status)}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Show More Section */}
            {bookings.length > 10 && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
                <div className="text-center">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    ดูเพิ่มเติม ({bookings.length - 10} รายการ)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div className="max-w-sm mx-auto">
              {/* Empty State Icon */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              
              {/* Empty State Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีการจองเข้ามา</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                เมื่อมีลูกค้าจองทริปผ่านลิงก์ของคุณ<br />
                รายการจองจะแสดงที่นี่
              </p>
              
              {/* CTA Button */}
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  แชร์ลิงก์ของคุณ
                </button>
                <p className="text-xs text-gray-500">
                  หรือตรวจสอบสถานะการอนุมัติ
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}