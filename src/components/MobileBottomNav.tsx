'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { memo, useCallback, useMemo, useTransition } from 'react'
import { BsColumnsGap } from "react-icons/bs"
import { LuPlaneTakeoff } from "react-icons/lu"
import { TbUsers } from "react-icons/tb"
import { FaRegUserCircle } from "react-icons/fa"

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

// Get verification status info (memoized function outside component)
const getVerificationStatus = (userProfile: UserProfile | null) => {
  if (!userProfile) return { status: 'unknown', needsAction: false }
  
  const hasBasicInfo = userProfile.full_name && userProfile.phone
  
  if (!hasBasicInfo || userProfile.status !== 'approved') {
    return { status: 'needs_verification', needsAction: true }
  }
  
  return { status: 'approved', needsAction: false }
}

// Memoized navigation button component
const NavButton = memo(function NavButton({ 
  item, 
  index, 
  onNavigate 
}: { 
  item: any
  index: number 
  onNavigate: (href: string) => void 
}) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onNavigate(item.href)
  }, [item.href, onNavigate])

  if (item.disabled) {
    return (
      <div
        key={index}
        className="flex flex-col items-center justify-center text-gray-300 cursor-not-allowed"
      >
        {item.icon}
        <span className="text-xs mt-1 font-medium">{item.label}</span>
      </div>
    )
  }

  if (item.isProfile) {
    return (
      <button
        key={index}
        onClick={handleClick}
        className={`flex flex-col items-center justify-center transition-colors ${
          item.active
            ? 'text-orange-600'
            : item.needsAction 
            ? 'text-red-600 hover:text-red-700' 
            : 'text-gray-600 hover:text-orange-600'
        }`}
      >
        {item.icon}
        <span className={`text-xs mt-1 font-medium ${
          item.needsAction ? 'font-bold' : ''
        }`}>{item.label}</span>
      </button>
    )
  }

  return (
    <button
      key={index}
      onClick={handleClick}
      className={`flex flex-col items-center justify-center transition-colors ${
        item.active
          ? 'text-orange-600'
          : 'text-gray-600 hover:text-orange-600'
      }`}
    >
      {item.icon}
      <span className="text-xs mt-1 font-medium">{item.label}</span>
    </button>
  )
})

interface MobileBottomNavProps {
  userProfile: UserProfile | null
}

const MobileBottomNav = memo(function MobileBottomNav({ userProfile }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Don't show for admin users
  if (userProfile?.role === 'admin') {
    return null
  }

  // Memoize verification info to prevent recalculation
  const verificationInfo = useMemo(() => 
    getVerificationStatus(userProfile), 
    [userProfile?.full_name, userProfile?.phone, userProfile?.status]
  )

  // Fast navigation with startTransition
  const handleNavigate = useCallback((href: string) => {
    if (pathname === href) return // Don't navigate if already on page
    
    startTransition(() => {
      router.push(href)
    })
  }, [pathname, router])

  // Memoize navigation items to prevent recreation on every render
  const navItems = useMemo(() => [
    {
      icon: <BsColumnsGap className="w-5 h-5" />,
      label: 'Dashboard',
      href: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      icon: <LuPlaneTakeoff className="w-5 h-5" />,
      label: 'Trips',
      href: '/dashboard/trips',
      active: pathname.includes('/dashboard/trips')
    },
    {
      icon: <TbUsers className="w-5 h-5" />,
      label: 'รายงาน',
      href: '/dashboard/reports',
      active: pathname === '/dashboard/reports',
      disabled: userProfile?.status !== 'approved'
    },
    {
      icon: verificationInfo.needsAction ? (
        <div className="relative">
          <FaRegUserCircle className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
        </div>
      ) : (
        <FaRegUserCircle className="w-5 h-5" />
      ),
      label: verificationInfo.needsAction ? 'ยืนยันตัวตน' : 'โปรไฟล์',
      href: '/dashboard/profile',
      active: pathname === '/dashboard/profile',
      isProfile: true,
      needsAction: verificationInfo.needsAction
    }
  ], [pathname, userProfile?.status, verificationInfo.needsAction])

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom`}>
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item, index) => (
          <NavButton 
            key={`nav-${index}-${item.href}`}
            item={item} 
            index={index} 
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </div>
  )
})

export default MobileBottomNav