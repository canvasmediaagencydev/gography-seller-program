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
        if (!selectedSchedule) return trip.total_seats
        
        const scheduleWithSeats = allSchedules.find(s => s.id === selectedSchedule.id)
        return scheduleWithSeats?.realTimeSeats ?? selectedSchedule.available_seats
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

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-sm mx-auto">
            {/* Cover Image */}
            <div className="relative h-48 w-full">
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
                        totalSeats={selectedSchedule?.available_seats || trip.total_seats}
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
                                {formatDateRange(selectedSchedule)} ({trip.duration_days} วัน {trip.duration_nights} คืน)
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
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                {allSchedules.map((schedule) => (
                                    <button
                                        key={schedule.id}
                                        onClick={() => {
                                            setSelectedSchedule(schedule)
                                            setIsDropdownOpen(false)
                                        }}
                                        className={`w-full p-2 text-left text-sm hover:bg-gray-50 ${
                                            selectedSchedule?.id === schedule.id ? 'bg-orange-50 text-orange-600' : ''
                                        }`}
                                    >
                                        {formatDateRange(schedule)} ({schedule.realTimeSeats ?? schedule.available_seats} ที่นั่งเหลือ)
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Commission */}
                <div className="flex items-center justify-between mb-4 mt-2">
                    <div>
                        <span className="text-orange-600 text-2xl font-bold">
                            คอมมิชชั่น {formatPrice(getCommissionAmount())}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {/* Share Booking Link Button (only for sellers) */}
                    {viewType === 'seller' && (
                        <>
                            <button
                                onClick={() => {
                                    if (sellerStatus !== 'approved') {
                                        alert('คุณต้องได้รับการอนุมัติจากผู้ดูแลระบบก่อนจึงจะสามารถแชร์ลิงก์ทริปได้')
                                        return
                                    }
                                    // Use selectedSchedule or first available schedule
                                    const scheduleToUse = selectedSchedule || allSchedules[0] || trip.next_schedule
                                    if (scheduleToUse) {
                                        const bookingUrl = `${window.location.origin}/book/${trip.id}/${scheduleToUse.id}?ref=${sellerReferralCode || 'seller'}`
                                        navigator.clipboard.writeText(bookingUrl)
                                        alert('คัดลอก Link สมัครทริปแล้ว!')
                                    } else {
                                        alert('ไม่พบตารางเวลาสำหรับทริปนี้')
                                    }
                                }}
                                disabled={sellerStatus !== 'approved' || (!selectedSchedule && !allSchedules[0] && !trip.next_schedule)}
                                className="flex-1 bg-gray-800 text-white px-3 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ImLink className='text-lg' />
                                <span>แชร์ลิงก์</span>
                            </button>
                            
                            <div className="relative group">
                                <button
                                    onClick={() => {
                                        if (trip.geography_link) {
                                            window.open(trip.geography_link, '_blank')
                                        }
                                    }}
                                    disabled={!trip.geography_link}
                                    className="bg-gray-100 text-gray-600 px-3 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <BsInfoCircle className='text-lg' />
                                </button>
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                                    ดูข้อมูลทริป
                                </div>
                            </div>
                        </>
                    )}
                    
                    {/* View Trip Button (for general view) */}
                    {viewType !== 'seller' && (
                        <button 
                            disabled={!trip.geography_link}
                            onClick={() => {
                                if (trip.geography_link) {
                                    window.open(trip.geography_link, '_blank')
                                }
                            }}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
