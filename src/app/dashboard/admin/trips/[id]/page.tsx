import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TripImage from '@/components/TripImage'

interface Trip {
  id: string
  title: string
  description: string | null
  duration_days: number
  duration_nights: number
  price_per_person: number
  total_seats: number
  commission_type: string | null
  commission_value: number
  geography_link: string | null
  cover_image_url: string | null
  is_active: boolean | null
  created_at: string | null
  countries?: {
    name: string
    flag_emoji: string | null
  }
}

interface Schedule {
  id: string
  departure_date: string
  return_date: string
  registration_deadline: string
  available_seats: number
  is_active: boolean | null
}

interface Booking {
  id: string
  booking_date: string | null
  total_amount: number
  commission_amount: number
  status: string | null
  customers?: {
    full_name: string
    email: string
  }
  seller?: {
    full_name: string | null
    email: string | null
  }
}

export default async function TripDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id: tripId } = await params

  // Get trip details with country
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      *,
      countries (
        name,
        flag_emoji
      )
    `)
    .eq('id', tripId)
    .single()

  // Get trip schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from('trip_schedules')
    .select('*')
    .eq('trip_id', tripId)
    .order('departure_date', { ascending: true })

  // Get bookings for this trip through schedules
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      customers (
        full_name,
        email
      ),
      trip_schedules!inner (
        id,
        trip_id
      )
    `)
    .eq('trip_schedules.trip_id', tripId)
    .order('booking_date', { ascending: false })

  if (tripError || !trip) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">ไม่พบข้อมูลทริป</p>
        </div>
      </div>
    )
  }

  const typedTrip = trip as Trip
  const typedSchedules = (schedules || []) as Schedule[]
  const typedBookings = (bookings || []) as Booking[]

  // Calculate statistics
  const totalBookings = typedBookings.length
  const totalRevenue = typedBookings.reduce((sum, booking) => sum + booking.total_amount, 0)
  const totalCommission = typedBookings.reduce((sum, booking) => sum + booking.commission_amount, 0)
  const activeSchedules = typedSchedules.filter(s => s.is_active).length

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/dashboard/admin/trips"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับ
          </Link>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{typedTrip.title}</h1>
            <p className="text-gray-600">รายละเอียดทริปและสถิติ</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/admin/trips/${tripId}/edit`}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              แก้ไข
            </Link>
            <Link
              href={`/dashboard/admin/trips/${tripId}/schedules`}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4M8 7h8M8 7v4m0 0h8m-8 0v4h8V11" />
              </svg>
              จัดการตารางเวลา
            </Link>
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลทริป</h2>
          
          {typedTrip.cover_image_url && (
            <div className="mb-4">
              <TripImage
                src={typedTrip.cover_image_url}
                alt={typedTrip.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">ประเทศ</dt>
              <dd className="text-sm text-gray-900 flex items-center">
                {(typedTrip.countries as any)?.flag_emoji && (
                  <span className="mr-2 text-lg">
                    {(typedTrip.countries as any).flag_emoji}
                  </span>
                )}
                {(typedTrip.countries as any)?.name || 'ไม่ระบุ'}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">ระยะเวลา</dt>
              <dd className="text-sm text-gray-900">
                {typedTrip.duration_days} วัน {typedTrip.duration_nights} คืน
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">ราคาต่อคน</dt>
              <dd className="text-sm text-gray-900">
                ฿{Number(typedTrip.price_per_person).toLocaleString()}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">จำนวนที่นั่ง</dt>
              <dd className="text-sm text-gray-900">{typedTrip.total_seats} คน</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">คอมมิชชั่น</dt>
              <dd className="text-sm text-gray-900">
                {typedTrip.commission_value}
                {typedTrip.commission_type === 'percentage' ? '%' : ' บาท'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">สถานะ</dt>
              <dd className="text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  typedTrip.is_active 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {typedTrip.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </dd>
            </div>

            {typedTrip.description && (
              <div>
                <dt className="text-sm font-medium text-gray-500">รายละเอียด</dt>
                <dd className="text-sm text-gray-900">{typedTrip.description}</dd>
              </div>
            )}

            {typedTrip.geography_link && (
              <div>
                <dt className="text-sm font-medium text-gray-500">แผนที่</dt>
                <dd className="text-sm">
                  <a 
                    href={typedTrip.geography_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ดูแผนที่
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">สถิติ</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-blue-600">ตารางเวลาที่เปิดใช้งาน</dt>
              <dd className="text-2xl font-bold text-blue-900">{activeSchedules}</dd>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-green-600">จำนวนการจอง</dt>
              <dd className="text-2xl font-bold text-green-900">{totalBookings}</dd>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-yellow-600">รายได้รวม</dt>
              <dd className="text-2xl font-bold text-yellow-900">
                ฿{totalRevenue.toLocaleString()}
              </dd>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-purple-600">คอมมิชชั่นรวม</dt>
              <dd className="text-2xl font-bold text-purple-900">
                ฿{totalCommission.toLocaleString()}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Schedules Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">ตารางเวลา</h2>
          <Link
            href={`/dashboard/admin/trips/${tripId}/schedules`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            จัดการทั้งหมด →
          </Link>
        </div>

        {typedSchedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันเดินทาง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันกลับ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ปิดรับสมัคร
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ที่นั่งว่าง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {typedSchedules.slice(0, 5).map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(schedule.departure_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(schedule.return_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(schedule.registration_deadline).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {schedule.available_seats}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        schedule.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {schedule.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">ยังไม่มีตารางเวลา</p>
            <Link
              href={`/dashboard/admin/trips/${tripId}/schedules`}
              className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              สร้างตารางเวลาใหม่
            </Link>
          </div>
        )}
      </div>

      {/* Recent Bookings Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">การจองล่าสุด</h2>
        </div>

        {typedBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันจอง
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {typedBookings.slice(0, 10).map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(booking.customers as any)?.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(booking.customers as any)?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('th-TH') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{booking.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{booking.commission_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status === 'approved' ? 'ยืนยันแล้ว' : 
                         booking.status === 'pending' ? 'รอยืนยัน' : 
                         booking.status === 'cancelled' ? 'ยกเลิก' : booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">ยังไม่มีการจอง</p>
          </div>
        )}
      </div>
    </div>
  )
}
