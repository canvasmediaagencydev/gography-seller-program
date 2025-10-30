import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/coins/gamification
 * Fetch active gamification campaigns and seller's progress
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('gamification_campaigns' as any)
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .lte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Fetch seller's progress for these campaigns
    const campaignIds = campaigns?.map((c: any) => c.id) || []

    let myProgress: any[] = []
    if (campaignIds.length > 0) {
      const { data: progressData, error: progressError } = await supabase
        .from('gamification_progress' as any)
        .select('*')
        .eq('seller_id', user.id)
        .in('campaign_id', campaignIds)

      if (progressError) {
        console.error('Error fetching progress:', progressError)
        // Don't fail the request if progress fetch fails
      } else {
        myProgress = progressData || []
      }
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      my_progress: myProgress
    })
  } catch (error) {
    console.error('Error in GET /api/coins/gamification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
