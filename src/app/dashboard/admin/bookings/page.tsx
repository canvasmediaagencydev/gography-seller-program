'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '../../../../../database.types'
import Link from 'next/link'

interface BookingWithRelations extends Tables<'bookings'> {
    customers?: {
        full_name: string
        email: string
        phone: string | null
    } | null
    trip_schedules?: {
        departure_date: string
        return_date: string
        trips?: {
            title: string
            countries?: {
                name: string
                flag_emoji: string | null
            } | null
        } | null
    } | null
}

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<BookingWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('pending')

    const supabase = createClient()

    const fetchBookings = async () => {
        try {
            setLoading(true)
            
            let query = supabase
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
                            countries (
                                name,
                                flag_emoji
                            )
                        )
                    )
                `)
                .order('created_at', { ascending: false })

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            setBookings(data || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookings()
    }, [filter])

    const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'rejected') => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            
            const { error } = await supabase
                .from('bookings')
                .update({
                    status,
                    approved_by: user?.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', bookingId)

            if (error) throw error

            // Refresh bookings
            fetchBookings()
        } catch (err: any) {
            alert('เกิดข้อผิดพลาด: ' + err.message)
        }
    }

    const formatPrice = (amount: number) => {
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
            year: 'numeric'
        })
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        }

        const labels = {
            pending: 'รอการอนุมัติ',
            confirmed: 'อนุมัติแล้ว',
            rejected: 'ปฏิเสธ'
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status as keyof typeof labels] || status}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">จัดการการจองทริป</h1>
                <p className="text-gray-600">อนุมัติหรือปฏิเสธการจองทริปจากลูกค้า</p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { key: 'pending', label: 'รอการอนุมัติ', count: bookings.filter(b => b.status === 'pending').length },
                            { key: 'confirmed', label: 'อนุมัติแล้ว', count: bookings.filter(b => b.status === 'confirmed').length },
                            { key: 'rejected', label: 'ปฏิเสธ', count: bookings.filter(b => b.status === 'rejected').length },
                            { key: 'all', label: 'ทั้งหมด', count: bookings.length }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key as any)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    filter === tab.key
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label} 
                                {filter === 'all' && tab.key !== 'all' && tab.count > 0 && (
                                    <span className="ml-1 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Bookings List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📋</div>
                        <h3 className="text-lg font-medium text-gray-900">ไม่มีการจองทริป</h3>
                        <p className="text-gray-500">ยังไม่มีการจองทริปในหมวดหมู่นี้</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {bookings.map((booking) => (
                            <li key={booking.id} className="p-6 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {booking.trip_schedules?.trips?.title}
                                                </h3>
                                                <span className="text-2xl">
                                                    {booking.trip_schedules?.trips?.countries?.flag_emoji}
                                                </span>
                                                {getStatusBadge(booking.status || 'pending')}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-orange-600">
                                                    {formatPrice(booking.total_amount)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    คอมมิชชั่น: {formatPrice(booking.commission_amount)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                            <div>
                                                <p className="font-medium">ลูกค้า</p>
                                                <p>{booking.customers?.full_name}</p>
                                                <p>{booking.customers?.email}</p>
                                                <p>{booking.customers?.phone}</p>
                                            </div>
                                            
                                            <div>
                                                <p className="font-medium">วันเดินทาง</p>
                                                <p>
                                                    {booking.trip_schedules && 
                                                        `${formatDate(booking.trip_schedules.departure_date)} - ${formatDate(booking.trip_schedules.return_date)}`
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="font-medium">วันที่จอง</p>
                                                <p>{formatDate(booking.created_at || '')}</p>
                                                {booking.notes && (
                                                    <>
                                                        <p className="font-medium mt-2">หมายเหตุ</p>
                                                        <p className="text-xs">{booking.notes}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {booking.status === 'pending' && (
                                            <div className="mt-4 flex space-x-3">
                                                <button
                                                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    อนุมัติ
                                                </button>
                                                <button
                                                    onClick={() => updateBookingStatus(booking.id, 'rejected')}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    ปฏิเสธ
                                                </button>
                                                <Link
                                                    href={`/dashboard/admin/bookings/${booking.id}`}
                                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    ดูรายละเอียด
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
