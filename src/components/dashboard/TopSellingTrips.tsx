'use client'

import Image from 'next/image'
import { BsAward, BsTicket } from 'react-icons/bs'
import type { TopSellingTrip } from '@/types/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

interface TopSellingTripsProps {
  trips: TopSellingTrip[] | undefined
  isLoading: boolean
}

function formatCurrency(value: number): string {
  return value.toLocaleString()
}

function TripItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
      <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export default function TopSellingTrips({ trips, isLoading }: TopSellingTripsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <TripItemSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const hasTrips = trips && trips.length > 0

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
          <BsAward className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">ทริปขายดี Top 3</h3>
      </div>

      {!hasTrips ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BsTicket className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">ยังไม่มีข้อมูลทริปที่ขาย</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip, index) => (
            <div
              key={trip.tripId}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Rank Badge */}
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                index === 0 ? 'bg-amber-400 text-white' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                'bg-amber-700 text-white'
              }`}>
                {index + 1}
              </div>

              {/* Trip Image */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                {trip.coverImageUrl ? (
                  <Image
                    src={trip.coverImageUrl}
                    alt={trip.tripTitle}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BsAirplane className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Trip Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {trip.tripTitle}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {trip.bookingsCount} การจอง
                  </span>
                  <span className="text-xs text-gray-300">|</span>
                  <span className="text-xs font-medium text-green-600">
                    {formatCurrency(trip.commission)} บาท
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Need to import for the placeholder icon
function BsAirplane({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16">
      <path d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849Z"/>
    </svg>
  )
}
