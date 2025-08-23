'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReportsLoading from '@/components/reports/ReportsLoading'
import ReportsError from '@/components/reports/ReportsError'

interface Booking {
  [key: string]: any // Allow any additional properties from Supabase
}

interface UserProfile {
  [key: string]: any // Allow any additional properties from Supabase
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
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

        // Get seller's bookings - try both user.id and referral_code
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
              )
            `)
            .eq('referral_code', profileData.referral_code)
            .order('created_at', { ascending: false })
          
          allBookings = refBookings || []
        }

        if (bookingsError) {
          console.error('Bookings error:', bookingsError)
        }

        setBookings(allBookings)

      } catch (error) {
        console.error('Error fetching reports data:', error)
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  // Calculate stats
  const approvedBookings = bookings?.filter(b => b.status === 'approved') || []
  const totalCommission = approvedBookings.reduce((sum, booking) => sum + Number(booking.commission_amount || 0), 0)
  const totalSales = approvedBookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0)
  const totalBookings = bookings?.length || 0
  const confirmedBookings = approvedBookings.length
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0

  if (loading) {
    return <ReportsLoading />
  }

  if (error) {
    return <ReportsError message={error} />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">รายงานการขาย</h1>
            <p className="mt-1 text-gray-600">
              ภาพรวมและสถิติการจองของคุณ
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">อัปเดตล่าสุด</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">คอมมิชชั่นรวม</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                ฿{totalCommission.toLocaleString()}
              </p>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ยอดขายรวม</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
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

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">จำนวนการจอง</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{totalBookings}</p>
              <p className="text-xs text-gray-500 mt-1">ทั้งหมด</p>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ยืนยันแล้ว</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{confirmedBookings}</p>
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


      {/* Performance Summary */}
      {totalBookings > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปผลการดำเนินงาน</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">
                {totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">อัตราการยืนยัน</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">
                ฿{confirmedBookings > 0 ? Math.round(totalSales / confirmedBookings).toLocaleString() : 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">ยอดเฉลี่ยต่อรายการ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">
                ฿{confirmedBookings > 0 ? Math.round(totalCommission / confirmedBookings).toLocaleString() : 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">คอมมิชชั่นเฉลี่ย</div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">รายการจองทั้งหมด</h3>
            <span className="text-sm text-gray-500">{bookings?.length || 0} รายการ</span>
          </div>
        </div>
        
        {bookings && bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ทริป
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดรวม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คอมมิชชั่น
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่จอง
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {booking.customers?.full_name?.charAt(0) || 'N'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.customers?.full_name || 'ไม่มีข้อมูล'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.customers?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.trip_schedules?.trips?.title || 'ไม่มีข้อมูล'}
                      </div>
                      {booking.trip_schedules?.departure_date && (
                        <div className="text-sm text-gray-500">
                          {new Date(booking.trip_schedules.departure_date).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ฿{Number(booking.total_amount).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ฿{Number(booking.commission_amount).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'approved' 
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : booking.status === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : booking.status === 'inprogress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : booking.status === 'cancelled'
                          ? 'bg-gray-50 text-gray-700 border border-gray-200'
                          : booking.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {booking.status === 'approved' ? 'ยืนยันแล้ว' : 
                         booking.status === 'pending' ? 'รอดำเนินการ' :
                         booking.status === 'inprogress' ? 'กำลังดำเนินการ' :
                         booking.status === 'cancelled' ? 'ยกเลิกแล้ว' : 
                         booking.status === 'rejected' ? 'ไม่อนุมัติ' : booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'ไม่มีข้อมูล'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900">ยังไม่มีการจอง</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              เมื่อมีลูกค้าจองทริปผ่านคุณ ข้อมูลจะแสดงในตารางนี้
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
