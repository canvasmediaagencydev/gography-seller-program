import { FaUser } from "react-icons/fa"
import { ImLink } from "react-icons/im"
import { TripWithRelations, ViewType } from '../../types/trip'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface TripsListProps {
    trips: TripWithRelations[]
    viewType: ViewType
    userId: string | null
}

export function TripsList({ trips, viewType, userId }: TripsListProps) {
    const { handleCopy } = useCopyToClipboard()
    const [sellerStatus, setSellerStatus] = useState<string | null>(null)
    const supabase = createClient()

    // Fetch seller status
    useEffect(() => {
        if (userId) {
            const fetchSellerStatus = async () => {
                const { data } = await supabase
                    .from('user_profiles')
                    .select('status')
                    .eq('id', userId)
                    .single()
                
                setSellerStatus(data?.status || null)
            }
            fetchSellerStatus()
        }
    }, [userId])

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatDateRange = (startDate: string | null, endDate: string | null) => {
        if (!startDate || !endDate) return '-'
        const start = formatDate(startDate)
        const end = formatDate(endDate)
        return `${start} - ${end}`
    }

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const getCommissionAmount = (trip: TripWithRelations) => {
        if (trip.commission_type === 'percentage') {
            return (trip.price_per_person * trip.commission_value) / 100
        } else {
            return trip.commission_value
        }
    }

    const getSalesData = (trip: TripWithRelations) => {
        // ใช้ข้อมูลจาก next_schedule ที่มี available_seats ที่คำนวณแล้ว
        const nextSchedule = trip.next_schedule
        const originalSeats = nextSchedule?.available_seats || 0 // จำนวนที่นั่งจริงจากตาราง
        const remainingSeats = trip.available_seats ?? originalSeats // ที่นั่งคงเหลือหลังจากหักการจองแล้ว
        const mySales = trip.seller_bookings_count || 0
        
        return {
            soldSeats: mySales, // จำนวนที่ seller คนนี้ขายได้
            totalSoldSeats: originalSeats - remainingSeats, // จำนวนที่ขายไปแล้วทั้งหมด
            maxSeats: originalSeats, // จำนวนที่นั่งจริงจาก trip_schedules
            remainingSeats: remainingSeats // ที่นั่งคงเหลือ (คำนวณจาก API แล้ว)
        }
    }

    const copyShareLink = (trip: TripWithRelations) => {
        if (sellerStatus !== 'approved') {
            toast.error('คุณต้องได้รับการอนุมัติจากผู้ดูแลระบบก่อนจึงจะสามารถแชร์ลิงก์ทริปได้')
            return
        }
        const shareUrl = `${window.location.origin}/trips/${trip.id}`
        handleCopy(shareUrl)
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm text-gray-700">Trip Name</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700">Travel Dates</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700">Deadline</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700">Seats</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700">Sold</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700">Commission</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700">Share</th>
                    </tr>
                </thead>
                <tbody>
                    {trips.map((trip) => {
                        const salesData = getSalesData(trip)
                        const remainingSeats = salesData.remainingSeats
                        const remainingPercent = salesData.maxSeats > 0 ? (remainingSeats / salesData.maxSeats) * 100 : 0
                        const isLowSeats = remainingPercent < 20

                        return (
                            <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                                {/* Trip Name with Image */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center">
                                        <div className="relative w-20 h-12 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 rounded-lg overflow-hidden mr-3">
                                            {trip.cover_image_url ? (
                                                <img
                                                    src={trip.cover_image_url}
                                                    alt={trip.title}
                                                    className="absolute inset-0 w-full h-full object-cover object-center"
                                                    style={{ aspectRatio: '5/3' }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-lg">
                                                    🌍
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 text-md">{trip.title}</h3>
                                        </div>
                                    </div>
                                </td>

                                {/* Travel Dates - using next_schedule if available */}
                                <td className="px-4 py-4 text-center">
                                    <div className="text-sm text-gray-800">
                                        {trip.next_schedule 
                                            ? formatDateRange(trip.next_schedule.departure_date, trip.next_schedule.return_date)
                                            : '-'
                                        }
                                    </div>
                                </td>

                                {/* Deadline */}
                                <td className="px-4 py-4 text-center">
                                    <div className="text-sm text-gray-800">
                                        {trip.next_schedule
                                            ? formatDate(trip.next_schedule.registration_deadline)
                                            : '-'
                                        }
                                    </div>
                                </td>

                                {/* Total Seats (with progress bar) */}
                                <td className="px-4 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="text-sm flex items-center justify-center w-full">
                                            <span className={`${isLowSeats ? 'text-red-600' : 'text-gray-800'} font-semibold`}>
                                                {remainingSeats}
                                            </span>
                                            /{salesData.maxSeats} <FaUser className='inline text-gray-400 ml-1' />
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-20 h-2 bg-gray-300 rounded-full mt-1">
                                            <div
                                                className="h-2 rounded-full transition-all bg-gray-900"
                                                style={{
                                                    width: `${salesData.maxSeats > 0 ? Math.min(((salesData.maxSeats - remainingSeats) / salesData.maxSeats) * 100, 100) : 0}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                {/* My Sales */}
                                <td className="px-4 py-4 text-center">
                                    <div className="text-lg text-gray-800">
                                        {salesData.soldSeats}
                                    </div>
                                </td>

                                {/* Commission */}
                                <td className="px-4 py-4 text-center">
                                    <div className="text-lg text-gray-800">
                                        {formatPrice(getCommissionAmount(trip))}
                                    </div>
                                </td>

                                {/* Share Button */}
                                <td className="px-4 py-4 text-center">
                                    <button
                                        onClick={() => copyShareLink(trip)}
                                        disabled={sellerStatus !== 'approved'}
                                        className="px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm bg-gray-800 text-white hover:text-primary-yellow hover:scale-110 transition-all duration-200 ease-in-out cursor-pointer mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:text-white"
                                    >
                                        <ImLink className='text-xs' />
                                        <span>Share</span>
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
