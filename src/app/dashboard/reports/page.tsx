'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSystem, ErrorSystem } from '@/components/ui'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

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
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all')
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

  // Filter bookings by period
  const getFilteredBookings = () => {
    if (selectedPeriod === 'all') return bookings || []

    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return (bookings || []).filter(booking => {
      const bookingDate = new Date(booking.created_at || '')

      switch (selectedPeriod) {
        case 'today':
          return bookingDate >= startOfDay
        case 'week':
          return bookingDate >= startOfWeek
        case 'month':
          return bookingDate >= startOfMonth
        default:
          return true
      }
    })
  }

  const filteredBookings = getFilteredBookings()

  // Calculate stats using new commission system
  const approvedBookings = filteredBookings?.filter(b => b.status === 'approved') || []
  
  // Calculate commission from commission_payments instead of booking.commission_amount
  const allCommissionPayments = filteredBookings?.flatMap(b => b.commission_payments || []) || []
  const totalCommissionEarned = allCommissionPayments
    .filter(cp => cp.status === 'paid')
    .reduce((sum, cp) => sum + cp.amount, 0)
  const totalCommissionPending = allCommissionPayments
    .filter(cp => cp.status === 'pending')
    .reduce((sum, cp) => sum + cp.amount, 0)
  const totalCommissionAll = totalCommissionEarned + totalCommissionPending

  const totalSales = approvedBookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0)
  const totalBookings = filteredBookings?.length || 0
  const confirmedBookings = approvedBookings.length
  const pendingBookings = filteredBookings?.filter(b => b.status === 'pending').length || 0

  // Payment status breakdown - ใช้ระบบเดียวกับ admin
  const fullyPaidBookings = filteredBookings?.filter(b => b.payment_status === 'completed').length || 0
  const partialPaidBookings = filteredBookings?.filter(b => b.payment_status === 'partial').length || 0
  const pendingPaymentBookings = filteredBookings?.filter(b => b.payment_status === 'pending').length || 0
  const refundedBookings = filteredBookings?.filter(b => b.payment_status === 'refunded').length || 0

  if (loading) {
    return <LoadingSystem variant="dashboard" />
  }

  if (error) {
    return <ErrorSystem variant="fullscreen" message={error} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Professional Header with Gradient Background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl mb-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <ChartBarIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      รายงานการขายและประสิทธิภาพ
                    </h1>
                    <p className="text-blue-100 text-sm mt-1">
                      ติดตามและวิเคราะห์ผลการดำเนินงานของคุณ
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Period Filter */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                  {[
                    { value: 'today', label: 'วันนี้', icon: CalendarDaysIcon },
                    { value: 'week', label: 'สัปดาห์', icon: CalendarDaysIcon },
                    { value: 'month', label: 'เดือน', icon: CalendarDaysIcon },
                    { value: 'all', label: 'ทั้งหมด', icon: CalendarDaysIcon }
                  ].map(period => (
                    <button
                      key={period.value}
                      onClick={() => setSelectedPeriod(period.value as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedPeriod === period.value
                          ? 'bg-white text-blue-600 shadow-lg'
                          : 'text-white/90 hover:bg-white/10'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{refreshing ? 'กำลังโหลด...' : 'รีเฟรช'}</span>
                </button>

                {/* Export Button */}
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all shadow-lg">
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">ส่งออกรายงาน</span>
                </button>
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
              <ClockIcon className="w-4 h-4" />
              <span>อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Commission Earned Card */}
          <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">รายได้คอมมิชชั่น</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  ฿{totalCommissionEarned.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">ที่ได้รับแล้ว</p>
            </div>
          </div>

          {/* Commission Pending Card */}
          <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/30">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-full">
                  <span className="text-xs font-semibold text-amber-600">{pendingBookings} รายการ</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">คอมมิชชั่นรอรับ</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  ฿{totalCommissionPending.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">อยู่ระหว่างดำเนินการ</p>
            </div>
          </div>

          {/* Total Sales Card */}
          <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
                  <span className="text-xs font-semibold text-blue-600">{confirmedBookings} จาก {totalBookings}</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">ยอดขายที่ยืนยัน</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  ฿{totalSales.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">จากการจองที่ยืนยันแล้ว</p>
            </div>
          </div>

          {/* Total Bookings Card */}
          <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/30">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full">
                  <UserGroupIcon className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">จำนวนการจอง</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
                <span className="text-sm text-gray-500">รายการ</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">ทั้งหมดในระบบ</p>
            </div>
          </div>
        </div>

        {/* Bookings List - Professional Business Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">ประวัติการจอง</h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    จัดการและติดตามรายการจองทั้งหมด
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-sm text-gray-600">แสดง </span>
                  <span className="text-sm font-bold text-gray-900">{Math.min(filteredBookings?.length || 0, 10)}</span>
                  <span className="text-sm text-gray-600"> จาก </span>
                  <span className="text-sm font-bold text-gray-900">{filteredBookings?.length || 0}</span>
                  <span className="text-sm text-gray-600"> รายการ</span>
                </div>
              </div>
            </div>
          </div>
        
          {filteredBookings && filteredBookings.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ลูกค้า & ทริป
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      วันที่จอง
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ยอดเงิน
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      คอมมิชชั่น
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      สถานะการชำระ
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      สถานะการจอง
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.slice(0, 10).map((booking, index) => {
                    const commissionEarned = booking.commission_payments
                      ?.filter(cp => cp.status === 'paid')
                      .reduce((sum, cp) => sum + cp.amount, 0) || 0
                    const commissionPending = booking.commission_payments
                      ?.filter(cp => cp.status === 'pending')
                      .reduce((sum, cp) => sum + cp.amount, 0) || 0

                    const getPaymentStatusBadge = (status: string | null) => {
                      const statusConfig = {
                        partial: {
                          label: 'จ่ายมัดจำ',
                          bg: 'bg-blue-50 text-blue-700',
                          icon: <ClockIcon className="w-3.5 h-3.5" />
                        },
                        completed: {
                          label: 'จ่ายครบ',
                          bg: 'bg-green-50 text-green-700',
                          icon: <CheckCircleIcon className="w-3.5 h-3.5" />
                        },
                        pending: {
                          label: 'รอชำระ',
                          bg: 'bg-amber-50 text-amber-700',
                          icon: <ClockIcon className="w-3.5 h-3.5" />
                        },
                        refunded: {
                          label: 'คืนเงิน',
                          bg: 'bg-red-50 text-red-700',
                          icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        }
                      }
                      const config = statusConfig[status as keyof typeof statusConfig]

                      if (!config) return <span className="text-xs text-gray-400">-</span>

                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${config.bg}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      )
                    }

                    const getBookingStatusBadge = (status: string | null) => {
                      const statusConfig = {
                        approved: {
                          label: 'ยืนยันแล้ว',
                          bg: 'bg-green-50 text-green-700 border-green-200',
                          icon: <CheckCircleIcon className="w-4 h-4" />
                        },
                        pending: {
                          label: 'รอดำเนินการ',
                          bg: 'bg-amber-50 text-amber-700 border-amber-200',
                          icon: <ClockIcon className="w-4 h-4" />
                        },
                        inprogress: {
                          label: 'กำลังดำเนินการ',
                          bg: 'bg-blue-50 text-blue-700 border-blue-200',
                          icon: <ArrowPathIcon className="w-4 h-4" />
                        },
                        cancelled: {
                          label: 'ยกเลิก',
                          bg: 'bg-gray-50 text-gray-700 border-gray-200',
                          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        },
                        rejected: {
                          label: 'ไม่อนุมัติ',
                          bg: 'bg-red-50 text-red-700 border-red-200',
                          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        }
                      }
                      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border ${config.bg}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      )
                    }

                    return (
                      <tr key={booking.id} className={`hover:bg-slate-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        {/* Customer & Trip */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                              <UserGroupIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {booking.customers?.full_name || 'ไม่มีข้อมูล'}
                              </div>
                              <div className="text-xs text-gray-600 truncate mt-0.5">
                                {booking.trip_schedules?.trips?.title || 'ไม่มีข้อมูลทริป'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Booking Date */}
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.trip_schedules?.departure_date ? new Date(booking.trip_schedules.departure_date).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short'
                              }) : '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.created_at ? new Date(booking.created_at).toLocaleDateString('th-TH', {
                                year: '2-digit'
                              }) : '-'}
                            </div>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="px-6 py-5 text-right">
                          <div className="text-base font-bold text-gray-900">
                            ฿{Number(booking.total_amount).toLocaleString()}
                          </div>
                        </td>

                        {/* Commission */}
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-base font-bold text-green-600">
                              ฿{commissionEarned.toLocaleString()}
                            </div>
                            {commissionPending > 0 && (
                              <div className="text-xs text-amber-600 font-medium">
                                +฿{commissionPending.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className="px-6 py-5 text-center">
                          {getPaymentStatusBadge(booking.payment_status)}
                        </td>

                        {/* Booking Status */}
                        <td className="px-6 py-5 text-center">
                          {getBookingStatusBadge(booking.status)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredBookings.length > 10 && (
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    แสดง <span className="font-semibold text-gray-900">1-10</span> จาก{' '}
                    <span className="font-semibold text-gray-900">{filteredBookings.length}</span> รายการ
                  </div>
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-blue-300 transition-all shadow-sm">
                    <span>ดูทั้งหมด</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-20 px-6">
              <div className="max-w-md mx-auto">
                {/* Empty State Icon with Animation */}
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                  <DocumentTextIcon className="w-10 h-10 text-blue-600" />
                </div>

                {/* Empty State Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">ยังไม่มีข้อมูลการจอง</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-8">
                  {selectedPeriod === 'all'
                    ? 'เมื่อมีลูกค้าจองทริปผ่านลิงก์ของคุณ รายการจองจะปรากฏที่นี่'
                    : 'ไม่พบข้อมูลการจองในช่วงเวลาที่เลือก ลองเลือกช่วงเวลาอื่น'
                  }
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg shadow-blue-500/30">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    แชร์ลิงก์อ้างอิง
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('all')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    ดูทั้งหมด
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}