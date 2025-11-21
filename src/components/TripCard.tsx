'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import TripImage from './TripImage'
import SeatIndicator from './ui/SeatIndicator'
import { CampaignBadge } from './trips/CampaignBadge'
import { useTripData } from '../hooks/useTripData'
import { useTripSchedules } from '../hooks/useTripSchedules'
import { TripCardProps } from '../types/trip'
import { Tables } from '../../database.types'
import { CalendarDays, Info, Building2, MapPin, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image'

const TripCard = memo(function TripCard({ trip, viewType = 'general', currentSellerId, sellerData, realtimeVersion }: TripCardProps) {
    const [selectedSchedule, setSelectedSchedule] = useState<Tables<'trip_schedules'> | null>(trip.next_schedule || null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const { duration, commission, dateRange, deadlineInfo, availableSeats, mySales } = useTripData(trip)

    // Get real-time schedules with available seats
    // OPTIMIZED: Pass realtimeVersion from parent to trigger refetches
    const { schedules: allSchedules, loading: schedulesLoading } = useTripSchedules(trip.id, realtimeVersion)

    // Get real-time seats for currently selected schedule
    const getCurrentScheduleSeats = () => {
        if (!selectedSchedule) return trip.available_seats ?? 0

        const scheduleWithSeats = allSchedules.find(s => s.id === selectedSchedule.id)
        // ใช้ realTimeSeats เป็นหลัก และ fallback เป็น available_seats
        const realTimeSeats = scheduleWithSeats?.realTimeSeats
        const fallbackSeats = selectedSchedule.available_seats ?? 0

        // ถ้า realTimeSeats มีค่าและไม่เป็น null/undefined ให้ใช้ค่านั้น
        const finalSeats = (realTimeSeats !== null && realTimeSeats !== undefined) ? realTimeSeats : fallbackSeats

        return finalSeats
    }

    // OPTIMIZED: Use seller data from props instead of fetching per card
    const sellerStatus = sellerData?.status || null

    // Set first schedule as default when schedules are loaded
    useEffect(() => {
        if (!selectedSchedule && allSchedules.length > 0) {
            setSelectedSchedule(allSchedules[0])
        }
    }, [allSchedules, selectedSchedule])

    // OPTIMIZED: Memoize expensive calculations
    const commissionAmount = useMemo(() => {
        if (trip.commission_type === 'percentage') {
            return (trip.price_per_person * trip.commission_value) / 100
        }
        return trip.commission_value
    }, [trip.commission_type, trip.price_per_person, trip.commission_value])

    const formattedCommission = useMemo(() => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(commissionAmount)
    }, [commissionAmount])

    const formattedPrice = useMemo(() => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(trip.price_per_person)
    }, [trip.price_per_person])

    const formatDeadline = (schedule: Tables<'trip_schedules'> | null) => {
        if (!schedule) return 'ยังไม่กำหนด'

        const deadline = new Date(schedule.registration_deadline)
        return deadline.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatDateRange = (schedule: Tables<'trip_schedules'> | null) => {
        if (!schedule) return 'ยังไม่กำหนด'

        const departure = new Date(schedule.departure_date)
        const returnDate = new Date(schedule.return_date)

        const depDay = departure.getDate()
        const depMonth = departure.toLocaleDateString('th-TH', { month: 'short' })
        const retDay = returnDate.getDate()
        const retMonth = returnDate.toLocaleDateString('th-TH', { month: 'short' })

        return `${depDay} ${depMonth} - ${retDay} ${retMonth}`
    }

    const calculateDuration = (schedule: Tables<'trip_schedules'> | null) => {
        if (!schedule) return { days: 0, nights: 0 }

        const departure = new Date(schedule.departure_date)
        const returnDate = new Date(schedule.return_date)

        // Calculate difference in milliseconds
        const diffTime = returnDate.getTime() - departure.getTime()
        // Convert to days: return_date - departure_date + 1
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

        // Days = number of calendar days
        // Nights = days - 1 (nights spent away)
        const days = diffDays
        const nights = Math.max(0, diffDays - 1)

        return { days: Math.max(days, 1), nights: Math.max(nights, 0) }
    }

    return (
        <div className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 w-full max-w-sm mx-auto relative border border-gray-100 flex flex-col h-full">
            {/* Cover Image */}
            <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
                {trip.cover_image_url ? (
                    <TripImage
                        src={trip.cover_image_url}
                        alt={trip.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
                        {trip.countries?.flag_emoji || '🌍'}
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                    <SeatIndicator
                        availableSeats={getCurrentScheduleSeats()}
                        totalSeats={selectedSchedule?.available_seats || 0}
                        loading={schedulesLoading}
                    />
                    <CampaignBadge tripId={trip.id} />
                </div>

                {/* Partner Badge */}
                {trip.partners && (
                    <div className="absolute bottom-3 left-3 z-10">
                        <div className="flex items-center gap-2 bg-gray-800/10 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-md">
                            {trip.partners.logo_url ? (
                                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border">
                                    <Image
                                        src={trip.partners.logo_url}
                                        alt={trip.partners.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Building2 size={10} className="text-gray-500" />
                                </div>
                            )}
                            <span className="text-xs font-bold text-white truncate max-w-[120px] drop-shadow-sm">{trip.partners.name}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight min-h-[3rem]">
                    {trip.title}
                </h3>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Clock size={16} className="text-primary-blue" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-medium uppercase">ระยะเวลา</span>
                            <span className="text-xs font-semibold">
                                {(() => {
                                    const duration = calculateDuration(selectedSchedule)
                                    return `${duration.days} วัน ${duration.nights} คืน`
                                })()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <CalendarDays size={16} className="text-primary-blue" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-medium uppercase">ปิดรับสมัคร</span>
                            <span className="text-xs font-semibold">{formatDeadline(selectedSchedule)}</span>
                        </div>
                    </div>
                </div>

                {/* Schedule Selector */}
                <div className="mb-4 relative z-20">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-white text-left flex justify-between items-center hover:border-primary-blue/50 hover:shadow-sm transition-all group/btn"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="bg-blue-50 p-1.5 rounded-md text-primary-blue group-hover/btn:bg-primary-blue group-hover/btn:text-white transition-colors">
                                <CalendarDays size={16} />
                            </div>
                            <span className="font-medium text-gray-700 truncate">
                                {formatDateRange(selectedSchedule)}
                            </span>
                        </div>
                        {isDropdownOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>

                    {/* Dropdown */}
                    {isDropdownOpen && allSchedules.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {allSchedules.map((schedule) => {
                                const duration = calculateDuration(schedule)
                                const seatsToShow = (schedule.realTimeSeats !== null && schedule.realTimeSeats !== undefined)
                                    ? schedule.realTimeSeats
                                    : schedule.available_seats

                                return (
                                    <button
                                        key={schedule.id}
                                        onClick={() => {
                                            setSelectedSchedule(schedule)
                                            setIsDropdownOpen(false)
                                        }}
                                        className={`w-full p-3 text-left text-sm hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors ${selectedSchedule?.id === schedule.id ? 'bg-blue-50/50 text-primary-blue' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-semibold text-gray-800">
                                                    {formatDateRange(schedule)}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {duration.days} วัน {duration.nights} คืน
                                                </div>
                                            </div>
                                            <div className={`text-xs font-medium px-2 py-1 rounded-full ${seatsToShow > 5 ? 'bg-emerald-100 text-emerald-700' :
                                                seatsToShow > 0 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {seatsToShow > 0 ? `ว่าง ${seatsToShow}` : 'เต็ม'}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-auto space-y-4">
                    {/* Price & Commission */}
                    <div className="flex items-end justify-between border-t border-dashed border-gray-200 pt-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-medium mb-0.5">ราคาเริ่มต้น/ท่าน</span>
                            <span className="text-lg font-bold text-gray-900">{formattedPrice}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500 font-medium mb-0.5">คอมมิชชั่น</span>
                            <span className="text-xl font-extrabold text-primary-yellow drop-shadow-sm">
                                {formattedCommission}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    {viewType === 'seller' ? (
                        <button
                            onClick={() => {
                                if (sellerStatus !== 'approved') {
                                    toast.error('คุณต้องได้รับการอนุมัติจากผู้ดูแลระบบก่อนจึงจะสามารถดูข้อมูลทริปได้')
                                    return
                                }
                                if (trip.file_link) {
                                    window.open(trip.file_link, '_blank')
                                } else {
                                    toast.error('ไม่พบไฟล์ข้อมูลทริป')
                                }
                            }}
                            disabled={sellerStatus !== 'approved' || !trip.file_link}
                            className="w-full bg-primary-blue text-white px-4 py-3.5 rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            <Info size={18} />
                            <span>ดูรายละเอียดทริป</span>
                        </button>
                    ) : (
                        <button
                            disabled={true}
                            className="w-full bg-gray-100 text-gray-400 px-4 py-3.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Info size={18} />
                            <span>ดูทริป</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
})

export default TripCard
