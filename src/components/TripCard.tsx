'use client'

import { useState, useEffect } from 'react'
import TripImage from './TripImage'
import SeatIndicator from './ui/SeatIndicator'
import { useTripData } from '../hooks/useTripData'
import { useTripSchedules } from '../hooks/useTripSchedules'
import { TripCardProps } from '../types/trip'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '../../database.types'
import { LuCalendarDays } from "react-icons/lu";
import { ImLink } from "react-icons/im";
import { BsInfoCircle } from "react-icons/bs";
import { toast } from 'sonner';

export default function TripCard({ trip, viewType = 'general', currentSellerId }: TripCardProps) {
    const [selectedSchedule, setSelectedSchedule] = useState<Tables<'trip_schedules'> | null>(trip.next_schedule || null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [sellerReferralCode, setSellerReferralCode] = useState<string | null>(null)
    const [sellerStatus, setSellerStatus] = useState<string | null>(null)
    const { duration, commission, dateRange, deadlineInfo, availableSeats, mySales } = useTripData(trip)
    
    // Get real-time schedules with available seats
    const { schedules: allSchedules, loading: schedulesLoading } = useTripSchedules(trip.id)

    const supabase = createClient()

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

    // Fetch seller referral code and status
    useEffect(() => {
        if (currentSellerId) {
            const fetchSellerData = async () => {
                const { data } = await supabase
                    .from('user_profiles')
                    .select('referral_code, status')
                    .eq('id', currentSellerId)
                    .single()
                
                setSellerReferralCode(data?.referral_code || null)
                setSellerStatus(data?.status || null)
            }
            fetchSellerData()
        }
    }, [currentSellerId])

    // Set first schedule as default when schedules are loaded
    useEffect(() => {
        if (!selectedSchedule && allSchedules.length > 0) {
            setSelectedSchedule(allSchedules[0])
        }
    }, [allSchedules, selectedSchedule])

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const getCommissionAmount = () => {
        if (trip.commission_type === 'percentage') {
            return (trip.price_per_person * trip.commission_value) / 100
        }
        return trip.commission_value
    }

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
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-sm mx-auto relative">
            {/* Cover Image */}
            <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
                {trip.cover_image_url ? (
                    <TripImage
                        src={trip.cover_image_url}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
                        {trip.countries?.flag_emoji || '🌍'}
                    </div>
                )}
                <div className="absolute top-3 left-3 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                    <SeatIndicator 
                        availableSeats={getCurrentScheduleSeats()}
                        totalSeats={selectedSchedule?.available_seats || 0}
                        loading={schedulesLoading}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Debug info - แสดงข้อมูลสำหรับ debug */}
                {/* {process.env.NODE_ENV === 'development' && (
                    <div className="mb-2 p-2 bg-yellow-100 text-xs rounded">
                        <div>trip.next_schedule: {trip.next_schedule ? 'มี' : 'ไม่มี'}</div>
                        <div>selectedSchedule: {selectedSchedule ? 'มี' : 'ไม่มี'}</div>
                        <div>allSchedules.length: {allSchedules.length}</div>
                        {selectedSchedule && (
                            <div>departure: {selectedSchedule.departure_date}</div>
                        )}
                    </div>
                )} */}

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-800 mb-3 h-14 flex items-start">
                    <span className="line-clamp-2 leading-7">
                        {trip.title}
                    </span>
                </h3>
                {/* Deadline */}
                <div className="flex items-center text-gray-600 mb-3">
                   <LuCalendarDays className='mr-2' />
                    <span className="text-sm">ปิดรับสมัคร: {formatDeadline(selectedSchedule)}</span>
                </div>

                {/* Travel Dates Selection */}
                <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">วันเดินทาง:</p>
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-left flex justify-between items-center hover:border-gray-400 transition-colors"
                        >
                            <span>
                                {(() => {
                                    const duration = calculateDuration(selectedSchedule)
                                    return `${formatDateRange(selectedSchedule)} (${duration.days} วัน ${duration.nights} คืน)`
                                })()}
                            </span>
                            <svg 
                                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown */}
                        {isDropdownOpen && allSchedules.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                {allSchedules.map((schedule) => {
                                    const duration = calculateDuration(schedule)
                                    // ใช้ realTimeSeats ถ้าพร้อมใช้งาน ไม่เช่นนั้นใช้ available_seats
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
                                            className={`w-full p-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                                selectedSchedule?.id === schedule.id ? 'bg-primary-yellow-light text-primary-yellow' : ''
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">
                                                        {formatDateRange(schedule)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {duration.days} วัน {duration.nights} คืน
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-emerald-600">
                                                        {seatsToShow} ที่นั่งเหลือ
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Commission */}
                <div className="flex items-center justify-between mb-4 mt-2">
                    <div>
                        <span className="text-primary-yellow text-2xl font-bold">
                            คอมมิชชั่น {formatPrice(getCommissionAmount())}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex">
                    {/* Trip Info Button (for sellers) */}
                    {viewType === 'seller' && (
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
                            className="w-full bg-primary-blue text-white px-4 py-3 rounded-lg hover:bg-primary-blue transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <BsInfoCircle className="text-lg" />
                            <span>ดูข้อมูลทริป</span>
                        </button>
                    )}
                    
                    {/* View Trip Button (for general view) */}
                    {viewType !== 'seller' && (
                        <button 
                            disabled={true}
                            className="w-full bg-gray-400 text-gray-200 px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                            <BsInfoCircle className="text-lg" />
                            <span>ดูทริป</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
