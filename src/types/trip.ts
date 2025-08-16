import { Tables } from '../../database.types'

export interface TripWithRelations extends Tables<'trips'> {
    countries?: Tables<'countries'> | null
    next_schedule?: Tables<'trip_schedules'> | null
    seller_bookings_count?: number
    available_seats?: number | null
}

export interface TripCardProps {
    trip: TripWithRelations
    viewType?: 'seller' | 'general'
    currentSellerId?: string
}

export type ViewType = 'seller' | 'general'
