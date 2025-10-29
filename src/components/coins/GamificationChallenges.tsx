'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  GiftIcon,
  TrendingUp,
  CheckCircle2,
  Lock,
  Unlock,
  Target,
  Award,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

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
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Gamification Challenges</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complete tasks to earn and unlock coins
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            {campaigns.length} Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {campaigns.map((campaign) => {
          const progress = getProgress(campaign.id)
          const condition1Done = progress?.condition_1_completed || false
          const condition2Done = progress?.condition_2_completed || false
          const bothDone = progress?.both_completed || false

          return (
            <div
              key={campaign.id}
              className={`relative p-5 rounded-xl border-2 transition-all ${
                bothDone
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
            >
              {/* Campaign Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{campaign.title}</h3>
                    {bothDone && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground">{campaign.description}</p>
                  )}
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-3 mb-4">
                {/* Condition 1 */}
                <div className={`p-4 rounded-lg border ${
                  condition1Done
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
                        condition1Done ? 'bg-green-500' : 'bg-amber-500'
                      }`}>
                        {condition1Done ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                          <Target className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className="font-semibold text-sm">
                        Step 1: {getCondition1Label(campaign.condition_1_type)}
                      </span>
                    </div>
                    <Badge variant="outline" className={
                      campaign.condition_1_reward_type === 'earning'
                        ? 'border-amber-400 text-amber-700'
                        : 'border-green-400 text-green-700'
                    }>
                      +{campaign.condition_1_reward_amount} {
                        campaign.condition_1_reward_type === 'earning' ? 'Earning' : 'Redeemable'
                      }
                    </Badge>
                  </div>

                  {!condition1Done && (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteTask(campaign.id)}
                      disabled={completingCampaign === campaign.id}
                      className="w-full mt-2 bg-amber-500 hover:bg-amber-600"
                    >
                      {completingCampaign === campaign.id ? 'Processing...' : 'Complete Task'}
                    </Button>
                  )}

                  {condition1Done && progress?.condition_1_completed_at && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Completed on {format(new Date(progress.condition_1_completed_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>

                {/* Condition 2 */}
                <div className={`p-4 rounded-lg border ${
                  condition2Done
                    ? 'bg-green-50 border-green-200'
                    : condition1Done
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
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
                      <span className={`font-semibold text-sm ${
                        !condition1Done ? 'text-gray-500' : ''
                      }`}>
                        Step 2: {getCondition2Label(campaign.condition_2_type)}
                      </span>
                    </div>
                    {campaign.condition_2_action === 'unlock' && (
                      <Badge variant="outline" className="border-purple-400 text-purple-700">
                        <Unlock className="h-3 w-3 mr-1" />
                        Unlock Coins
                      </Badge>
                    )}
                    {campaign.condition_2_action === 'bonus' && (
                      <Badge variant="outline" className="border-pink-400 text-pink-700">
                        <Award className="h-3 w-3 mr-1" />
                        +{campaign.condition_2_bonus_amount} Bonus
                      </Badge>
                    )}
                  </div>

                  {!condition1Done && (
                    <p className="text-xs text-gray-500 mt-2">
                      Complete Step 1 first to unlock this step
                    </p>
                  )}

                  {condition1Done && !condition2Done && (
                    <p className="text-xs text-blue-600 mt-2">
                      Automatic - will complete when you {getCondition2Label(campaign.condition_2_type).toLowerCase()}
                    </p>
                  )}

                  {condition2Done && progress?.condition_2_completed_at && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Completed on {format(new Date(progress.condition_2_completed_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>

              {/* Campaign Duration */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                <span>
                  Valid: {format(new Date(campaign.start_date), 'MMM d')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                </span>
                {bothDone && (
                  <span className="text-green-600 font-semibold">
                    🎉 Challenge Complete!
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
