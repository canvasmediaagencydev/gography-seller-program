'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { handleAuthError, getRedirectPath, getUserRole, type UserRole } from '@/lib/auth'

interface UseAuthFormReturn {
  loading: boolean
  error: string
  isRedirecting: boolean
  setError: (error: string) => void
  handleEmailAuth: (email: string, password: string, isLogin?: boolean, role?: UserRole) => Promise<void>
  handleGoogleAuth: (role?: UserRole) => Promise<void>
}

export function useAuthForm(): UseAuthFormReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleEmailAuth = async (
    email: string, 
    password: string, 
    isLogin = false, 
    role: UserRole = 'seller'
  ): Promise<void> => {
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        // Login flow
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          handleAuthError(authError.message, setError, setLoading)
          return
        }

        // Get user role and redirect
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const userRole = await getUserRole(user)
          setIsRedirecting(true)
          router.push(getRedirectPath(userRole))
        }
      } else {
        // Registration flow
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) {
          handleAuthError(authError.message, setError, setLoading)
          return
        }

        if (authData.user) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              role,
              status: 'pending'
            })

          if (profileError) {
            handleAuthError('Failed to create user profile: ' + profileError.message, setError, setLoading)
            return
          }

          setIsRedirecting(true)
          router.push(getRedirectPath(role))
        }
      }
    } catch (err) {
      handleAuthError('An unexpected error occurred', setError, setLoading)
    }
  }

  const handleGoogleAuth = async (role: UserRole = 'seller'): Promise<void> => {
    setLoading(true)
    setError('')

    try {
      const currentDomain = window.location.hostname
      const redirectPath = getRedirectPath(role)
      
      let redirectUrl
      if (currentDomain === 'app.paydee.me' || process.env.NEXT_PUBLIC_SITE_URL?.includes('app.paydee.me')) {
        redirectUrl = `https://app.paydee.me/auth/callback?next=${encodeURIComponent(redirectPath)}&role=${role}`
      } else {
        redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}&role=${role}`
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })

      if (error) {
        handleAuthError(error.message, setError, setLoading)
      }
    } catch (err) {
      handleAuthError('An unexpected error occurred', setError, setLoading)
    }
  }

  return {
    loading,
    error,
    isRedirecting,
    setError,
    handleEmailAuth,
    handleGoogleAuth
  }
}