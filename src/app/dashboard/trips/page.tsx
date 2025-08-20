'use client'

import { useState, useEffect } from 'react'
import { TripWithRelations } from '../../../types/trip'
import { TripsHeader } from '../../../components/trips/TripsHeader'
import { TripTabs } from '../../../components/trips/TripTabs'
import { TripsGrid } from '../../../components/trips/TripsGrid'
import { TripsLoading } from '../../../components/trips/TripsLoading'
import { TripsError } from '../../../components/trips/TripsError'
import { TripsEmpty } from '../../../components/trips/TripsEmpty'
import { ViewMode } from '../../../components/ui/ViewToggle'
import { Pagination } from '../../../components/ui/Pagination'
import { TabType } from '../../../hooks/useTripFilters'

export default function TripsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  
  // Server-side pagination state
  const [trips, setTrips] = useState<TripWithRelations[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const pageSize = 6

  const fetchTrips = async (page: number = currentPage, filter: string = activeTab) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filter: filter
      })

      const response = await fetch(`/api/trips?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch trips')
      }

      const data = await response.json()
      
      setTrips(data.trips)
      setTotalCount(data.totalCount)
      setUserId(data.userId)
      setUserRole(data.userRole)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
    fetchTrips(1, tab)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchTrips(page, activeTab)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Mock trip counts for TripTabs (you might want to fetch these separately for better UX)
  const tripCounts = {
    all: totalCount,
    sold: 0, // These would need separate queries or be calculated differently
    not_sold: 0,
    full: 0
  }

  const viewType = userRole === 'seller' ? 'seller' : 'general'
  const showTabs = userRole === 'seller'

  if (loading) {
    return <TripsLoading />
  }

  if (error) {
    return <TripsError message={error} />
  }

  return (
    <div className="space-y-6">
      <TripsHeader totalTrips={totalCount} />
      
      {showTabs && (
        <TripTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showTabs={showTabs}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {trips && trips.length > 0 ? (
        <>
          <TripsGrid 
            trips={trips}
            viewMode={viewMode}
            userId={userId}
            viewType={viewType}
          />
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={6}
                totalItems={totalCount}
              />
            </div>
          )}
        </>
      ) : (
        <TripsEmpty />
      )}
    </div>
  )
}
