import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { status, reason } = body

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, approved, rejected' },
        { status: 400 }
      )
    }

    // Update seller status using admin client (bypasses RLS)
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Add approval fields if approving
    if (status === 'approved') {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    } else {
      // Clear approval fields if rejecting or setting to pending
      updateData.approved_by = null
      updateData.approved_at = null
    }

    const { data, error: updateError } = await adminClient
      .from('user_profiles')
      .update(updateData)
      .eq('id', sellerId)
      .select('id, status, approved_by, approved_at')
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Log the action
    console.log(`Admin ${user.email} updated seller ${sellerId} status to ${status}`, {
      adminId: user.id,
      sellerId,
      newStatus: status,
      reason,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data,
      message: `Seller status updated to ${status} successfully`
    })

  } catch (error: any) {
    console.error('Seller status update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update seller status' },
      { status: 500 }
    )
  }
}

// GET method to get seller details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get seller details
    const { data: seller, error: sellerError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        status,
        role,
        referral_code,
        commission_goal,
        avatar_url,
        id_card_url,
        document_url,
        documents_urls,
        id_card_uploaded_at,
        avatar_uploaded_at,
        document_uploaded_at,
        approved_by,
        approved_at,
        created_at,
        updated_at
      `)
      .eq('id', sellerId)
      .eq('role', 'seller')
      .single()

    if (sellerError) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: seller
    })

  } catch (error: any) {
    console.error('Get seller error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get seller details' },
      { status: 500 }
    )
  }
}