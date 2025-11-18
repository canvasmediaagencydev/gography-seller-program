'use client'

import { GiftIcon, Sparkles } from 'lucide-react'
import { useTripCampaign } from '@/hooks/use-campaigns'

interface CampaignBadgeProps {
  tripId: string
}

export function CampaignBadge({ tripId }: CampaignBadgeProps) {
  const { campaign, isLoading } = useTripCampaign(tripId)

  if (isLoading || !campaign) {
    return null
  }

  return (
    <div className="absolute top-3 right-3 z-10">
      <div className="relative">
        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-lg blur-sm animate-pulse"></div>

        {/* Badge content */}
        <div className="relative bg-gradient-to-r from-yellow-400 to-yellow-500 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transform hover:scale-105 transition-transform">
          <Sparkles className="h-4 w-4 text-yellow-900 animate-pulse" />
          <span className="text-xs font-bold text-yellow-900">
            +{campaign.coin_amount} Coins
          </span>
          <GiftIcon className="h-4 w-4 text-yellow-900" />
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute top-full right-0 mt-1 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
          {campaign.title}
        </div>
      </div>
    </div>
  )
}
