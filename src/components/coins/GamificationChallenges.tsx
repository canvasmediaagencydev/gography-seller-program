'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  GiftIcon,
  CheckCircle2,
  Lock,
  Unlock,
  Target,
  Award,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface GamificationCampaign {
  id: string
  title: string
  description: string | null

  // Condition 1
  condition_1_type: string
  condition_1_reward_amount: number
  condition_1_reward_type: 'earning' | 'redeemable'

  // Condition 2
  condition_2_type: string
  condition_2_action: 'unlock' | 'bonus' | 'none'
  condition_2_bonus_amount: number

  start_date: string
  end_date: string
  is_active: boolean
}

interface CampaignProgress {
  id: string
  campaign_id: string
  condition_1_completed: boolean
  condition_2_completed: boolean
  both_completed: boolean
  condition_1_completed_at: string | null
  condition_2_completed_at: string | null
}

export function GamificationChallenges() {
  const [campaigns, setCampaigns] = useState<GamificationCampaign[]>([])
  const [myProgress, setMyProgress] = useState<CampaignProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingCampaign, setCompletingCampaign] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/coins/gamification')

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns')
      }

      const data = await response.json()
      setCampaigns(data.campaigns || [])
      setMyProgress(data.my_progress || [])
    } catch (err: any) {
      console.error('Error fetching campaigns:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteTask = async (campaignId: string) => {
    try {
      setCompletingCampaign(campaignId)

      const response = await fetch('/api/coins/gamification/complete-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          task_data: {}
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete task')
      }

      // Refresh data
      await fetchCampaigns()

      // Trigger coin balance update event
      window.dispatchEvent(new Event('coinBalanceUpdated'))

      alert('Task completed successfully! Coins have been added to your account.')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setCompletingCampaign(null)
    }
  }

  const getProgress = (campaignId: string): CampaignProgress | undefined => {
    return myProgress.find(p => p.campaign_id === campaignId)
  }

  const getCondition1Label = (type: string): string => {
    const labels: Record<string, string> = {
      'survey': 'Complete Survey',
      'onboarding_task': 'Complete Onboarding',
      'profile_complete': 'Complete Profile',
      'referral': 'Refer a Friend'
    }
    return labels[type] || type
  }

  const getCondition2Label = (type: string): string => {
    const labels: Record<string, string> = {
      'first_trip_sold': 'Sell Your First Trip',
      'trip_count': 'Sell Multiple Trips',
      'sales_amount': 'Reach Sales Target'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading challenges...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
        <CardContent className="py-12">
          <div className="text-center">
            <GiftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">No Active Challenges</p>
            <p className="text-sm text-muted-foreground">
              Check back later for new opportunities to earn coins!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Active Challenges</h2>
            <p className="text-sm text-gray-600">
              Complete tasks to earn and unlock coins
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 px-3 py-1">
          {campaigns.length} Active
        </Badge>
      </div>

      {/* Challenges Grid - 4:3 Ratio Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.map((campaign) => {
          const progress = getProgress(campaign.id)
          const condition1Done = progress?.condition_1_completed || false
          const condition2Done = progress?.condition_2_completed || false
          const bothDone = progress?.both_completed || false

          return (
            <div
              key={campaign.id}
              className={`relative rounded-2xl border-2 transition-all overflow-hidden shadow-md hover:shadow-xl ${
                bothDone
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                  : 'bg-white border-gray-200 hover:border-purple-300'
              }`}
              style={{ aspectRatio: '4/3' }}
            >
              {/* Status Badge */}
              {bothDone && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500 rounded-full shadow-lg">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-semibold text-white">Completed</span>
                  </div>
                </div>
              )}

              {/* Card Content - Flex Layout */}
              <div className="h-full flex flex-col p-5">
                {/* Campaign Header */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{campaign.title}</h3>
                  {campaign.description && (
                    <p className="text-xs text-gray-600 line-clamp-1">{campaign.description}</p>
                  )}
                </div>

                {/* Progress Section - Grow to fill space */}
                <div className="flex-1 space-y-2.5">
                  {/* Condition 1 - Compact */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    condition1Done
                      ? 'bg-green-50 border-green-300'
                      : 'bg-amber-50 border-amber-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg ${
                        condition1Done ? 'bg-green-500' : 'bg-amber-500'
                      }`}>
                        {condition1Done ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                          <Target className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {getCondition1Label(campaign.condition_1_type)}
                        </p>
                      </div>
                      <Badge className={`text-xs ${
                        campaign.condition_1_reward_type === 'earning'
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}>
                        +{campaign.condition_1_reward_amount}
                      </Badge>
                    </div>

                    {!condition1Done && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(campaign.id)}
                        disabled={completingCampaign === campaign.id}
                        className="w-full h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold"
                      >
                        {completingCampaign === campaign.id ? 'Processing...' : 'Complete Now'}
                      </Button>
                    )}

                    {condition1Done && (
                      <div className="flex items-center gap-1.5 text-xs text-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="font-medium">Completed</span>
                      </div>
                    )}
                  </div>

                  {/* Condition 2 - Compact */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    condition2Done
                      ? 'bg-green-50 border-green-300'
                      : condition1Done
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-100 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        condition2Done
                          ? 'bg-green-500'
                          : condition1Done
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      }`}>
                        {condition2Done ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : condition1Done ? (
                          <Unlock className="h-4 w-4 text-white" />
                        ) : (
                          <Lock className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${
                          !condition1Done ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {getCondition2Label(campaign.condition_2_type)}
                        </p>
                        {!condition1Done && (
                          <p className="text-xs text-gray-500">Locked</p>
                        )}
                        {condition1Done && !condition2Done && (
                          <p className="text-xs text-blue-600">Auto-unlock</p>
                        )}
                        {condition2Done && (
                          <p className="text-xs text-green-600 font-medium">Completed</p>
                        )}
                      </div>
                      {campaign.condition_2_action === 'unlock' && (
                        <Unlock className="h-4 w-4 text-purple-500" />
                      )}
                      {campaign.condition_2_action === 'bonus' && (
                        <Award className="h-4 w-4 text-pink-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Campaign Duration - Footer */}
                <div className="pt-3 mt-auto border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 truncate">
                      {format(new Date(campaign.start_date), 'MMM d')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                    </span>
                    {bothDone && (
                      <span className="text-green-600 font-bold whitespace-nowrap ml-2">
                        🎉 Done!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
