import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'all', 'pending', 'approved', 'rejected'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for sellers using admin client
    let query = adminClient
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
      .eq('role', 'seller')

    // Add status filter if specified
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Add pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const { data: sellers, error: sellersError } = await query

    if (sellersError) {
      console.error('Sellers fetch error:', sellersError)
      return NextResponse.json(
        { error: sellersError.message },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = adminClient
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'seller')

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count error:', countError)
    }

    return NextResponse.json({
      success: true,
      data: sellers,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error: any) {
    console.error('Get sellers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get sellers' },
      { status: 500 }
    )
  }
}

// POST method for bulk operations
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { action, sellerIds, status, reason } = body

    // Validate action
    if (action !== 'bulk_status_update') {
      return NextResponse.json(
        { error: 'Invalid action. Currently only supports: bulk_status_update' },
        { status: 400 }
      )
    }

    // Validate inputs
    if (!Array.isArray(sellerIds) || sellerIds.length === 0) {
      return NextResponse.json(
        { error: 'sellerIds must be a non-empty array' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'approved', 'rejected']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, approved, rejected' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved') {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    } else {
      updateData.approved_by = null
      updateData.approved_at = null
    }

    // Bulk update using admin client
    const { data, error: updateError } = await adminClient
      .from('user_profiles')
      .update(updateData)
      .in('id', sellerIds)
      .eq('role', 'seller')
      .select('id, status')

    if (updateError) {
      console.error('Bulk update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Log the bulk action
    console.log(`Admin ${user.email} performed bulk status update`, {
      adminId: user.id,
      sellerIds,
      newStatus: status,
      reason,
      affectedCount: data?.length || 0,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data,
      message: `Successfully updated ${data?.length || 0} sellers to ${status}`
    })

  } catch (error: any) {
    console.error('Bulk sellers update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk update' },
      { status: 500 }
    )
  }
}