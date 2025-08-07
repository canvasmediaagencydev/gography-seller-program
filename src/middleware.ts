import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile if user exists
  let userProfile = null
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    userProfile = data
  }

  const url = request.nextUrl.clone()

  // Block rejected users
  if (userProfile && userProfile.status === 'rejected') {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/auth/login?error=Account has been rejected', request.url))
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route))

  if (!user && !isPublicRoute && url.pathname !== '/') {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && userProfile) {
    // Redirect authenticated users away from auth pages
    if (isPublicRoute) {
      if (userProfile.role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Admin route protection
    if (url.pathname.startsWith('/dashboard/admin') && userProfile.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Seller report access control - only approved sellers can access
    if (url.pathname.includes('/reports') && userProfile.status !== 'approved') {
      return NextResponse.redirect(new URL('/dashboard?error=Reports access requires approval', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
