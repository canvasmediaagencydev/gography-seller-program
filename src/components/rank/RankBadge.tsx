import React from 'react'

export type RankTier = 'gold' | 'silver' | 'bronze' | 'rising' | 'none'

export function getRankTier(rank: number, totalSellers: number): RankTier {
  if (rank === 0 || totalSellers === 0) return 'none'
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  const percentile = rank / totalSellers
  if (percentile <= 0.1) return 'rising'
  return 'none'
}

const TIER_CONFIG: Record<RankTier, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  gold: { label: 'Gold', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', emoji: '🥇' },
  silver: { label: 'Silver', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-300', emoji: '🥈' },
  bronze: { label: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300', emoji: '🥉' },
  rising: { label: 'Rising Star', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300', emoji: '⭐' },
  none: { label: '', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', emoji: '' },
}

interface RankBadgeProps {
  rank: number
  totalSellers: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function RankBadge({ rank, totalSellers, size = 'md', showLabel = true }: RankBadgeProps) {
  const tier = getRankTier(rank, totalSellers)
  if (tier === 'none') return null

  const config = TIER_CONFIG[tier]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${config.bg} ${config.border} ${sizeClass}`}>
      <span>{config.emoji}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

interface MedalIconProps {
  rank: 1 | 2 | 3
  size?: number
}

export function MedalIcon({ rank, size = 24 }: MedalIconProps) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return <span style={{ fontSize: size }}>{medals[rank]}</span>
}
