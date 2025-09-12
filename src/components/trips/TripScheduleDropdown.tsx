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
    const days = Math.max(diffDays, 1)
    const nights = Math.max(diffDays - 1, 0)
    
    return { days, nights }
  }

  // For now, just show the next schedule without dropdown complexity
  // This can be enhanced later with full schedule management
  const duration = calculateDuration(selectedSchedule)
  
  return (
    <div className="relative">
      <div className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white">
        <span>
          {formatDateRange(selectedSchedule)} ({duration.days} วัน {duration.nights} คืน)
        </span>
      </div>
    </div>
  )
}