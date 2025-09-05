'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
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

// Get verification status info
const getVerificationStatus = (userProfile: UserProfile | null) => {
  if (!userProfile) return { status: 'unknown', needsAction: false }
  
  const hasBasicInfo = userProfile.full_name && userProfile.phone
  
  if (!hasBasicInfo || userProfile.status !== 'approved') {
    return { status: 'needs_verification', needsAction: true }
  }
  
  return { status: 'approved', needsAction: false }
}

interface MobileBottomNavProps {
  userProfile: UserProfile | null
}

export default function MobileBottomNav({ userProfile }: MobileBottomNavProps) {
  const pathname = usePathname()

  // Don't show for admin users
  if (userProfile?.role === 'admin') {
    return null
  }

  const verificationInfo = getVerificationStatus(userProfile)

  const navItems = [
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
      href: '#',
      active: false,
      isProfile: true,
      needsAction: verificationInfo.needsAction
    }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item, index) => {
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
                className={`flex flex-col items-center justify-center transition-colors ${
                  item.needsAction 
                    ? 'text-red-600 hover:text-red-700' 
                    : 'text-gray-600 hover:text-orange-600'
                }`}
                onClick={() => {
                  // This will be handled by parent component
                  const event = new CustomEvent('openProfileModal')
                  window.dispatchEvent(event)
                }}
              >
                {item.icon}
                <span className={`text-xs mt-1 font-medium ${
                  item.needsAction ? 'font-bold' : ''
                }`}>{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-colors ${
                item.active
                  ? 'text-orange-600'
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}