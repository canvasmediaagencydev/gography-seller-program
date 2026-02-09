'use client'

import Image from 'next/image'
import { BsAirplane, BsChevronDown } from 'react-icons/bs'
import type { SoldTrip, CommissionStatusFilter } from '@/types/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

interface SoldTripsTableProps {
  trips: SoldTrip[] | undefined
  isLoading: boolean
  totalCount: number
  currentPage: number
  totalPages: number
  commissionFilter: CommissionStatusFilter
  onCommissionFilterChange: (filter: CommissionStatusFilter) => void
  onPageChange: (page: number) => void
}

function formatCurrency(value: number): string {
  return value.toLocaleString()
}

function formatDateRange(departureDate: string, returnDate: string): string {
  const start = new Date(departureDate)
  const end = new Date(returnDate)

  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

  const startDay = start.getDate()
  const endDay = end.getDate()
  const month = thaiMonths[end.getMonth()]
  const year = end.getFullYear()

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}-${endDay} ${month} ${year}`
  }

  return `${startDay} ${thaiMonths[start.getMonth()]} - ${endDay} ${month} ${year}`
}

// Visual indicator component for customer count (squares)
function CustomerCountIndicator({ count }: { count: number }) {
  const maxDisplay = 8
  const displayCount = Math.min(count, maxDisplay)
  const rows = Math.ceil(displayCount / 4)

  return (
    <div className="flex flex-col gap-0.5">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-0.5">
          {[...Array(Math.min(4, displayCount - rowIndex * 4))].map((_, colIndex) => (
            <div
              key={colIndex}
              className="w-2.5 h-2.5 rounded-sm bg-[#FF6B35]"
            />
          ))}
        </div>
      ))}
      {count > maxDisplay && (
        <span className="text-[10px] text-gray-500">+{count - maxDisplay}</span>
      )}
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-16 h-12 rounded-lg flex-shrink-0" />
          <Skeleton className="h-4 w-40" />
        </div>
      </td>
      <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
      <td className="px-4 py-4"><Skeleton className="h-6 w-12" /></td>
      <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
    </tr>
  )
}

const COMMISSION_FILTERS: { value: CommissionStatusFilter; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'paid', label: 'ชำระแล้ว' },
  { value: 'pending', label: 'รอชำระ' }
]

export default function SoldTripsTable({
  trips,
  isLoading,
  totalCount,
  currentPage,
  totalPages,
  commissionFilter,
  onCommissionFilterChange,
  onPageChange
}: SoldTripsTableProps) {
  const hasTrips = trips && trips.length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-primary-blue">ทริปที่ขายได้ทั้งหมด</h3>
            <span className="inline-flex items-center px-2.5 py-1 text-sm font-medium text-[#FF6B35] bg-orange-50 rounded-lg">
              {totalCount} ทริป
            </span>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={commissionFilter}
              onChange={(e) => onCommissionFilterChange(e.target.value as CommissionStatusFilter)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white cursor-pointer"
            >
              {COMMISSION_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
            <BsChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                ชื่อทริป
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                วันที่เดินทาง
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  จำนวนลูกทัวร์
                  <BsChevronDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  ค่าทริป(ต่อคน)
                  <BsChevronDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                ค่าคอมมิชชั่นทั้งหมด
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
            ) : !hasTrips ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                      <BsAirplane className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">ยังไม่มีข้อมูลทริปที่ขาย</p>
                  </div>
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.bookingId} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
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
                            <BsAirplane className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 line-clamp-2 max-w-[200px]">
                        {trip.tripTitle}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {formatDateRange(trip.departureDate, trip.returnDate)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <CustomerCountIndicator count={trip.customerCount} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">
                      {formatCurrency(Math.round(trip.totalAmount / trip.customerCount))}.-
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-primary-blue">
                      {formatCurrency(trip.commissionAmount)}.-
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              แสดง {trips?.length || 0} จาก {totalCount} รายการ
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ก่อนหน้า
              </button>
              <span className="text-sm text-gray-600">
                หน้า {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
