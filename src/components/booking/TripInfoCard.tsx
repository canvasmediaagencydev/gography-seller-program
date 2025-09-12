import { Tables } from '../../../database.types'
import { formatDate, formatPrice } from '../../utils/bookingUtils'
import { useScheduleSeats } from '../../hooks/useScheduleSeats'
import SeatIndicator from '../ui/SeatIndicator'

interface TripWithRelations extends Tables<'trips'> {
    countries?: {
        name: string
        flag_emoji: string | null
    } | null
}

interface SellerData {
    id: string
    full_name: string | null
    referral_code: string | null
}

interface TripInfoCardProps {
    trip: TripWithRelations
    schedule: Tables<'trip_schedules'>
    seller?: SellerData | null
}

export default function TripInfoCard({ trip, schedule, seller }: TripInfoCardProps) {
    // Get real-time available seats
    const { availableSeats, loading: seatsLoading } = useScheduleSeats(schedule.id)
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{trip.title}</h1>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {trip.countries && (
                                <div className="flex items-center space-x-1">
                                    <span>{trip.countries.flag_emoji}</span>
                                    <span>{trip.countries.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">{formatPrice(trip.price_per_person)}</p>
                        <p className="text-lg text-gray-500">ต่อคน</p>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg text-gray-500 mb-1">วันเดินทาง</p>
                        <p className="text-lg">{formatDate(schedule.departure_date)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg text-gray-500 mb-1">ระยะเวลา</p>
                        <p className="text-lg">{trip.duration_days}วัน {trip.duration_nights}คืน</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg text-gray-500 mb-1">ปิดรับสมัคร</p>
                        <p className="text-lg">{formatDate(schedule.registration_deadline)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg text-gray-500 mb-1">ที่นั่งเหลือ</p>
                        <div className="flex justify-center">
                            <SeatIndicator 
                                availableSeats={availableSeats ?? schedule.available_seats}
                                totalSeats={schedule.available_seats}
                                loading={seatsLoading}
                                textColor="text-green-600"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Seller Info */}
                {seller && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">S</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-blue-900">
                                        ผู้แนะนำ: {seller.full_name || 'ไม่ระบุชื่อ'}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        ID: {seller.id.slice(-5)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-blue-600">Ref Code</p>
                                <p className="text-sm font-medium text-blue-900">{seller.referral_code}</p>
                            </div>
                        </div>
                    </div>
                )}
                
            </div>
        </div>
    )
}