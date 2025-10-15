'use client'

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { LayoutGrid, PlaneTakeoff, Users, UserCircle, LogOut, ShieldCheck, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import SidebarButton from '@/components/ui/SidebarButton'
import SidebarButtonDisabled from '@/components/ui/SidebarButtonDisabled'
import Image from 'next/image'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface NavigationItem {
  icon: React.ReactElement
  label: string
  href: string
  isActive: boolean
  isDisabled?: boolean
  disabledText?: string
}

interface SidebarProps {
  className?: string
  initialProfile?: UserProfile
}

// Memoized verification status function outside component to prevent recreation
const getVerificationStatus = (userProfile: UserProfile | null) => {
  if (!userProfile) return { status: 'unknown', text: 'ยืนยันตัวตน', color: 'blue', icon: ShieldCheck }

  const hasBasicInfo = userProfile.full_name && userProfile.phone

  if (!hasBasicInfo) {
    return {
      status: 'not_started',
      text: 'ยืนยันตัวตน',
      subtext: 'ต้องดำเนินการ',
      color: 'red',
      icon: AlertTriangle,
      pulse: true
    }
  }

  if (userProfile.status === 'pending') {
    return {
      status: 'pending',
      text: 'แก้ไขข้อมูล',
      subtext: 'อยู่ระหว่างตรวจสอบ',
      color: 'yellow',
      icon: Clock
    }
  }

  if (userProfile.status === 'approved') {
    return {
      status: 'verified',
      text: 'โปรไฟล์',
      subtext: 'ยืนยันแล้ว',
      color: 'green',
      icon: CheckCircle
    }
  }

  if (userProfile.status === 'rejected') {
    return {
      status: 'rejected',
      text: 'ถูกปฏิเสธ',
      subtext: 'ส่งข้อมูลใหม่',
      color: 'red',
      icon: AlertTriangle,
      pulse: true
    }
  }

  // Default case for any other status (null, undefined, or unknown values)
  return {
    status: 'needs_verification',
    text: 'ยืนยันตัวตน',
    subtext: 'ต้องดำเนินการ',
    color: 'red',
    icon: AlertTriangle,
    pulse: true
  }
}

const Sidebar = memo(function Sidebar({ className, initialProfile }: SidebarProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile || null)
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Force fresh data by adding cache-busting timestamp
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, role, status, referral_code, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        console.log('Profile data refreshed:', profile)
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }, [supabase])

  useEffect(() => {
    // Only fetch if we don't have initial profile
    if (!initialProfile) {
      fetchUserProfile()
    }
  }, [initialProfile, fetchUserProfile])

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('Profile updated, refreshing sidebar data...')
      fetchUserProfile()
    }

    // Listen for custom profile update events
    window.addEventListener('profileUpdated', handleProfileUpdate)
    
    // Also listen for focus events to refresh data
    window.addEventListener('focus', handleProfileUpdate)

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
      window.removeEventListener('focus', handleProfileUpdate)
    }
  }, [fetchUserProfile])

  // Auto-refresh profile data every 30 seconds for sellers
  useEffect(() => {
    if (userProfile?.role === 'seller') {
      const interval = setInterval(() => {
        fetchUserProfile()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [userProfile?.role, fetchUserProfile])

  const handleLogout = useCallback(async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
    setLoading(false)
  }, [supabase, router])

  // Memoize verification status to prevent recalculation
  const verificationInfo = useMemo(() => 
    getVerificationStatus(userProfile), 
    [userProfile?.full_name, userProfile?.phone, userProfile?.status]
  )

  // Memoize active route checks for better performance
  const isTripsActive = useMemo(() => {
    if (userProfile?.role === 'admin') {
      return pathname.includes('/dashboard/admin/trips') && pathname !== '/dashboard/admin/trips/create'
    }
    return pathname.includes('/dashboard/trips') || pathname === '/dashboard/trips'
  }, [pathname, userProfile?.role])

  const isReportsActive = useMemo(() => 
    pathname === '/dashboard/reports', [pathname]
  )

  const isProfileActive = useMemo(() => 
    pathname === '/dashboard/profile', [pathname]
  )

  const isDashboardActive = useMemo(() => {
    if (userProfile?.role === 'admin') {
      return pathname === '/dashboard/admin'
    }
    return pathname === '/dashboard'
  }, [pathname, userProfile?.role])

  // Memoize navigation items
  const navigationItems: NavigationItem[] = useMemo(() => {
    const baseItems: NavigationItem[] = [
      {
        icon: <LayoutGrid size={18} />,
        label: 'Dashboard',
        href: userProfile?.role === 'admin' ? '/dashboard/admin' : '/dashboard',
        isActive: isDashboardActive
      },
      {
        icon: <PlaneTakeoff size={18} />,
        label: userProfile?.role === 'admin' ? 'จัดการทริป' : 'ทริป',
        href: userProfile?.role === 'admin' ? '/dashboard/admin/trips' : '/dashboard/trips',
        isActive: isTripsActive
      }
    ]

    // Add role-specific items
    if (userProfile?.role === 'admin') {
      baseItems.push(
        {
          icon: <Users size={18} />,
          label: 'ผู้ขาย',
          href: '/dashboard/admin/sellers',
          isActive: pathname === '/dashboard/admin/sellers'
        },
        {
          icon: <Users size={18} />,
          label: 'การจอง',
          href: '/dashboard/admin/bookings',
          isActive: pathname === '/dashboard/admin/bookings'
        },
        {
          icon: <Users size={18} />,
          label: 'ลูกค้า',
          href: '/dashboard/admin/customers',
          isActive: pathname === '/dashboard/admin/customers'
        }
      )
    } else {
      // For sellers, show reports or disabled reports based on verification status
      if (userProfile?.status === 'approved') {
        baseItems.push({
          icon: <Users size={18} />,
          label: 'รายงาน',
          href: '/dashboard/reports',
          isActive: isReportsActive,
          isDisabled: false
        })
      } else {
        baseItems.push({
          icon: <Users size={18} />,
          label: 'รายงาน',
          href: '/dashboard/reports',
          isActive: false,
          isDisabled: true,
          disabledText: 'ยืนยันตัวเพื่อใช้งาน'
        })
      }
    }

    return baseItems
  }, [userProfile?.role, userProfile?.status, pathname, isDashboardActive, isTripsActive, isReportsActive])

  if (!userProfile) {
    return (
      <div className={`hidden md:flex h-screen w-80 bg-white shadow-lg flex-col ${className || ''}`}>
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`hidden md:flex fixed left-0 top-0 h-screen w-80 bg-white shadow-lg flex-col z-20 ${className || ''}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {/* logo img svg */}
          <a
            href={userProfile.role === 'admin' ? '/dashboard/admin' : '/dashboard'}
            className="flex items-center gap-3 group"
          >
            <Image
              src="/images/paydeeLOGO.svg"
              alt="Paydee"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xl text-gray-600 truncate">
                {userProfile.role === 'admin' ? 'Admin Panel' : 'Seller Dashboard'}
              </p>
            </div>
          </a>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {userProfile.avatar_url ? (
              <Image
                src={userProfile.avatar_url}
                alt="Avatar"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-gray-500" />
              </div>
            )}
            {/* Show verification indicator only for sellers */}
            {userProfile.role !== 'admin' && verificationInfo.pulse && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {userProfile.role === 'admin' 
                ? (userProfile.full_name || 'Admin User')
                : (userProfile.full_name || 'ยังไม่ได้ระบุชื่อ')
              }
            </h3>
            {/* Show verification status only for sellers */}
            {userProfile.role !== 'admin' && (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <verificationInfo.icon 
                    className={`w-3 h-3 ${
                      verificationInfo.color === 'green' ? 'text-green-500' :
                      verificationInfo.color === 'yellow' ? 'text-primary-yellow' :
                      verificationInfo.color === 'red' ? 'text-red-500' :
                      'text-primary-blue'
                    }`} 
                  />
                  <p className={`text-xs ${
                    verificationInfo.color === 'green' ? 'text-green-600' :
                    verificationInfo.color === 'yellow' ? 'text-primary-yellow' :
                    verificationInfo.color === 'red' ? 'text-red-600' :
                    'text-primary-blue'
                  }`}>
                    {verificationInfo.subtext || verificationInfo.text}
                  </p>
                </div>
                {/* Show ID when seller is approved */}
                {userProfile.status === 'approved' && (
                  <p className="text-xs text-gray-500">
                    ID: {userProfile.id.slice(-5)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item, index) => (
          item.isDisabled ? (
            <SidebarButtonDisabled
              key={`nav-disabled-${item.href}-${index}`}
              icon={item.icon}
              label={item.label}
              disabledText={item.disabledText || 'ยืนยันตัวเพื่อใช้งาน'}
            />
          ) : (
            <SidebarButton
              key={`nav-${item.href}-${index}`}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={item.isActive}
              prefetch={true}
            />
          )
        ))}
      </nav>

      {/* Profile and Logout */}
      <div className="p-6 border-t border-gray-100 space-y-2">
        {/* Profile button - only show for sellers */}
        {userProfile.role !== 'admin' && (
          <SidebarButton
            icon={verificationInfo.pulse ? (
              <div className="relative">
                <UserCircle size={18} />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              </div>
            ) : (
              <UserCircle size={18} />
            )}
            label={verificationInfo.text}
            href="/dashboard/profile"
            isActive={isProfileActive}
            prefetch={true}
          />
        )}

        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-lg font-medium transition-all duration-75 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={18} />
          <span className="text-left">
            {loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
          </span>
        </button>
      </div>
    </div>
  )
})

export default Sidebar