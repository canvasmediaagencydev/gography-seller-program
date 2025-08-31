'use client'

import { useState, useEffect } from 'react'
import { Tables } from '../../../database.types'

interface TripScheduleDropdownProps {
  trip: any
}

export default function TripScheduleDropdown({ trip }: TripScheduleDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Tables<'trip_schedules'> | null>(trip.next_schedule || null)

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

  // For now, just show the next schedule without dropdown complexity
  // This can be enhanced later with full schedule management
  return (
    <div className="relative">
      <div className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white">
        <span>
          {formatDateRange(selectedSchedule)} ({trip.duration_days} วัน {trip.duration_nights} คืน)
        </span>
      </div>
    </div>
  )
}