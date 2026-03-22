import React from 'react'
import Image from 'next/image'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import type { LeaderboardEntry, RankingMetric } from '@/app/api/seller/ranking/route'

interface TopPodiumProps {
  leaderboard: LeaderboardEntry[]
  metric: RankingMetric
  isLoading?: boolean
}

function formatValue(value: number, metric: RankingMetric): string {
  if (metric === 'bookings') return `${value.toLocaleString('th-TH')} trips`
  if (metric === 'coins') return `${value.toLocaleString('th-TH')} coins`
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`
  return `฿${value.toLocaleString('th-TH')}`
}

// Visual order: 2nd (left) | 1st (center) | 3rd (right)
const PODIUM_ORDER = [1, 0, 2] as const
type PodiumPosition = 0 | 1 | 2

const PODIUM_CONFIG: Record<PodiumPosition, {
  blockH: string
  avatarSize: number
  rankLabel: string
  blockStyle: React.CSSProperties
  blockText: string
  avatarRingClass: string
  isFirst: boolean
}> = {
  0: {
    blockH: 'h-20',
    avatarSize: 56,
    rankLabel: '#1',
    blockStyle: { background: 'linear-gradient(to bottom, #f59e0b, #d97706)' },
    blockText: 'text-amber-100',
    avatarRingClass: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white',
    isFirst: true,
  },
  1: {
    blockH: 'h-14',
    avatarSize: 48,
    rankLabel: '#2',
    blockStyle: { background: 'linear-gradient(to bottom, #9ca3af, #6b7280)' },
    blockText: 'text-gray-100',
    avatarRingClass: 'ring-2 ring-gray-300 ring-offset-2 ring-offset-white',
    isFirst: false,
  },
  2: {
    blockH: 'h-10',
    avatarSize: 42,
    rankLabel: '#3',
    blockStyle: { background: 'linear-gradient(to bottom, #fb923c, #ea580c)' },
    blockText: 'text-orange-100',
    avatarRingClass: 'ring-2 ring-orange-300 ring-offset-2 ring-offset-white',
    isFirst: false,
  },
}

interface PodiumSlotProps {
  entry: LeaderboardEntry | null
  position: PodiumPosition
  metric: RankingMetric
}

function PodiumSlot({ entry, position, metric }: PodiumSlotProps) {
  const config = PODIUM_CONFIG[position]
  const sz = config.avatarSize

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {/* Crown spacer for alignment */}
      <div className="h-7 flex items-center justify-center mb-1.5">
        {config.isFirst && entry && (
          <span className="text-2xl leading-none">👑</span>
        )}
      </div>

      {/* Avatar */}
      <div
        className={`rounded-full overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center ${
          entry?.isSelf
            ? 'ring-2 ring-[#2c6ba8] ring-offset-2 ring-offset-white'
            : config.avatarRingClass
        } ${config.isFirst ? 'shadow-lg shadow-amber-500/25' : ''}`}
        style={{ width: sz, height: sz }}
      >
        {entry?.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt={entry.sellerName}
            width={sz}
            height={sz}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <UserCircleIcon className="w-3/4 h-3/4 text-slate-300" />
        )}
      </div>

      {/* Name & value */}
      <div className="text-center mt-2 px-1 min-w-0 w-full space-y-0.5">
        <p className={`font-semibold text-gray-800 truncate leading-snug ${config.isFirst ? 'text-sm' : 'text-xs'}`}>
          {entry ? entry.sellerName : '—'}
        </p>
        {entry && (
          <p className={`text-gray-500 ${config.isFirst ? 'text-xs' : 'text-[11px]'}`}>
            {formatValue(entry.value, metric)}
          </p>
        )}
        {entry?.isSelf && (
          <p className="text-[10px] text-[#2c6ba8] font-medium">(คุณ)</p>
        )}
      </div>

      {/* Podium block */}
      <div
        className={`w-full ${config.blockH} mt-3 rounded-t-xl flex items-center justify-center shadow-sm`}
        style={config.blockStyle}
      >
        <span className={`text-xs font-bold ${config.blockText}`}>{config.rankLabel}</span>
      </div>
    </div>
  )
}

export function TopPodium({ leaderboard, metric, isLoading }: TopPodiumProps) {
  if (isLoading) {
    return (
      <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 animate-pulse">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="h-3 bg-gray-100 rounded-full w-14 mb-6" />
        <div className="flex items-end justify-center gap-3">
          {([1, 0, 2] as const).map(pos => (
            <div key={pos} className="flex-1 flex flex-col items-center gap-2">
              <div className="rounded-full bg-gray-100" style={{ width: PODIUM_CONFIG[pos].avatarSize, height: PODIUM_CONFIG[pos].avatarSize }} />
              <div className="h-2.5 bg-gray-100 rounded-full w-3/4" />
              <div className="h-2 bg-gray-100 rounded-full w-1/2" />
              <div className={`w-full bg-gray-100 rounded-t-xl ${PODIUM_CONFIG[pos].blockH}`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)
  if (top3.length === 0) return null

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden p-6 flex flex-col h-full">
      {/* Decorative corner circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5 relative">
        <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/30">
          <span className="text-base leading-none">🏆</span>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Top 3</p>
          <p className="text-xs text-gray-500">อันดับสูงสุด</p>
        </div>
      </div>

      <div className="flex items-end justify-center gap-3 mt-auto relative">
        {PODIUM_ORDER.map(i => (
          <PodiumSlot key={i} entry={top3[i] ?? null} position={i} metric={metric} />
        ))}
      </div>
    </div>
  )
}
