import TripCard from '../TripCard'
import { TripsList } from './TripsList'
import { TripWithRelations, ViewType } from '../../types/trip'
import { ViewMode } from '../ui/ViewToggle'

interface TripsGridProps {
    trips: TripWithRelations[]
    viewType: ViewType
    userId: string | null
    viewMode: ViewMode
}

export function TripsGrid({ trips, viewType, userId, viewMode }: TripsGridProps) {
    if (viewMode === 'list') {
        return (
            <TripsList 
                trips={trips}
                viewType={viewType}
                userId={userId}
            />
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
