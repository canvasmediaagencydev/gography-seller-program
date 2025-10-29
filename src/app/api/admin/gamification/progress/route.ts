import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    const sellerId = searchParams.get('seller_id')
    const completed = searchParams.get('completed') // 'true', 'false', or null

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

    // Build query
    let query = adminClient
      .from('seller_campaign_progress')
      .select(`
        *,
        seller:user_profiles!seller_campaign_progress_seller_id_fkey(id, email, full_name),
        campaign:gamification_campaigns!seller_campaign_progress_campaign_id_fkey(id, title, condition_1_reward_amount, condition_2_action)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    if (sellerId) {
      query = query.eq('seller_id', sellerId)
    }

    if (completed === 'true') {
      query = query.eq('both_completed', true)
    } else if (completed === 'false') {
      query = query.eq('both_completed', false)
    }

    const { data: progress, error } = await query

    if (error) {
      console.error('Error fetching progress:', error)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // Calculate summary stats
    const stats = {
      total: progress?.length || 0,
      completed: progress?.filter(p => p.both_completed).length || 0,
      in_progress: progress?.filter(p => !p.both_completed).length || 0,
      condition_1_completed: progress?.filter(p => p.condition_1_completed).length || 0,
      condition_2_completed: progress?.filter(p => p.condition_2_completed).length || 0
    }

    return NextResponse.json({
      progress: progress || [],
      stats
    })

  } catch (error) {
    console.error('Error in GET /api/admin/gamification/progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
