'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BsPencil } from 'react-icons/bs'
import type { CommissionGoal, TopSellingTrip } from '@/types/dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import EditGoalModal from './EditGoalModal'

interface CommissionGoalCardProps {
  commissionGoal: CommissionGoal | undefined
  topTrips?: TopSellingTrip[] | undefined
  isLoading: boolean
  onUpdateGoal: (goal: number) => void
  isUpdating: boolean
}

function formatCurrency(value: number): string {
  return value.toLocaleString()
}

export default function CommissionGoalCard({
  commissionGoal,
  topTrips,
  isLoading,
  onUpdateGoal,
  isUpdating
}: CommissionGoalCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-40 mb-3" />
        <Skeleton className="h-3 w-full mb-6" />
        <Skeleton className="h-4 w-48 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const current = commissionGoal?.current || 0
  const goal = commissionGoal?.goal || 100000
  const progress = commissionGoal?.progress || 0

  return (
    <>
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        {/* Header with Commission Goal */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-medium text-[#FF6B35]">เป้าหมายคอมมิชชั่น</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="แก้ไขเป้าหมาย"
          >
            <BsPencil className="w-4 h-4" />
          </button>
        </div>

        {/* Commission Display */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(current)}.-
            </span>
            <span className="text-lg text-gray-400">
              /{formatCurrency(goal)}.-
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary-blue rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Top Trips Section */}
        {topTrips && topTrips.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              3 อันดับทริปที่ทำยอดขายได้มากที่สุด
            </h4>

            <div className="grid grid-cols-3 gap-3">
              {topTrips.slice(0, 3).map((trip) => (
                <div key={trip.tripId} className="group">
                  {/* Trip Image */}
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-gray-200">
                    {trip.coverImageUrl ? (
                      <Image
                        src={trip.coverImageUrl}
                        alt={trip.tripTitle}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849Z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Trip Info */}
                  <h5 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1 leading-tight">
                    {trip.tripTitle}
                  </h5>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-500">
                      จำนวนลูกทัวร์ที่ไปแล้ว{' '}
                      <span className="text-primary-blue font-medium">{trip.bookingsCount} คน</span>
                    </p>
                    <p className="text-[10px] text-gray-500">
                      ค่าคอมมิชชั่นที่ได้{' '}
                      <span className="text-primary-blue font-medium">{formatCurrency(trip.commission)}.-</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EditGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentGoal={goal}
        onSave={onUpdateGoal}
        isLoading={isUpdating}
      />
    </>
  )
}
