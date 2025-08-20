import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ReportsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'approved') {
    redirect('/dashboard?error=Reports access requires approval')
  }

  // Get seller's bookings - try both user.id and referral_code
  const { data: bookings } = await supabase
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

  // Also try to get bookings by referral code if none found
  let allBookings = bookings || []
  if ((!bookings || bookings.length === 0) && profile.referral_code) {
    const { data: bookingsByRef } = await supabase
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
      .eq('referral_code', profile.referral_code)
      .order('created_at', { ascending: false })
    
    allBookings = bookingsByRef || []
  }

  // Calculate stats
  const totalCommission = allBookings?.reduce((sum, booking) => sum + Number(booking.commission_amount || 0), 0) || 0
  const totalSales = allBookings?.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0) || 0
  const totalBookings = allBookings?.length || 0
  
  const confirmedBookings = allBookings?.filter(b => b.status === 'approved').length || 0
  const pendingBookings = allBookings?.filter(b => b.status === 'pending').length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">รายงานยอดขาย</h1>
        <p className="mt-1 text-sm text-gray-600">
          รายงานสถิติการขายและการจองของ Seller
        </p>
      </div>

      {/* Stats Cards */}
            {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">คอมมิชชั่นรวม</dt>
                  <dd className="text-lg font-medium text-gray-900">฿{totalCommission.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">ยอดขายรวม</dt>
                  <dd className="text-lg font-medium text-gray-900">฿{totalSales.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">จำนวนการจอง</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">ยืนยันแล้ว</dt>
                  <dd className="text-lg font-medium text-gray-900">{confirmedBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Bookings Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">รายการจองล่าสุด</h3>
        </div>
        <div className="overflow-x-auto">
          {allBookings && allBookings.length > 0 ? (
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
                {allBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.customers?.full_name || 'ไม่มีข้อมูล'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.customers?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.trip_schedules?.trips?.title || 'ไม่มีข้อมูล'}
                      </div>
                      {booking.trip_schedules?.departure_date && (
                        <div className="text-sm text-gray-500">
                          {new Date(booking.trip_schedules.departure_date).toLocaleDateString('th-TH')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{Number(booking.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{Number(booking.commission_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : booking.status === 'inprogress'
                          ? 'bg-blue-100 text-blue-800'
                          : booking.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-800'
                          : booking.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status === 'approved' ? 'ผ่านการยืนยัน' : 
                         booking.status === 'pending' ? 'รอดำเนินการ' :
                         booking.status === 'inprogress' ? 'อยู่ระหว่างดำเนินการ' :
                         booking.status === 'cancelled' ? 'ลูกค้ายกเลิก' : 
                         booking.status === 'rejected' ? 'ไม่ผ่านการยืนยัน' : booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('th-TH') : 'ไม่มีข้อมูล'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">ยังไม่มีการจอง</h3>
              <p className="mt-1 text-sm text-gray-500">
                เมื่อมีการจองทริปผ่านคุณ ข้อมูลจะแสดงที่นี่
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
