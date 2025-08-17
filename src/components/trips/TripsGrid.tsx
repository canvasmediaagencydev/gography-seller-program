import TripCard from '../TripCard'
import { TripWithRelations, ViewType } from '../../types/trip'

interface TripsGridProps {
    trips: TripWithRelations[]
    viewType: ViewType
    userId: string | null
}

export function TripsGrid({ trips, viewType, userId }: TripsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
                <TripCard
                    key={trip.id}
                    trip={trip}
                    viewType={viewType}
                    currentSellerId={userId || undefined}
                />
            ))}
        </div>
    )
}
