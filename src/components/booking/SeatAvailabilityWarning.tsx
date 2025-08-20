import { useScheduleSeats } from '../../hooks/useScheduleSeats'

interface SeatAvailabilityWarningProps {
  scheduleId: string
  totalSeats: number
  customerCount: number
}

export default function SeatAvailabilityWarning({ 
  scheduleId, 
  totalSeats, 
  customerCount 
}: SeatAvailabilityWarningProps) {
  const { availableSeats, loading } = useScheduleSeats(scheduleId)
  
  if (loading || availableSeats === null) return null
  
  const willExceedCapacity = customerCount > availableSeats
  const isAlmostFull = availableSeats <= 5 && availableSeats > 0
  
  if (willExceedCapacity) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-red-500">⚠️</span>
          <div>
            <p className="text-red-800 font-medium">ที่นั่งไม่เพียงพอ</p>
            <p className="text-red-600 text-sm">
              ท่านเลือกผู้เดินทาง {customerCount} คน แต่เหลือที่นั่งเพียง {availableSeats} ที่นั่ง
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (isAlmostFull) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-500">⚡</span>
          <div>
            <p className="text-yellow-800 font-medium">ที่นั่งใกล้เต็ม!</p>
            <p className="text-yellow-600 text-sm">
              เหลือที่นั่งเพียง {availableSeats} ที่นั่ง รีบจองก่อนที่จะเต็ม
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return null
}
