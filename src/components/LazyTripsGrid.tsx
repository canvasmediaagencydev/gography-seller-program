'use client'

import { memo, useMemo, useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { TripWithRelations, ViewType } from '../types/trip'
import { ViewMode } from './ui/ViewToggle'
import { useIntersectionObserver } from '@/lib/performance'

// Lazy load TripCard for better performance
const TripCard = dynamic(() => import('./TripCardOptimized'), {
  loading: () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
})

const TripsList = dynamic(() => import('./trips/TripsList').then(mod => ({ default: mod.TripsList })), {
  loading: () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
      ))}
    </div>
  )
})

interface LazyTripsGridProps {
  trips: TripWithRelations[]
  viewType: ViewType
  userId: string | null
  viewMode: ViewMode
  sellerData?: Record<string, { referral_code: string; status: string }>
}

// Virtualized trip item component
const TripItem = memo(function TripItem({ 
  trip, 
  viewType, 
  userId, 
  sellerData,
  isVisible 
}: {
  trip: TripWithRelations
  viewType: ViewType
  userId: string | null
  sellerData?: Record<string, { referral_code: string; status: string }>
  isVisible: boolean
}) {
  const [shouldRender, setShouldRender] = useState(isVisible)
  const elementRef = useRef<HTMLDivElement>(null)

  const { observe } = useIntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !shouldRender) {
          setShouldRender(true)
        }
      })
    },
    { rootMargin: '100px' }
  )

  useEffect(() => {
    if (elementRef.current && !shouldRender) {
      observe(elementRef.current)
    }
  }, [observe, shouldRender])

  if (!shouldRender) {
    return (
      <div 
        ref={elementRef}
        className="h-[400px] bg-gray-100 rounded-2xl animate-pulse"
        aria-label="Loading trip..."
      />
    )
  }

  return (
    <div ref={elementRef}>
      <TripCard
        trip={trip}
        viewType={viewType}
        currentSellerId={userId || undefined}
        sellerData={sellerData?.[userId || '']}
      />
    </div>
  )
})

export const LazyTripsGrid = memo(function LazyTripsGrid({ 
  trips, 
  viewType, 
  userId, 
  viewMode, 
  sellerData 
}: LazyTripsGridProps) {
  // Memoize the grid layout calculation
  const gridConfig = useMemo(() => {
    const itemsPerRow = viewMode === 'list' ? 1 : 
      (typeof window !== 'undefined' && window.innerWidth < 1024) ? 1 :
      (typeof window !== 'undefined' && window.innerWidth < 1280) ? 2 : 3
    
    return { itemsPerRow }
  }, [viewMode])

  // Split trips into chunks for progressive loading
  const tripChunks = useMemo(() => {
    const chunkSize = 6
    const chunks = []
    for (let i = 0; i < trips.length; i += chunkSize) {
      chunks.push(trips.slice(i, i + chunkSize))
    }
    return chunks
  }, [trips])

  if (viewMode === 'list') {
    return <TripsList trips={trips} viewType={viewType} userId={userId} />
  }

  return (
    <div className="space-y-8">
      {tripChunks.map((chunk, chunkIndex) => (
        <div key={chunkIndex} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {chunk.map((trip, index) => (
            <TripItem
              key={trip.id}
              trip={trip}
              viewType={viewType}
              userId={userId}
              sellerData={sellerData}
              isVisible={chunkIndex === 0 && index < 3} // First 3 items visible immediately
            />
          ))}
        </div>
      ))}
    </div>
  )
})