import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List all campaigns
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Get all campaigns with stats
    const { data: campaigns, error } = await adminClient
      .from('gamification_campaigns')
      .select(`
        *,
        created_by_profile:user_profiles!gamification_campaigns_created_by_fkey(email, full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Get progress stats for each campaign
    const campaignsWithStats = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        const { count: totalParticipants } = await adminClient
          .from('seller_campaign_progress')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)

        const { count: completedCount } = await adminClient
          .from('seller_campaign_progress')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('both_completed', true)

        return {
          ...campaign,
          stats: {
            total_participants: totalParticipants || 0,
            completed_count: completedCount || 0,
            completion_rate: totalParticipants
              ? ((completedCount || 0) / totalParticipants * 100).toFixed(1)
              : 0
          }
        }
      })
    )

    return NextResponse.json({
      campaigns: campaignsWithStats,
      total: campaignsWithStats.length
    })

  } catch (error) {
    console.error('Error in GET /api/admin/gamification/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      condition_1_type,
      condition_1_data,
      condition_1_reward_amount,
      condition_1_reward_type,
      condition_2_type,
      condition_2_data,
      condition_2_action,
      condition_2_bonus_amount,
      start_date,
      end_date,
      target_audience,
      target_seller_ids
    } = body

    // Validation
    if (!title || !condition_1_type || !condition_1_reward_amount || !condition_1_reward_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!condition_2_type || !condition_2_action) {
      return NextResponse.json({ error: 'Condition 2 is required' }, { status: 400 })
    }

    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Create campaign
    const { data: campaign, error } = await adminClient
      .from('gamification_campaigns')
      .insert({
        title,
        description,
        condition_1_type,
        condition_1_data: condition_1_data || {},
        condition_1_reward_amount,
        condition_1_reward_type,
        condition_2_type,
        condition_2_data: condition_2_data || {},
        condition_2_action,
        condition_2_bonus_amount: condition_2_bonus_amount || 0,
        start_date,
        end_date,
        is_active: true,
        target_audience: target_audience || 'all',
        target_seller_ids: target_seller_ids || [],
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign created successfully',
      campaign
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/gamification/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
