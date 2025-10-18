import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('trip_id') || ''

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create cache key
    const cacheKey = `campaigns_${user.id}_${tripId}`

    // Check cache first
    const cachedResult = apiCache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Use the database function to get active campaigns
    const { data: campaigns, error } = await supabase
      .rpc('get_active_campaigns', {
        p_seller_id: user.id,
        p_trip_id: tripId || null
      })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    const result = {
      campaigns: campaigns || []
    }

    // Cache the result for 60 seconds
    apiCache.set(cacheKey, result, 60000)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in GET /api/coins/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
