'use client'

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { LayoutGrid, PlaneTakeoff, Users, UserCircle, LogOut, ShieldCheck, AlertTriangle, Clock, CheckCircle, CoinsIcon, PlayCircle, Trophy, Sparkles, Gamepad2, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import SidebarButton from '@/components/ui/SidebarButton'
import SidebarButtonDisabled from '@/components/ui/SidebarButtonDisabled'
import { CoinBalanceIndicator } from '@/components/coins/CoinBalanceIndicator'
import { HowToSellVideoModal } from '@/components/HowToSellVideoModal'
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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, role, status, referral_code, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
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
      fetchUserProfile()
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)
    window.addEventListener('focus', handleProfileUpdate)

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
      window.removeEventListener('focus', handleProfileUpdate)
    }
  }, [fetchUserProfile])

  // Auto-refresh profile data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUserProfile()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchUserProfile])

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

  const isTripsActive = useMemo(() =>
    pathname.includes('/dashboard/trips') || pathname === '/dashboard/trips',
    [pathname]
  )

  const isReportsActive = useMemo(() =>
    pathname === '/dashboard/reports', [pathname]
  )

  const isRankActive = useMemo(() =>
    pathname === '/dashboard/rank', [pathname]
  )

  const isActivityActive = useMemo(() =>
    pathname === '/dashboard/activity', [pathname]
  )
  const isProfileActive = useMemo(() =>
    pathname === '/dashboard/profile', [pathname]
  )

  const isDashboardActive = useMemo(() =>
    pathname === '/dashboard', [pathname]
  )

  // Seller navigation items
  const navigationItems: NavigationItem[] = useMemo(() => {
    const items: NavigationItem[] = [
      {
        icon: <LayoutGrid size={18} />,
        label: 'Dashboard',
        href: '/dashboard',
        isActive: isDashboardActive
      },
      {
        icon: <PlaneTakeoff size={18} />,
        label: 'ทริป',
        href: '/dashboard/trips',
        isActive: isTripsActive
      }
    ]

    // Reports - only accessible to approved sellers
    if (userProfile?.status === 'approved') {
      items.push({
        icon: <Users size={18} />,
        label: 'รายงาน',
        href: '/dashboard/reports',
        isActive: isReportsActive,
        isDisabled: false
      })
    } else {
      items.push({
        icon: <Users size={18} />,
        label: 'รายงาน',
        href: '/dashboard/reports',
        isActive: false,
        isDisabled: true,
        disabledText: 'ยืนยันตัวเพื่อใช้งาน'
      })
    }

    // Leaderboard + Activity — sellers only
    if (userProfile?.role !== 'admin') {
      items.push({
        icon: <Trophy size={18} />,
        label: 'อันดับ',
        href: '/dashboard/rank',
        isActive: isRankActive,
        isDisabled: false
      })
      items.push({
        icon: <Sparkles size={18} />,
        label: 'กิจกรรม',
        href: '/dashboard/activity',
        isActive: isActivityActive,
        isDisabled: false
      })
    }

    return items
  }, [userProfile?.role, userProfile?.status, pathname, isDashboardActive, isTripsActive, isReportsActive, isRankActive, isActivityActive])

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
          <a
            href="/dashboard"
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
              <p className="text-xl text-gray-600 truncate">Seller Dashboard</p>
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
            {verificationInfo.pulse && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {userProfile.full_name || 'ยังไม่ได้ระบุชื่อ'}
            </h3>
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
          </div>
        </div>
      </div>

      {/* Coin Balance Indicator */}
      <div className="px-6 pt-4">
        <CoinBalanceIndicator userId={userProfile.id} variant="sidebar" />
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

        {/* How to Sell Video Button - Only for approved sellers */}
        {userProfile?.status === 'approved' && (
          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-lg font-medium transition-all duration-75 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <PlayCircle size={18} />
            <span className="text-left">วิธีการขาย</span>
          </button>
        )}
      </nav>

      {/* Profile and Logout */}
      <div className="p-6 border-t border-gray-100 space-y-2">
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

      {/* Video Modal */}
      <HowToSellVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  )
})

export default Sidebar
