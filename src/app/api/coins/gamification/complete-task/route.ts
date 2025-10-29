import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaign_id, task_data } = body

    if (!campaign_id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('gamification_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if campaign is active and within date range
    if (!campaign.is_active) {
      return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 })
    }

    const now = new Date()
    const startDate = new Date(campaign.start_date)
    const endDate = new Date(campaign.end_date)

    if (now < startDate || now > endDate) {
      return NextResponse.json({ error: 'Campaign is not currently running' }, { status: 400 })
    }

    // Check if seller already completed condition 1
    const { data: existingProgress } = await supabase
      .from('seller_campaign_progress')
      .select('*')
      .eq('seller_id', user.id)
      .eq('campaign_id', campaign_id)
      .single()

    if (existingProgress?.condition_1_completed) {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 })
    }

    // TODO: Validate task completion based on condition_1_type
    // For now, we'll trust the request (in production, add validation)
    // Examples:
    // - 'survey': Check if survey was completed
    // - 'profile_complete': Check profile fields
    // - 'onboarding_task': Check specific onboarding step

    // Add coins using the database function
    const { data: transactionId, error: coinsError } = await adminClient.rpc(
      'add_locked_or_redeemable_coins',
      {
        p_seller_id: user.id,
        p_amount: campaign.condition_1_reward_amount,
        p_coin_type: campaign.condition_1_reward_type,
        p_source_type: 'gamification',
        p_source_id: campaign_id,
        p_description: `${campaign.title} - Condition 1 completed`,
        p_metadata: {
          campaign_id,
          condition: 1,
          task_data: task_data || {}
        }
      }
    )

    if (coinsError) {
      console.error('Error adding coins:', coinsError)
      return NextResponse.json({ error: 'Failed to award coins' }, { status: 500 })
    }

    // Update or create progress record
    const { data: progress, error: progressError } = await adminClient
      .from('seller_campaign_progress')
      .upsert({
        seller_id: user.id,
        campaign_id,
        condition_1_completed: true,
        condition_1_completed_at: new Date().toISOString(),
        condition_1_transaction_id: transactionId
      }, {
        onConflict: 'seller_id,campaign_id'
      })
      .select()
      .single()

    if (progressError) {
      console.error('Error updating progress:', progressError)
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    // Dispatch event for real-time UI update
    // Frontend components listening for this will refresh coin balance
    return NextResponse.json({
      success: true,
      message: `Congratulations! You earned ${campaign.condition_1_reward_amount} ${campaign.condition_1_reward_type} coins!`,
      transaction_id: transactionId,
      progress,
      campaign: {
        title: campaign.title,
        condition_1_reward_amount: campaign.condition_1_reward_amount,
        condition_1_reward_type: campaign.condition_1_reward_type,
        condition_2_type: campaign.condition_2_type,
        condition_2_action: campaign.condition_2_action
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Error in POST /api/coins/gamification/complete-task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
