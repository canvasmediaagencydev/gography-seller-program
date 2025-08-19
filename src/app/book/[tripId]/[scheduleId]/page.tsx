'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Hooks
import { useBookingData } from '@/hooks/useBookingData'
import { useCustomers } from '@/hooks/useCustomers'

// Components
import LoadingSpinner from '@/components/booking/LoadingSpinner'
import ErrorDisplay from '@/components/booking/ErrorDisplay'
import BookingHeader from '@/components/booking/BookingHeader'
import TripInfoCard from '@/components/booking/TripInfoCard'
import CustomerFormWrapper from '@/components/booking/CustomerFormWrapper'
import BookingSummary from '@/components/booking/BookingSummary'

// Utils
import { formatPrice } from '@/utils/bookingUtils'

// Supabase
import { createClient } from '@/lib/supabase/client'

export default function BookTripPage({
  params
}: {
  params: Promise<{ tripId: string; scheduleId: string }>
}) {
  const [resolvedParams, setResolvedParams] = useState<{ tripId: string; scheduleId: string } | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
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

  const supabase = createClient()

  const calculateTotalAmount = () => {
    return trip ? trip.price_per_person * customers.length : 0
  }

  const handleBooking = async () => {
    if (!resolvedParams) {
      setError('ไม่พบข้อมูล URL')
      return
    }

    if (!validateMainCustomer()) {
      setError('กรุณากรอกข้อมูลผู้ติดต่อหลักให้ครบถ้วน')
      return
    }

    if (!trip || !schedule) {
      setError('ไม่พบข้อมูลทริป')
      return
    }

    try {
      setIsBooking(true)
      setError(null)

      // Calculate total amount and commission
      const totalAmount = calculateTotalAmount()
      const commissionAmount = trip.commission_type === 'percentage'
        ? (trip.price_per_person * trip.commission_value) / 100 * customers.length
        : trip.commission_value * customers.length

      // Create customers first
      const customerIds: string[] = []
      for (const customerData of customers) {
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .insert({
            ...customerData,
            referred_by_code: seller?.referral_code,
            referred_by_seller_id: seller?.id
          })
          .select()
          .single()

        if (customerError) throw customerError
        customerIds.push(customer.id)
      }

      // Create booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          trip_schedule_id: resolvedParams.scheduleId,
          customer_id: customerIds[0], // Main customer
          seller_id: seller?.id,
          total_amount: totalAmount,
          commission_amount: commissionAmount,
          status: 'pending',
          notes: `จำนวนผู้เดินทาง: ${customers.length} คน
รายชื่อ: ${customers.map(c => c.full_name).join(', ')}`
        })

      if (bookingError) throw bookingError

      // Redirect to success page
      router.push('/book/success')

    } catch (err: any) {
      console.error('Error creating booking:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการจอง')
    } finally {
      setIsBooking(false)
    }
  }

  // Loading state for params resolution
  if (!resolvedParams) {
    return <LoadingSpinner message="กำลังโหลด..." />
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message="กำลังโหลดข้อมูล..." />
  }

  // Error state
  if (dataError) {
    return <ErrorDisplay error={dataError} />
  }

  // No data state
  if (!trip || !schedule) {
    return <ErrorDisplay error="ไม่พบข้อมูลทริปหรือตารางเวลาที่เลือก" />
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
            <CustomerFormWrapper
              customers={customers}
              onAddCustomer={addCustomer}
              onRemoveCustomer={removeCustomer}
              onUpdateCustomer={updateCustomer}
            />
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="font-medium text-gray-900 mb-3">ต้องการความช่วยเหลือ?</h4>
              <div className="space-y-2">
                <a href="tel:02-123-4567" className="block w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm text-center">
                  📞 โทร 02-123-4567
                </a>
                <a href="https://line.me/ti/p/@geography" className="block w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm text-center">
                  � แชท LINE
                </a>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
