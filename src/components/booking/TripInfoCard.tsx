import { Tables } from '../../../database.types'
import TripImage from '../TripImage'
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
    seller?: SellerData | null
}

export default function TripInfoCard({ trip, schedule, seller }: TripInfoCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="md:flex">
                <div className="md:w-1/3">
                    {trip.cover_image_url ? (
                        <TripImage
                            src={trip.cover_image_url}
                            alt={trip.title}
                            className="w-full h-64 md:h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-64 md:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
                            {trip.countries?.flag_emoji || '🌍'}
                        </div>
                    )}
                </div>
                <div className="md:w-2/3 p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">{trip.title}</h1>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-sm text-gray-600">วันเดินทาง</p>
                            <p className="font-semibold">
                                {formatDate(schedule.departure_date)} - {formatDate(schedule.return_date)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">ระยะเวลา</p>
                            <p className="font-semibold">{trip.duration_days} วัน {trip.duration_nights} คืน</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">ปิดรับสมัคร</p>
                            <p className="font-semibold text-red-600">{formatDate(schedule.registration_deadline)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">ที่นั่งเหลือ</p>
                            <p className="font-semibold text-green-600">{schedule.available_seats} ที่นั่ง</p>
                        </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">ราคาต่อคน</p>
                        <p className="text-3xl font-bold text-orange-600">{formatPrice(trip.price_per_person)}</p>
                    </div>

                    {seller && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">ผู้แนะนำ</p>
                            <p className="font-semibold text-blue-600">{seller.full_name}</p>
                            <p className="text-sm text-blue-500">รหัสผู้แนะนำ: {seller.referral_code}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
