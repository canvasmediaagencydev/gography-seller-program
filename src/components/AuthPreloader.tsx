'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Preload Supabase client and common resources
export default function AuthPreloader() {
  useEffect(() => {
    // Pre-initialize Supabase client
    const supabase = createClient()
    
    // Preload dashboard route
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = '/dashboard'
      document.head.appendChild(link)
      
      // Preload common auth methods
      supabase.auth.getSession()
    }
  }, [])
  
  return null
}