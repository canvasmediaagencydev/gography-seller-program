import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { apiCache } from '@/lib/cache'

// Request deduplication cache (prevent multiple simultaneous updates)
const pendingUpdates = new Map<string, Promise<any>>()

export async function POST(request: NextRequest) {
  try {
    const { bookingId, status } = await request.json()

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Missing bookingId or status' },
        { status: 400 }
      )
    }

    // Request deduplication - prevent simultaneous updates
    const requestKey = `${bookingId}_${status}`
    if (pendingUpdates.has(requestKey)) {
      const result = await pendingUpdates.get(requestKey)
      return NextResponse.json(result)
    }

    // Validate status - เช็คค่าที่อนุญาตตาม database constraint
    const validStatuses = ['pending', 'inprogress', 'approved', 'rejected', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user is admin with caching
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Cache admin check for 2 minutes to reduce DB load
    const adminCacheKey = `admin_role_${user.id}`
    let isAdmin = apiCache.get(adminCacheKey)
    
    if (isAdmin === undefined) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      isAdmin = profile?.role === 'admin'
      apiCache.set(adminCacheKey, isAdmin, 120000) // 2 minutes
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Create update promise and cache it
    const updatePromise = (async () => {
      // Update booking status using admin client
      const adminSupabase = createAdminClient()
      const { data, error } = await adminSupabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'approved' ? { 
            approved_at: new Date().toISOString(),
            approved_by: user.id 
          } : {})
        })
        .eq('id', bookingId)
        .select()

      if (error) {
        throw error
      }

      // Clear related cache entries
      // Note: Using existing cache.clear() or individual cache invalidation
      // depending on cache implementation

      return { 
        success: true, 
        data: data[0],
        message: `Booking status updated to ${status}`
      }
    })()

    // Cache the promise to prevent duplicate requests
    pendingUpdates.set(requestKey, updatePromise)

    try {
      const result = await updatePromise
      // Clean up after completion
      pendingUpdates.delete(requestKey)
      return NextResponse.json(result)
    } catch (error: any) {
      // Clean up on error
      pendingUpdates.delete(requestKey)
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
