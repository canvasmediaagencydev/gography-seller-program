import React from 'react'
import type { RankingMetric } from '@/app/api/seller/ranking/route'

interface MyPositionCardProps {
  rank: number
  totalSellers: number
  value: number
  nextRankGap: number | null
  progressToNextRank: number
  metric: RankingMetric
  isLoading?: boolean
}

const METRIC_LABELS: Record<RankingMetric, string> = {
  sales: 'ยอดขาย',
  commission: 'คอมมิชชั่น',
  coins: 'Coins',
  bookings: 'จำนวน Booking',
}

function formatValue(value: number, metric: RankingMetric): string {
  if (metric === 'bookings' || metric === 'coins') return value.toLocaleString('th-TH')
  return `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatGap(gap: number, metric: RankingMetric): string {
  if (metric === 'bookings') return `${gap.toLocaleString('th-TH')} booking`
  if (metric === 'coins') return `${gap.toLocaleString('th-TH')} coins`
  return `฿${gap.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getRankConfig(rank: number): {
  color: string
  iconBg: string
  iconShadow: string
  progressGradient: string
  medal: string
} {
  if (rank === 1) return {
    color: 'text-amber-500',
    iconBg: 'from-amber-500 to-yellow-600',
    iconShadow: 'shadow-amber-500/30',
    progressGradient: 'from-amber-400 to-yellow-400',
    medal: '🥇',
  }
  if (rank === 2) return {
    color: 'text-slate-500',
    iconBg: 'from-slate-400 to-gray-500',
    iconShadow: 'shadow-slate-400/30',
    progressGradient: 'from-slate-400 to-gray-400',
    medal: '🥈',
  }
  if (rank === 3) return {
    color: 'text-orange-500',
    iconBg: 'from-orange-500 to-amber-600',
    iconShadow: 'shadow-orange-500/30',
    progressGradient: 'from-orange-400 to-amber-400',
    medal: '🥉',
  }
  return {
    color: 'text-blue-600',
    iconBg: 'from-blue-600 to-indigo-700',
    iconShadow: 'shadow-blue-500/30',
    progressGradient: 'from-blue-500 to-indigo-500',
    medal: '',
  }
}

export function MyPositionCard({
  rank,
  totalSellers,
  value,
  nextRankGap,
  progressToNextRank,
  metric,
  isLoading,
}: MyPositionCardProps) {
  if (isLoading) {
    return (
      <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 animate-pulse space-y-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded-full w-20" />
            <div className="h-2.5 bg-gray-100 rounded-full w-14" />
          </div>
        </div>
        <div className="h-12 bg-gray-100 rounded-lg w-32" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="h-2 bg-gray-100 rounded-full w-full" />
        </div>
      </div>
    )
  }

  const progress = Math.min(progressToNextRank, 99)
  const config = getRankConfig(rank)

  return (
    <div className="group relative bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 border border-white overflow-hidden p-6 sm:p-8 flex flex-col h-full">
      {/* Decorative corner circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5 relative">
        <div className={`p-2.5 bg-gradient-to-br ${config.iconBg} rounded-xl shadow-lg ${config.iconShadow} group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-base leading-none">🎖️</span>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">ตำแหน่งของคุณ</p>
          <p className="text-xs text-gray-500">จาก {totalSellers.toLocaleString('th-TH')} คน</p>
        </div>
      </div>

      {/* Rank number */}
      <div className="flex items-baseline gap-2 mb-4 relative">
        <span className={`text-6xl sm:text-7xl font-black tracking-tighter leading-none filter drop-shadow-md ${config.color}`}>
          #{rank}
        </span>
        {config.medal && (
          <span className="text-3xl leading-none">{config.medal}</span>
        )}
      </div>

      {/* Metric value */}
      <div className="flex items-center gap-2 py-3 border-t border-b border-gray-100 relative">
        <span className="text-sm text-gray-500">{METRIC_LABELS[metric]}</span>
        <span className="ml-auto text-sm font-bold text-gray-900">
          {formatValue(value, metric)}
        </span>
      </div>

      {/* Progress to next rank */}
      <div className="mt-auto pt-4 relative">
        {nextRankGap !== null && nextRankGap > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">ไปยังอันดับ #{rank - 1}</span>
              <span className="text-xs font-semibold text-gray-600">
                อีก {formatGap(nextRankGap, metric)}
              </span>
            </div>
            <div className="w-full bg-slate-100/80 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${config.progressGradient} transition-all duration-1000 ease-out relative overflow-hidden`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">ความคืบหน้า</p>
              <p className="text-xs font-semibold text-gray-600">{Math.round(progress)}%</p>
            </div>
          </>
        ) : rank === 1 ? (
          <div className="flex items-center gap-2 py-2">
            <span className="text-xl">👑</span>
            <p className="text-sm font-semibold text-amber-600">อันดับ 1 — ยอดเยี่ยม!</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
