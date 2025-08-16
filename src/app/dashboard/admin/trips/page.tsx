import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TripImage from '@/components/TripImage'

export default async function AdminTripsPage() {
  const supabase = await createClient()
  
  // Get all trips with country info
  const { data: trips, error } = await supabase
    .from('trips')
    .select(`
      *,
      countries (
        name,
        flag_emoji
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการ Trips</h1>
          <p className="text-gray-600">สร้าง แก้ไข และจัดการทริปทั้งหมด</p>
        </div>
        <Link
          href="/dashboard/admin/trips/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างทริปใหม่
        </Link>
      </div>

      {trips && trips.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ทริป
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ประเทศ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ระยะเวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ราคา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {trip.cover_image_url && (
                            <div className="flex-shrink-0 h-10 w-10">
                              <TripImage
                                src={trip.cover_image_url}
                                alt={trip.title}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            </div>
                          )}
                          <div className={trip.cover_image_url ? "ml-4" : ""}>
                            <div className="text-sm font-medium text-gray-900">
                              {trip.title}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {trip.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          {(trip.countries as any)?.flag_emoji && (
                            <span className="mr-2 text-lg">
                              {(trip.countries as any).flag_emoji}
                            </span>
                          )}
                          {(trip.countries as any)?.name || 'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.duration_days} วัน {trip.duration_nights} คืน
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ฿{Number(trip.price_per_person).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trip.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {trip.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/admin/trips/${trip.id}`}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-xs"
                          >
                            ดู
                          </Link>
                          <Link
                            href={`/dashboard/admin/trips/${trip.id}/edit`}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded text-xs"
                          >
                            แก้ไข
                          </Link>
                          <Link
                            href={`/dashboard/admin/trips/${trip.id}/schedules`}
                            className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded text-xs"
                          >
                            ตารางเวลา
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีทริปในระบบ</h3>
          <p className="mt-1 text-sm text-gray-500">
            เริ่มต้นสร้างทริปแรกของคุณ
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/admin/trips/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              สร้างทริปใหม่
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
