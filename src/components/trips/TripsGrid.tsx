import TripCard from '../TripCard'
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
            <div className="space-y-4">
                {trips.map((trip) => (
                    <div key={trip.id} className="w-full">
                        <TripCard
                            trip={trip}
                            viewType={viewType}
                            currentSellerId={userId || undefined}
                        />
                    </div>
                ))}
            </div>
        )
    }

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
