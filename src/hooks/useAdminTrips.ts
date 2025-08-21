import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, TripFormData, Country } from '@/types/admin'

export interface UseAdminTripsResult {
  trips: Trip[]
  loading: boolean
  error: string | null
  createTrip: (tripData: TripFormData) => Promise<Trip>
  updateTrip: (id: string, tripData: TripFormData) => Promise<Trip>
  deleteTrip: (id: string) => Promise<void>
  toggleTripStatus: (id: string, isActive: boolean) => Promise<void>
  refreshTrips: () => Promise<void>
}

export function useAdminTrips(pageSize: number = 10): UseAdminTripsResult {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const supabase = createClient()

  const fetchTrips = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search })
      })

      const response = await fetch(`/api/admin/trips?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch trips')
      }

      const data = await response.json()
      
      setTrips(data.trips)
      setTotalCount(data.totalCount)
      setCurrentPage(data.currentPage)
      setTotalPages(data.totalPages)

    } catch (err: any) {
      setError(err.message)
      console.error('Fetch trips error:', err)
    } finally {
      setLoading(false)
    }
  }

  const createTrip = async (tripData: TripFormData): Promise<Trip> => {
    try {
      setError(null)

      const response = await fetch('/api/admin/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create trip')
      }

      const data = await response.json()
      
      // Refresh trips list
      await fetchTrips(currentPage)
      
      return data.trip

    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateTrip = async (id: string, tripData: TripFormData): Promise<Trip> => {
    try {
      setError(null)

      const response = await fetch(`/api/admin/trips/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update trip')
      }

      const data = await response.json()
      
      // Refresh trips list
      await fetchTrips(currentPage)
      
      return data.trip

    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteTrip = async (id: string): Promise<void> => {
    try {
      setError(null)

      const response = await fetch(`/api/admin/trips/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete trip')
      }

      // Refresh trips list
      await fetchTrips(currentPage)

    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const toggleTripStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      setError(null)

      // Use Supabase client directly for simple toggle
      const { error } = await supabase
        .from('trips')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error

      // Update local state immediately for better UX
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip.id === id ? { ...trip, is_active: isActive } : trip
        )
      )

    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const refreshTrips = async (): Promise<void> => {
    await fetchTrips(currentPage)
  }

  // Fetch trips on component mount
  useEffect(() => {
    fetchTrips()
  }, [])

  return {
    trips,
    loading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    toggleTripStatus,
    refreshTrips
  }
}

// Hook for fetching countries
export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCountries = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/countries')
      
      if (!response.ok) {
        throw new Error('Failed to fetch countries')
      }

      const data = await response.json()
      setCountries(data.countries || [])

    } catch (err: any) {
      setError(err.message)
      console.error('Fetch countries error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCountries()
  }, [])

  return { countries, loading, error, fetchCountries }
}
