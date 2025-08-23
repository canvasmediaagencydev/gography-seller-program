import { Tables } from '../../../../../../database.types'

interface BookingWithDetails extends Tables<'bookings'> {
  customers?: {
    full_name: string
    email: string
    phone: string | null
    id_card: string | null
    passport_number: string | null
  }
  trip_schedules?: {
    departure_date: string
    return_date: string
    registration_deadline: string
    available_seats: number
    trips?: {
      title: string
      price_per_person: number
      commission_type: string | null
      commission_value: number
      countries?: {
        name: string
        flag_emoji: string | null
      }
    }
  }
  seller?: {
    id: string
    full_name: string | null
    email: string | null
    referral_code: string | null
  }
}

interface BookingStatsProps {
  bookings: BookingWithDetails[]
}

export default function BookingStats({ bookings }: BookingStatsProps) {
  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const approvedBookings = bookings.filter(b => b.status === 'approved').length
  const rejectedBookings = bookings.filter(b => b.status === 'rejected').length
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length
  const inProgressBookings = bookings.filter(b => b.status === 'inprogress').length

  const totalRevenue = bookings
    .filter(b => b.status === 'approved')
    .reduce((sum, b) => sum + b.total_amount, 0)

  const totalCommission = bookings
    .filter(b => b.status === 'approved')
    .reduce((sum, b) => sum + b.commission_amount, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const stats = [
    {
      title: 'การจองทั้งหมด',
      value: totalBookings.toLocaleString(),
      icon: '📊',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500'
    },
    {
      title: 'รออนุมัติ',
      value: pendingBookings.toLocaleString(),
      icon: '⏳',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      iconColor: 'text-yellow-500'
    },
    {
      title: 'อนุมัติแล้ว',
      value: approvedBookings.toLocaleString(),
      icon: '✅',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconColor: 'text-green-500'
    },
    {
      title: 'กำลังดำเนินการ',
      value: inProgressBookings.toLocaleString(),
      icon: '🔄',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      iconColor: 'text-purple-500'
    },
    {
      title: 'ยอดขายรวม',
      value: formatCurrency(totalRevenue),
      icon: '💰',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      iconColor: 'text-emerald-500'
    },
    {
      title: 'คอมมิชชั่นรวม',
      value: formatCurrency(totalCommission),
      icon: '🎯',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      iconColor: 'text-orange-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className={`${stat.bgColor} rounded-xl p-4 border border-gray-100`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
            <div className={`text-2xl ${stat.iconColor}`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
