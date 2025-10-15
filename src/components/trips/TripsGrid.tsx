import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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

interface SellerData {
    referral_code: string | null
    status: string | null
}

export function TripsGrid({ trips, viewType, userId, viewMode }: TripsGridProps) {
    const [sellerData, setSellerData] = useState<SellerData | null>(null)
    const [realtimeVersion, setRealtimeVersion] = useState(0)
    const supabase = createClient()

    // OPTIMIZED: Fetch seller data once for all cards instead of per card
    useEffect(() => {
        const fetchSellerData = async () => {
            if (!userId) return

            const { data } = await supabase
                .from('user_profiles')
                .select('referral_code, status')
                .eq('id', userId)
                .single()

            setSellerData(data || null)
        }

        fetchSellerData()
    }, [userId])

    // OPTIMIZED: Single real-time subscription for all trips instead of one per card
    useEffect(() => {
        if (!trips || trips.length === 0) return

        // Create a single subscription for all bookings related to these trips
        const channel = supabase
            .channel('trips-grid-bookings')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings'
                },
                () => {
                    // Trigger re-fetch for all schedules when any booking changes
                    // This will cause all useTripSchedules hooks to refetch their data
                    setRealtimeVersion(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [trips])

    if (viewMode === 'list') {
        return (
            <TripsList
                trips={trips}
                viewType={viewType}
                userId={userId}
                sellerData={sellerData}
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
                    sellerData={sellerData}
                    realtimeVersion={realtimeVersion}
                />
            ))}
        </div>
    )
}
