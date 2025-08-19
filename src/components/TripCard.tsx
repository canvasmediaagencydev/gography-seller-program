'use client'

import { useState, useEffect } from 'react'
import TripImage from './TripImage'
import { useTripData } from '../hooks/useTripData'
import { TripCardProps } from '../types/trip'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '../../database.types'
import { LuCalendarDays } from "react-icons/lu";

export default function TripCard({ trip, viewType = 'general', currentSellerId }: TripCardProps) {
    const [selectedSchedule, setSelectedSchedule] = useState<Tables<'trip_schedules'> | null>(trip.next_schedule || null)
    const [allSchedules, setAllSchedules] = useState<Tables<'trip_schedules'>[]>([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const { duration, commission, dateRange, deadlineInfo, availableSeats, mySales } = useTripData(trip)

    const supabase = createClient()

    // Fetch all available schedules for this trip
    useEffect(() => {
        const fetchSchedules = async () => {
            const { data: schedules } = await supabase
                .from('trip_schedules')
                .select('*')
                .eq('trip_id', trip.id)
                .eq('is_active', true)
                .gt('departure_date', new Date().toISOString())
                .order('departure_date', { ascending: true })

            if (schedules) {
                setAllSchedules(schedules)
                // Set first schedule as default if no schedule is selected
                if (!selectedSchedule && schedules.length > 0) {
                    setSelectedSchedule(schedules[0])
                }
            }
        }

        fetchSchedules()
    }, [trip.id])

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
        if (!schedule) return 'TBD'
        
        const deadline = new Date(schedule.registration_deadline)
        return deadline.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatDateRange = (schedule: Tables<'trip_schedules'> | null) => {
        if (!schedule) return 'TBD'
        
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
                <div className="absolute top-3 left-3 bg-black/40 text-white px-2 py-1 rounded-lg text-lg font-semibold backdrop-blur-sm">
                    {selectedSchedule?.available_seats || trip.total_seats} ที่นั่งเหลือ
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-800 mb-3 h-14 flex items-start">
                    <span className="line-clamp-2 leading-7">
                        {trip.title}
                    </span>
                </h3>

                {/* Deadline */}
                <div className="flex items-center text-gray-600 mb-3">
                   <LuCalendarDays className='mr-2' />
                    <span className="text-sm">Deadline: {formatDeadline(selectedSchedule)}</span>
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
                                        {formatDateRange(schedule)} ({schedule.available_seats} ที่นั่งเหลือ)
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

                {/* View Trip Button */}
                <div className="w-3/4 md:w-full md:px-5 flex items-center justify-center mx-auto">
                    <button 
                        disabled={!trip.geography_link}
                        className="bg-orange-600 w-full hover:bg-orange-700 text-white font-semibold py-2 px-2 rounded-full duration-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        onClick={() => {
                            if (trip.geography_link) {
                                window.open(trip.geography_link, '_blank')
                            }
                        }}
                    >
                        ดูทริป
                    </button>
                </div>
            </div>
        </div>
    )
}
