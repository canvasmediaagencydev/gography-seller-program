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
  0: { // 1st
    blockH: 'h-24 sm:h-28',
    avatarSize: 72,
    rankLabel: '#1',
    blockStyle: { background: 'linear-gradient(135deg, #fceabb 0%, #f8b500 100%)', boxShadow: 'inset 0 -12px 24px rgba(0,0,0,0.15), 0 12px 24px rgba(245,158,11,0.25)' },
    blockText: 'text-amber-900 drop-shadow-md text-lg',
    avatarRingClass: 'ring-4 ring-amber-400/60 ring-offset-2 ring-offset-white shadow-[0_0_40px_rgba(245,158,11,0.6)]',
    isFirst: true,
  },
  1: { // 2nd
    blockH: 'h-16 sm:h-20',
    avatarSize: 56,
    rankLabel: '#2',
    blockStyle: { background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)', boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.15), 0 10px 20px rgba(148,163,184,0.2)' },
    blockText: 'text-slate-800 drop-shadow-sm text-base',
    avatarRingClass: 'ring-4 ring-slate-300/60 ring-offset-2 ring-offset-white shadow-lg shadow-slate-400/30',
    isFirst: false,
  },
  2: { // 3rd
    blockH: 'h-12 sm:h-14',
    avatarSize: 50,
    rankLabel: '#3',
    blockStyle: { background: 'linear-gradient(135deg, #fdc830 0%, #f37335 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.15), 0 8px 16px rgba(243,115,53,0.2)' },
    blockText: 'text-orange-900 drop-shadow-sm text-sm',
    avatarRingClass: 'ring-4 ring-orange-400/60 ring-offset-2 ring-offset-white shadow-lg shadow-orange-500/30',
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
      <div className="h-8 flex items-center justify-center mb-2">
        {config.isFirst && entry && (
          <span className="text-3xl leading-none animate-bounce" style={{ filter: 'drop-shadow(0 4px 6px rgba(245,158,11,0.5))' }}>👑</span>
        )}
      </div>

      {/* Avatar */}
      <div
        className={`rounded-full overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center z-10 transition-transform hover:scale-105 duration-300 ${
          entry?.isSelf
            ? 'ring-4 ring-[#2c6ba8] ring-offset-2 ring-offset-white shadow-xl shadow-blue-500/40'
            : config.avatarRingClass
        } ${config.isFirst ? 'shadow-2xl' : ''}`}
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
        <p className={`font-bold text-gray-900 truncate leading-tight ${config.isFirst ? 'text-base sm:text-lg' : 'text-sm'}`}>
          {entry ? entry.sellerName : '—'}
        </p>
        {entry && (
          <p className={`font-medium tracking-tight text-gray-500 ${config.isFirst ? 'text-sm' : 'text-xs'}`}>
            {formatValue(entry.value, metric)}
          </p>
        )}
        {entry?.isSelf && (
          <p className="text-[11px] text-[#2c6ba8] font-bold bg-blue-50 inline-block px-2 py-0.5 rounded-full">(คุณ)</p>
        )}
      </div>

      <div
        className={`w-full ${config.blockH} mt-3 rounded-t-2xl flex items-center justify-center transition-all duration-500 relative overflow-hidden`}
        style={config.blockStyle}
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
        <span className={`font-black ${config.blockText}`}>{config.rankLabel}</span>
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
    <div className="group relative bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 border border-white overflow-hidden p-6 sm:p-8 flex flex-col h-full">
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
