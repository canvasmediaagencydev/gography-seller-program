import { Tables } from '../../../database.types'
import { formatDate, formatPrice } from '../../utils/bookingUtils'

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
}

export default function TripInfoCard({ trip, schedule }: TripInfoCardProps) {
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
                        <p className="text-lg text-green-600">{schedule.available_seats} ที่นั่ง</p>
                    </div>
                </div>
                
            </div>
        </div>
    )
}