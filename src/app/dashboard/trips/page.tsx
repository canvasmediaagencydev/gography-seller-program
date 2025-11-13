'use client'

import { useState, useEffect } from 'react'
import { TripWithRelations } from '../../../types/trip'
import { TripsHeader } from '../../../components/trips/TripsHeader'
import { TripTabs } from '../../../components/trips/TripTabs'
import { TripsGrid } from '../../../components/trips/TripsGrid'
import { LoadingSystem, ErrorSystem } from '@/components/ui'
import { TripsEmpty } from '../../../components/trips/TripsEmpty'
import { ViewMode } from '../../../components/ui/ViewToggle'
import { Pagination } from '../../../components/ui/Pagination'
import { TabType } from '../../../hooks/useTripFilters'
import VerificationModal from '@/components/VerificationModal'
import { createClient } from '@/lib/supabase/client'
import { useTrips, tripKeys } from '@/hooks/use-trips'
import { useQueryClient } from '@tanstack/react-query'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  commission_goal: number | null
  referral_code: string | null
}

export default function TripsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedPartners, setSelectedPartners] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  const pageSize = 6
  const queryClient = useQueryClient()

  // Use TanStack Query for trips data
  const { data, isLoading, error, isFetching } = useTrips({
    page: currentPage,
    pageSize,
    filter: activeTab,
    countries: selectedCountries,
    partners: selectedPartners,
  })

  const trips = data?.trips || []
  const totalCount = data?.totalCount || 0
  const userId = data?.userId || null
  const userRole = data?.userRole || null
  const availableCountries = data?.availableCountries || []
  const availablePartners = data?.availablePartners || []

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleCountriesChange = (countries: string[]) => {
    setSelectedCountries(countries)
    setCurrentPage(1)
  }

  const handlePartnersChange = (partners: string[]) => {
    setSelectedPartners(partners)
    setCurrentPage(1)
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  // OPTIMIZED: Prefetch next page for instant navigation
  useEffect(() => {
    const totalPages = Math.ceil(totalCount / pageSize)

    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: tripKeys.list({
          page: currentPage + 1,
          pageSize,
          filter: activeTab,
          countries: selectedCountries,
          partners: selectedPartners,
        }),
        queryFn: async () => {
          const params = new URLSearchParams({
            page: (currentPage + 1).toString(),
            pageSize: pageSize.toString(),
            filter: activeTab,
          })

          if (selectedCountries.length > 0) {
            params.append('countries', selectedCountries.join(','))
          }
          if (selectedPartners.length > 0) {
            params.append('partners', selectedPartners.join(','))
          }

          const response = await fetch(`/api/trips?${params}`)
          if (!response.ok) throw new Error('Failed to fetch trips')
          return response.json()
        },
      })
    }
  }, [currentPage, totalCount, pageSize, activeTab, selectedCountries, selectedPartners, queryClient])

  const loadUserProfile = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserProfile(profile)
      // Show modal for pending sellers
      if (profile.status === 'pending' || profile.status === 'suspended') {
        setShowVerificationModal(true)
      }
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const viewType = userRole === 'seller' ? 'seller' : 'general'
  const showTabs = userRole === 'seller'

  // Initial loading - show full page loading
  if (isLoading && !userId) {
    return <LoadingSystem variant="grid" />
  }

  if (error) {
    return <ErrorSystem variant="fullscreen" message={error instanceof Error ? error.message : 'An error occurred'} />
  }

  return (
    <div className="space-y-6 md:px-0 px-4 md:py-0 py-4 min-h-screen mobile-page-content">
      <TripsHeader
        totalTrips={totalCount}
        selectedCountries={selectedCountries}
        onCountriesChange={handleCountriesChange}
        availableCountries={availableCountries}
        selectedPartners={selectedPartners}
        onPartnersChange={handlePartnersChange}
        availablePartners={availablePartners}
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

      {/* Grid Area - Shows skeleton when isFetching is true */}
      <div className="max-w-[1440px] md:px-10 mx-auto">
        {isFetching && currentPage !== 1 ? (
          <LoadingSystem variant="grid" />
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
        <div className="flex justify-center mt-8 mb-8 md:mb-0">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={6}
            totalItems={totalCount}
          />
        </div>
      )}

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        userProfile={userProfile}
      />
    </div>
  )
}
