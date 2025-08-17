'use client'

import { useState } from 'react'
import { useTripsCollection } from '../../../hooks/useTripsCollection'
import { useTripFilters, TabType } from '../../../hooks/useTripFilters'
import { TripsHeader } from '../../../components/trips/TripsHeader'
import { TripTabs } from '../../../components/trips/TripTabs'
import { TripsGrid } from '../../../components/trips/TripsGrid'
import { TripsLoading } from '../../../components/trips/TripsLoading'
import { TripsError } from '../../../components/trips/TripsError'
import { TripsEmpty } from '../../../components/trips/TripsEmpty'

export default function TripsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const { trips, loading, error, userId, userRole } = useTripsCollection()
  const { filteredTrips, tripCounts } = useTripFilters(trips, userRole, activeTab)

  const viewType = userRole === 'seller' ? 'seller' : 'general'
  const showTabs = userRole === 'seller'

  if (loading) {
    return <TripsLoading />
  }

  if (error) {
    return <TripsError message={error} />
  }

  return (
    <div className="p-6">
      <TripsHeader totalTrips={trips.length} />
      
      <TripTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showTabs={showTabs}
      />

      {filteredTrips && filteredTrips.length > 0 ? (
        <TripsGrid 
          trips={filteredTrips}
          viewType={viewType}
          userId={userId}
        />
      ) : (
        <TripsEmpty />
      )}
    </div>
  )
}
