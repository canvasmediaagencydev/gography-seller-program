import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/coins/gamification/complete-task
 * Complete a gamification task (Condition 1)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { campaign_id, task_data = {} } = body

    if (!campaign_id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Call the database function to complete the task
    const { data, error } = await supabase
      .rpc('complete_gamification_task' as any, {
        p_campaign_id: campaign_id,
        p_seller_id: user.id,
        p_task_data: task_data
      })

    if (error) {
      console.error('Error completing task:', error)
      return NextResponse.json({ error: error.message || 'Failed to complete task' }, { status: 500 })
    }

    // Check if the function returned an error
    if (data && !data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Error in POST /api/coins/gamification/complete-task:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
