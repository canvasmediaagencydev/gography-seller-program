'use client'

import { memo, useMemo } from 'react'
import dynamic from 'next/dynamic'
import TripImage from './TripImage'
import SeatIndicator from './ui/SeatIndicator'
import { TripCardProps } from '../types/trip'
import { LuCalendarDays } from "react-icons/lu"
import { BsInfoCircle } from "react-icons/bs"

// Lazy load heavy components
const TripScheduleDropdown = dynamic(() => import('./trips/TripScheduleDropdown'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-10 rounded-lg" />
})

// Optimized TripCard with memoization
const TripCardOptimized = memo(function TripCard({ 
  trip, 
  viewType = 'general', 
  currentSellerId,
  sellerData // Pass seller data from parent to avoid individual API calls
}: TripCardProps & { sellerData?: { referral_code: string; status: string } }) {
  
  // Memoize expensive calculations
  const { formattedPrice, commissionAmount, deadline } = useMemo(() => {
    const getCommissionAmount = () => {
      if (trip.commission_type === 'percentage') {
        return (trip.price_per_person * trip.commission_value) / 100
      }
      return trip.commission_value
    }

    const formatPrice = (amount: number) => {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }

    const formatDeadline = () => {
      if (!trip.next_schedule) return 'ยังไม่กำหนด'
      
      const deadline = new Date(trip.next_schedule.registration_deadline)
      return deadline.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }

    return {
      formattedPrice: formatPrice(trip.price_per_person),
      commissionAmount: formatPrice(getCommissionAmount()),
      deadline: formatDeadline()
    }
  }, [trip])

  const handleTripInfoClick = () => {
    if (sellerData?.status !== 'approved') {
      alert('คุณต้องได้รับการอนุมัติจากผู้ดูแลระบบก่อนจึงจะสามารถดูข้อมูลทริปได้')
      return
    }
    if (trip.file_link) {
      window.open(trip.file_link, '_blank')
    } else {
      alert('ไม่พบไฟล์ข้อมูลทริป')
    }
  }

  return (
    <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-sm mx-auto">
      {/* Cover Image with priority loading for above-the-fold images */}
      <div className="relative h-48 w-full">
        {trip.cover_image_url ? (
          <TripImage
            src={trip.cover_image_url}
            alt={trip.title}
            className="w-full h-full"
            priority={false} // Can be set to true for above-the-fold images
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
            {trip.countries?.flag_emoji || '🌍'}
          </div>
        )}
        
        <div className="absolute top-3 left-3 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
          <SeatIndicator 
            availableSeats={trip.available_seats ?? (trip.next_schedule?.available_seats || 0)}
            totalSeats={trip.next_schedule?.available_seats || trip.total_seats || 0}
            loading={false}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title with proper heading */}
        <h3 className="text-xl font-semibold text-gray-800 mb-3 h-14 flex items-start">
          <span className="line-clamp-2 leading-7">
            {trip.title}
          </span>
        </h3>

        {/* Deadline */}
        <div className="flex items-center text-gray-600 mb-3">
          <LuCalendarDays className="mr-2 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm">ปิดรับสมัคร: {deadline}</span>
        </div>

        {/* Travel Dates - Use dynamic import for complex dropdown */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">วันเดินทาง:</p>
          <TripScheduleDropdown trip={trip} />
        </div>

        {/* Commission */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <div>
            <span className="text-orange-600 text-2xl font-bold">
              คอมมิชชั่น {commissionAmount}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex">
          {viewType === 'seller' && (
            <button
              onClick={handleTripInfoClick}
              disabled={sellerData?.status !== 'approved' || !trip.file_link}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`ดูข้อมูลทริป ${trip.title}`}
            >
              <BsInfoCircle className="text-lg" aria-hidden="true" />
              <span>ดูข้อมูลทริป</span>
            </button>
          )}
          
          {viewType !== 'seller' && (
            <button 
              disabled={true}
              className="w-full bg-gray-400 text-gray-200 px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              aria-label="ดูทริป (ไม่พร้อมใช้งาน)"
            >
              <BsInfoCircle className="text-lg" aria-hidden="true" />
              <span>ดูทริป</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
})

export default TripCardOptimized