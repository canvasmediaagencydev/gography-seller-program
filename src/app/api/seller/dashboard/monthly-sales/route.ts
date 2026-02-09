import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'
import type { MonthlySalesResponse, ChartPeriod, THAI_MONTHS } from '@/types/dashboard'

const THAI_MONTH_NAMES = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6') as ChartPeriod

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cache key
    const cacheKey = `seller_monthly_sales_${user.id}_${months}`
    const cachedResult = apiCache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Calculate date range
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

    // Get bookings for the period
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('total_amount, commission_amount, created_at')
      .eq('seller_id', user.id)
      .eq('status', 'approved')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (bookingsError) {
      console.error('Monthly sales query error:', bookingsError)
      throw bookingsError
    }

    // Generate all months in the range
    const monthsData: { [key: string]: { sales: number; commission: number } } = {}

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthsData[key] = { sales: 0, commission: 0 }
    }

    // Aggregate bookings by month
    bookings?.forEach(booking => {
      const date = new Date(booking.created_at!)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthsData[key]) {
        monthsData[key].sales += booking.total_amount || 0
        monthsData[key].commission += booking.commission_amount || 0
      }
    })

    // Convert to array with Thai month labels
    const data = Object.entries(monthsData).map(([month, values]) => {
      const [year, monthNum] = month.split('-')
      const monthIndex = parseInt(monthNum) - 1
      const thaiMonth = THAI_MONTH_NAMES[monthIndex]

      return {
        month,
        monthLabel: `${thaiMonth} ${parseInt(year) + 543}`, // Convert to Buddhist year
        sales: values.sales,
        commission: values.commission
      }
    })

    const response: MonthlySalesResponse = { data }

    // Cache for 2 minutes
    apiCache.set(cacheKey, response, 120000)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Monthly sales API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
