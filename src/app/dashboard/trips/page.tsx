'use client'

import { useState, useEffect } from 'react'
import { TripWithRelations } from '../../../types/trip'
import { TripsHeader } from '../../../components/trips/TripsHeader'
import { TripTabs } from '../../../components/trips/TripTabs'
import { TripsGrid } from '../../../components/trips/TripsGrid'
import { TripsLoading } from '../../../components/trips/TripsLoading'
import { TripsGridLoading } from '../../../components/trips/TripsGridLoading'
import { TripsError } from '../../../components/trips/TripsError'
import { TripsEmpty } from '../../../components/trips/TripsEmpty'
import { ViewMode } from '../../../components/ui/ViewToggle'
import { Pagination } from '../../../components/ui/Pagination'
import { TabType } from '../../../hooks/useTripFilters'

export default function TripsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  
  // Server-side pagination state
  const [trips, setTrips] = useState<TripWithRelations[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [gridLoading, setGridLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [availableCountries, setAvailableCountries] = useState<any[]>([])

  const pageSize = 6

  const fetchTrips = async (page: number = currentPage, filter: string = activeTab, countries: string[] = selectedCountries, isGridUpdate = false) => {
    try {
      if (isGridUpdate) {
        setGridLoading(true)
      } else {
        setLoading(true)
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filter: filter
      })

      // Add countries filter if any selected
      if (countries.length > 0) {
        params.append('countries', countries.join(','))
      }

      const response = await fetch(`/api/trips?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch trips')
      }

      const data = await response.json()
      
      setTrips(data.trips)
      setTotalCount(data.totalCount)
      setUserId(data.userId)
      setUserRole(data.userRole)
      
      // Set available countries from the first load
      if (data.availableCountries && data.availableCountries.length > 0) {
        setAvailableCountries(data.availableCountries)
      }
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      if (isGridUpdate) {
        setGridLoading(false)
      } else {
        setLoading(false)
      }
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
    fetchTrips(1, tab, selectedCountries, true) // Grid update only
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchTrips(page, activeTab, selectedCountries, true) // Grid update only
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCountriesChange = (countries: string[]) => {
    setSelectedCountries(countries)
    setCurrentPage(1)
    fetchTrips(1, activeTab, countries, true) // Grid update only
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  const totalPages = Math.ceil(totalCount / pageSize)

  const viewType = userRole === 'seller' ? 'seller' : 'general'
  const showTabs = userRole === 'seller'

  // Initial loading - show full page loading
  if (loading && !userId) {
    return <TripsLoading />
  }

  if (error) {
    return <TripsError message={error} />
  }

  return (
    <div className="space-y-6">
      <TripsHeader 
        totalTrips={totalCount}
        selectedCountries={selectedCountries}
        onCountriesChange={handleCountriesChange}
        availableCountries={availableCountries}
      />
      
      {showTabs && (
        <TripTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showTabs={showTabs}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {/* Grid Area - Shows skeleton when gridLoading is true */}
      <div className="min-h-[400px]">
        {gridLoading ? (
          <TripsGridLoading />
        ) : trips && trips.length > 0 ? (
          <TripsGrid 
            trips={trips}
            viewMode={viewMode}
            userId={userId}
            viewType={viewType}
          />
        ) : (
          <TripsEmpty />
        )}
      </div>
          
      {/* Pagination - Always visible when there are multiple pages */}
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
    </div>
  )
}
