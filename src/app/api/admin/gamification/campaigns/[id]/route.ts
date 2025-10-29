import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH - Update campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

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

    // Update campaign
    const { data: campaign, error } = await adminClient
      .from('gamification_campaigns')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign updated successfully',
      campaign
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/gamification/campaigns/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check if campaign has any progress
    const { count } = await adminClient
      .from('seller_campaign_progress')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', id)

    if (count && count > 0) {
      // Don't delete, just deactivate
      const { error } = await adminClient
        .from('gamification_campaigns')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        console.error('Error deactivating campaign:', error)
        return NextResponse.json({ error: 'Failed to deactivate campaign' }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Campaign deactivated (has existing progress)',
        deactivated: true
      })
    }

    // No progress, safe to delete
    const { error } = await adminClient
      .from('gamification_campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting campaign:', error)
      return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign deleted successfully',
      deleted: true
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/gamification/campaigns/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
