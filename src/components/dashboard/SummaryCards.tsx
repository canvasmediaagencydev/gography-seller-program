'use client'

import type { DashboardStats, SellerRanking, PeriodFilter } from '@/types/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

interface SummaryCardsProps {
  stats: DashboardStats | undefined
  ranking: SellerRanking | undefined
  isLoading: boolean
  period?: PeriodFilter
}

function formatCurrency(value: number): string {
  return value.toLocaleString()
}

function getDateRangeText(period: PeriodFilter = 'all'): string {
  const now = new Date()
  const thaiYear = now.getFullYear() + 543
  const shortYear = thaiYear.toString().slice(-2)

  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

  if (period === 'week') {
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    return `วันที่ ${startOfWeek.getDate()} - ${now.getDate()} ${thaiMonths[now.getMonth()]} ${shortYear}`
  }

  if (period === 'month') {
    return `วันที่ 1 - ${now.getDate()} ${thaiMonths[now.getMonth()]} ${shortYear}`
  }

  // For 'all', show from Jan 1 to current date
  return `วันที่ 1 ม.ค. - ${now.getDate()} ${thaiMonths[now.getMonth()]} ${shortYear}`
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-28 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export default function SummaryCards({ stats, ranking, isLoading, period = 'all' }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const dateRangeText = getDateRangeText(period)
  const amountNeeded = ranking?.nextRankThreshold
    ? (ranking.nextRankThreshold - (ranking.totalSales || 0))
    : null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Sales */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <p className="text-sm font-medium text-gray-500 mb-1">ยอดขายรวม</p>
        <p className="text-2xl lg:text-3xl font-bold text-primary-blue mb-1">
          {formatCurrency(stats?.totalSales || 0)}.-
        </p>
        <p className="text-xs text-gray-400">{dateRangeText}</p>
      </div>

      {/* Trips Sold */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <p className="text-sm font-medium text-gray-500 mb-1">ทริปที่ขายได้</p>
        <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
          {stats?.tripsCount || 0} <span className="text-lg font-semibold">ทริป</span>
        </p>
        <p className="text-xs text-gray-400">{dateRangeText}</p>
      </div>

      {/* Total Commission */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <p className="text-sm font-medium text-gray-500 mb-1">คอมมิชชั่นรวม</p>
        <p className="text-2xl lg:text-3xl font-bold text-primary-blue mb-1">
          {formatCurrency(stats?.totalCommission || 0)}.-
        </p>
        <p className="text-xs text-gray-400">{dateRangeText}</p>
      </div>

      {/* Ranking */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <p className="text-sm font-medium text-gray-500 mb-1">อันดับ</p>
        <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
          {ranking?.rank || '-'}
          <span className="text-lg font-normal text-gray-400">/{ranking?.totalSellers || '-'}</span>
        </p>
        {amountNeeded && amountNeeded > 0 ? (
          <p className="text-xs text-gray-500">
            ทำยอดอีก <span className="text-primary-blue font-medium">{formatCurrency(amountNeeded)}.-</span> เพื่อเลื่อนขั้น!
          </p>
        ) : (
          <p className="text-xs text-gray-400">{dateRangeText}</p>
        )}
      </div>
    </div>
  )
}
