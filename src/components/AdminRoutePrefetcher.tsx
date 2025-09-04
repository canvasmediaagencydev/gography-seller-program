'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminRoutePrefetcherProps {
  userRole?: string | null
}

// Prefetch admin routes for better performance
export default function AdminRoutePrefetcher({ userRole }: AdminRoutePrefetcherProps) {
  const router = useRouter()
  
  useEffect(() => {
    if (userRole === 'admin') {
      // Prefetch common admin routes
      const adminRoutes = [
        '/dashboard/admin',
        '/dashboard/admin/sellers', 
        '/dashboard/admin/trips',
        '/dashboard/admin/bookings'
      ]
      
      // Small delay to not block initial render
      const timeoutId = setTimeout(() => {
        adminRoutes.forEach(route => {
          router.prefetch(route)
        })
      }, 100)
      
      return () => clearTimeout(timeoutId)
    } else if (userRole === 'seller') {
      // Prefetch seller routes
      const sellerRoutes = [
        '/dashboard',
        '/dashboard/trips',
        '/dashboard/reports'
      ]
      
      const timeoutId = setTimeout(() => {
        sellerRoutes.forEach(route => {
          router.prefetch(route)
        })
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [userRole, router])
  
  return null
}