interface SeatIndicatorProps {
  availableSeats: number
  totalSeats?: number
  loading?: boolean
  className?: string
  textColor?: string
}

export default function SeatIndicator({ 
  availableSeats, 
  totalSeats,
  loading = false,
  className = '',
  textColor = 'text-white'
}: SeatIndicatorProps) {
  const getIndicatorColor = () => {
    if (loading) return 'bg-gray-500'
    
    const percentage = totalSeats ? (availableSeats / totalSeats) * 100 : 50
    
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 20) return 'bg-yellow-500'
    if (percentage > 0) return 'bg-red-500'
    return 'bg-gray-500'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getIndicatorColor()} ${loading ? 'animate-pulse' : ''}`} />
      <span className={`text-lg font-semibold ${textColor}`}>
        {loading ? '...' : availableSeats} ที่นั่งเหลือ
      </span>
    </div>
  )
}
