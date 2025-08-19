'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Hooks
import { useBookingData } from '@/hooks/useBookingData'
import { useCustomers } from '@/hooks/useCustomers'
import { useBookingActions } from '@/hooks/useBookingActions'

// Components
import LoadingSpinner from '@/components/booking/LoadingSpinner'
import ErrorDisplay from '@/components/booking/ErrorDisplay'
import BookingHeader from '@/components/booking/BookingHeader'
import TripInfoCard from '@/components/booking/TripInfoCard'
import CustomerForm from '@/components/booking/CustomerForm'
import BookingSummary from '@/components/booking/BookingSummary'
import ContactSupport from '@/components/booking/ContactSupport'

// Constants
import { SUPPORT_MESSAGES } from '@/constants/booking'

export default function BookTripPage({
  params
}: {
  params: Promise<{ tripId: string; scheduleId: string }>
}) {
  const [resolvedParams, setResolvedParams] = useState<{ tripId: string; scheduleId: string } | null>(null)
  const searchParams = useSearchParams()
  const sellerRef = searchParams.get('ref')

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  // Custom hooks - only call when params are resolved
  const { trip, schedule, seller, loading, error: dataError } = useBookingData(
    resolvedParams?.tripId || null,
    resolvedParams?.scheduleId || null,
    sellerRef
  )
  const { customers, addCustomer, removeCustomer, updateCustomer, validateMainCustomer } = useCustomers()
  
  // Booking actions hook
  const { 
    isBooking, 
    error, 
    calculateTotalAmount, 
    handleBooking: performBooking,
    setError 
  } = useBookingActions({
    trip,
    schedule,
    seller,
    tripId: resolvedParams?.tripId || '',
    scheduleId: resolvedParams?.scheduleId || '',
    customers
  })

  const handleBooking = () => {
    performBooking(validateMainCustomer)
  }

  // Loading state for params resolution
  if (!resolvedParams) {
    return <LoadingSpinner message={SUPPORT_MESSAGES.booking.loading} />
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message={SUPPORT_MESSAGES.booking.loadingData} />
  }

  // Error state
  if (dataError) {
    return <ErrorDisplay error={dataError} />
  }

  // No data state
  if (!trip || !schedule) {
    return <ErrorDisplay error={SUPPORT_MESSAGES.error.noTripData} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <BookingHeader />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Info */}
            <TripInfoCard trip={trip} schedule={schedule} seller={seller} />

            {/* Customer Forms */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ข้อมูลผู้เดินทาง</h3>
                <p className="text-gray-600 text-sm">กรุณากรอกข้อมูลผู้เดินทางทุกท่าน</p>
              </div>

              <div className="space-y-6">
                {customers.map((customer, index) => (
                  <CustomerForm
                    key={index}
                    customer={customer}
                    index={index}
                    onUpdate={updateCustomer}
                    onRemove={removeCustomer}
                    canRemove={index > 0}
                  />
                ))}
                
                <button
                  onClick={addCustomer}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>เพิ่มผู้เดินทาง</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <BookingSummary
                customerCount={customers.length}
                pricePerPerson={trip.price_per_person}
                totalAmount={calculateTotalAmount()}
                onBooking={handleBooking}
                isBooking={isBooking}
                canBook={validateMainCustomer()}
                error={error}
                sellerRefCode={seller?.referral_code}
              />

              {/* Contact Support */}
              <ContactSupport />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
