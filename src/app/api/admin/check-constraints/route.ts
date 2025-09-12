import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient()
    
    // Query to get constraint definition
    const { data, error } = await adminSupabase
      .rpc('sql', {
        query: `
          SELECT 
            constraint_name,
            check_clause
          FROM information_schema.check_constraints 
          WHERE constraint_name LIKE '%payment_status%' 
             OR constraint_name LIKE '%bookings%status%'
        `
      })
    
    if (error) {
      console.error('Error fetching constraints:', error)
      // Try alternative query
      const { data: altData, error: altError } = await adminSupabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'bookings')
        .eq('constraint_type', 'CHECK')
      
      return NextResponse.json({ 
        constraints: altData,
        error: error.message,
        alternativeMethod: true
      })
    }

    return NextResponse.json({ constraints: data })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch constraints' },
      { status: 500 }
    )
  }
}