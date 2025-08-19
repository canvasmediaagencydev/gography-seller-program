'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '../../../../../database.types'

type Customer = Tables<'customers'> & {
  bookings?: {
    id: string
    status: string | null
    total_amount: number
    trip_schedule_id: string | null
    created_at: string | null
    trips?: {
      title: string
    } | null
  }[]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          bookings (
            id,
            status,
            total_amount,
            trip_schedule_id,
            created_at,
            trip_schedules (
              trips (
                title
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Flatten the nested data
      const formattedCustomers = data.map(customer => ({
        ...customer,
        bookings: customer.bookings?.map(booking => ({
          ...booking,
          trips: booking.trip_schedules?.trips
        }))
      }))

      setCustomers(formattedCustomers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId)
    try {
      console.log('Updating booking:', bookingId, 'to status:', newStatus)
      
      // Try using a different approach - update via API route if client update fails
      const response = await fetch('/api/admin/bookings/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status: newStatus
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update booking status')
      }

      const result = await response.json()
      console.log('Update successful:', result)
      
      // Refresh customer data
      await fetchCustomers()
      
      // Show success message
      console.log(`อัพเดตสถานะการจองเป็น "${newStatus}" เรียบร้อยแล้ว`)
      
    } catch (error: any) {
      console.error('Error updating booking status:', error)
      
      // Fallback: try direct supabase update
      try {
        console.log('Trying direct supabase update...')
        const { data, error: supabaseError } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', bookingId)
          .select()

        if (supabaseError) {
          throw supabaseError
        }

        console.log('Direct supabase update successful:', data)
        await fetchCustomers()
        
      } catch (fallbackError: any) {
        console.error('Fallback update also failed:', fallbackError)
        
        // Show user-friendly error message
        const errorMessage = fallbackError?.message || error?.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ'
        alert(`เกิดข้อผิดพลาด: ${errorMessage}`)
      }
      
    } finally {
      setUpdatingStatus(null)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    
    const styles = {
      'approved': 'bg-green-50 text-green-700 border border-green-200',
      'confirmed': 'bg-green-50 text-green-700 border border-green-200',
      'pending': 'bg-amber-50 text-amber-700 border border-amber-200',
      'cancelled': 'bg-red-50 text-red-700 border border-red-200',
      'rejected': 'bg-red-50 text-red-700 border border-red-200'
    }
    
    const labels = {
      'approved': 'อนุมัติแล้ว',
      'confirmed': 'ยืนยันแล้ว',
      'pending': 'รอดำเนินการ',
      'cancelled': 'ยกเลิกแล้ว',
      'rejected': 'ปฏิเสธ'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('th-TH').format(amount) + ' ฿'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">จัดการลูกค้าและการจอง</h1>
              <p className="text-gray-600">จัดการข้อมูลลูกค้า อนุมัติการจอง และติดตามสถานะ</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <span className="text-gray-700 text-sm font-medium">ลูกค้าทั้งหมด: {customers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Professional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ลูกค้าทั้งหมด</p>
                <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">การจองรวม</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {customers.reduce((sum, c) => sum + (c.bookings?.length || 0), 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H9.5" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">รอดำเนินการ</p>
                <p className="text-2xl font-semibold text-amber-600">
                  {customers.reduce((sum, c) => sum + (c.bookings?.filter(b => b.status === 'pending').length || 0), 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">อนุมัติ/ยืนยันแล้ว</p>
                <p className="text-2xl font-semibold text-green-600">
                  {customers.reduce((sum, c) => sum + (c.bookings?.filter(b => b.status === 'approved' || b.status === 'confirmed').length || 0), 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Professional Customer Cards */}
        <div className="space-y-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
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
                                {getStatusBadge(booking.status)}
                              </div>
                              
                              {/* Professional Status Selector */}
                              <div className="flex items-center space-x-2">
                                <select
                                  value={booking.status || 'pending'}
                                  onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                                  disabled={updatingStatus === booking.id}
                                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  <option value="pending">รอดำเนินการ</option>
                                  <option value="approved">อนุมัติ</option>
                                  <option value="confirmed">ยืนยัน</option>
                                  <option value="cancelled">ยกเลิก</option>
                                  <option value="rejected">ปฏิเสธ</option>
                                </select>
                                
                                {updatingStatus === booking.id && (
                                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                )}
                              </div>
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
          ))}
        </div>

        {/* Professional Empty State */}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบข้อมูลลูกค้า</h3>
            {searchTerm ? (
              <div>
                <p className="text-gray-500 mb-1">ไม่พบผลลัพธ์สำหรับ "{searchTerm}"</p>
                <p className="text-gray-400 text-sm">ลองเปลี่ยนคำค้นหาหรือตรวจสอบการสะกด</p>
              </div>
            ) : (
              <p className="text-gray-500">ยังไม่มีลูกค้าในระบบ</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
