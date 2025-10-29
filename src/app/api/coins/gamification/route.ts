import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create cache key
    const cacheKey = `gamification_${user.id}`

    // Check cache first
    const cachedResult = apiCache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Get active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('gamification_campaigns')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Filter campaigns by target_audience
    const filteredCampaigns = campaigns?.filter(campaign => {
      if (campaign.target_audience === 'all') return true
      if (campaign.target_audience === 'specific_sellers') {
        return campaign.target_seller_ids?.includes(user.id)
      }
      // Add more audience filters if needed
      return true
    }) || []

    // Get seller's progress for these campaigns
    const { data: progress, error: progressError } = await supabase
      .from('seller_campaign_progress')
      .select('*')
      .eq('seller_id', user.id)
      .in('campaign_id', filteredCampaigns.map(c => c.id))

    if (progressError) {
      console.error('Error fetching progress:', progressError)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // Combine campaigns with progress
    const campaignsWithProgress = filteredCampaigns.map(campaign => {
      const campaignProgress = progress?.find(p => p.campaign_id === campaign.id)
      return {
        ...campaign,
        progress: campaignProgress || null
      }
    })

    const result = {
      campaigns: campaignsWithProgress,
      total: campaignsWithProgress.length
    }

    // Cache for 30 seconds
    apiCache.set(cacheKey, result, 30000)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/coins/gamification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
