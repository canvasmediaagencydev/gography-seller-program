import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'seller'

export interface AuthRedirectPaths {
  admin: string
  seller: string
}

export const AUTH_REDIRECTS: AuthRedirectPaths = {
  admin: '/dashboard/admin/sellers',
  seller: '/dashboard/trips'
}

/**
 * Get redirect path based on user role
 */
export function getRedirectPath(role?: string): string {
  return role === 'admin' ? AUTH_REDIRECTS.admin : AUTH_REDIRECTS.seller
}

/**
 * Get user role from URL parameters
 */
export function getRoleFromParams(searchParams: URLSearchParams): UserRole {
  return searchParams.get('role') === 'admin' ? 'admin' : 'seller'
}

/**
 * Fetch user profile and return role
 */
export async function getUserRole(user: User): Promise<UserRole> {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return profile?.role === 'admin' ? 'admin' : 'seller'
}

/**
 * Create OAuth redirect URL with role and redirect path
 */
export function createOAuthRedirectURL(role: UserRole, currentDomain: string): string {
  const redirectPath = getRedirectPath(role)
  const baseUrl = currentDomain === 'app.paydee.me' || process.env.NEXT_PUBLIC_SITE_URL?.includes('app.paydee.me')
    ? 'https://app.paydee.me'
    : window.location.origin
    
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}&role=${role}`
}

/**
 * Handle authentication error with loading state reset
 */
export function handleAuthError(
  error: string,
  setError: (error: string) => void,
  setLoading: (loading: boolean) => void
): void {
  setError(error)
  setLoading(false)
}