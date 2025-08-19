import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '../../database.types'

interface TripWithRelations extends Tables<'trips'> {
    countries?: {
        name: string
        flag_emoji: string | null
    } | null
}

interface SellerData {
    id: string
    full_name: string | null
    referral_code: string | null
}

export function useBookingData(tripId: string | null, scheduleId: string | null, sellerRef?: string | null) {
    const [trip, setTrip] = useState<TripWithRelations | null>(null)
    const [schedule, setSchedule] = useState<Tables<'trip_schedules'> | null>(null)
    const [seller, setSeller] = useState<SellerData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Don't fetch if params are not ready
                if (!tripId || !scheduleId) {
                    return
                }

                setLoading(true)
                setError(null)

                console.log('🔍 Debug Info:')
                console.log('tripId:', tripId)
                console.log('scheduleId:', scheduleId) 
                console.log('sellerRef:', sellerRef)

                // Fetch trip data
                const { data: tripData, error: tripError } = await supabase
                    .from('trips')
                    .select(`
                        *,
                        countries (
                            name,
                            flag_emoji
                        )
                    `)
                    .eq('id', tripId)
                    .eq('is_active', true)
                    .single()

                if (tripError) throw new Error('ไม่พบข้อมูลทริป')

                // Fetch schedule data
                const { data: scheduleData, error: scheduleError } = await supabase
                    .from('trip_schedules')
                    .select('*')
                    .eq('id', scheduleId)
                    .eq('is_active', true)
                    .single()

                if (scheduleError) throw new Error('ไม่พบข้อมูลตารางทริป')

                // Fetch seller data if ref provided
                if (sellerRef) {
                    console.log('🔎 กำลังหา seller ด้วย referral code:', sellerRef)
                    
                    const { data: sellerData, error: sellerError } = await supabase
                        .from('user_profiles')
                        .select('id, full_name, referral_code, role, status')
                        .eq('referral_code', sellerRef)
                        .eq('role', 'seller')
                        .eq('status', 'approved')
                        .single()

                    console.log('👤 Seller data:', sellerData)
                    console.log('❌ Seller error:', sellerError)

                    setSeller(sellerData)
                } else {
                    console.log('⚠️ ไม่มี sellerRef ใน URL')
                }

                setTrip(tripData)
                setSchedule(scheduleData)
            } catch (err: any) {
                console.error('💥 Error:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [tripId, scheduleId, sellerRef])

    return {
        trip,
        schedule,
        seller,
        loading,
        error
    }
}
