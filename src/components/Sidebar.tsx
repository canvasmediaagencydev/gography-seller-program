'use client'

import React, { useState, useEffect } from 'react'
import { BsColumnsGap } from "react-icons/bs";
import { LuPlaneTakeoff } from "react-icons/lu";
import { TbUsers } from "react-icons/tb";
import { FaRegUserCircle } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { BsShieldCheck, BsExclamationTriangle, BsClock, BsCheckCircle } from "react-icons/bs";
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import SidebarButton from '@/components/ui/SidebarButton'
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

interface SidebarProps {
  className?: string
  initialProfile?: UserProfile
}

function Sidebar({ className, initialProfile }: SidebarProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile || null)
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Only fetch if we don't have initial profile
    if (!initialProfile) {
      fetchUserProfile()
    }
  }, [initialProfile])

  const fetchUserProfile = async () => {
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
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
    setLoading(false)
  }

  // Get verification status info
  const getVerificationStatus = () => {
    if (!userProfile) return { status: 'unknown', text: 'ยืนยันตัวตน', color: 'blue', icon: BsShieldCheck }
    
    // Check if basic info is filled
    const hasBasicInfo = userProfile.full_name && userProfile.phone
    
    if (!hasBasicInfo) {
      return {
        status: 'not_started',
        text: 'ยืนยันตัวตน',
        subtext: 'ต้องดำเนินการ',
        color: 'red',
        icon: BsExclamationTriangle,
        pulse: true
      }
    }
    
    if (userProfile.status === 'pending') {
      return {
        status: 'pending',
        text: 'แก้ไขข้อมูล',
        subtext: 'อยู่ระหว่างตรวจสอบ',
        color: 'yellow',
        icon: BsClock
      }
    }
    
    if (userProfile.status === 'approved') {
      return {
        status: 'approved',
        text: 'ยืนยันแล้ว',
        subtext: 'ข้อมูลถูกต้อง',
        color: 'green',
        icon: BsCheckCircle
      }
    }
    
    return {
      status: 'not_approved',
      text: 'ยืนยันตัวตน',
      subtext: 'จำเป็นต้องอัปเดต',
      color: 'red',
      icon: BsExclamationTriangle,
      pulse: true
    }
  }

  const verificationInfo = getVerificationStatus()

  // Active page detection
  const isActive = (path: string) => {
    if (path === '/dashboard/trips') {
      return pathname.includes('/dashboard/trips') || pathname === '/dashboard/trips'
    }
    if (path === '/dashboard/admin/trips') {
      return pathname.includes('/dashboard/admin/trips') && pathname !== '/dashboard/admin/trips/create'
    }
    if (path === '/dashboard/admin/bookings') {
      return pathname.includes('/dashboard/admin/bookings')
    }
    return pathname === path
  }

  return (
    <div className={`${className} hidden md:flex flex-col justify-between bg-white border-r border-gray-200 min-h-screen w-64`}>
      <div className="p-6 flex-1">
        {/* Logo */}
        <div className="mb-8 flex items-center flex-col">
          <h1 className="text-3xl font-bold text-orange-600">
            Logo
          </h1>
          <p className="text-lg text-gray-500">
            {userProfile?.role === 'admin' ? 'Admin Panel' : 'Seller Dashboard'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {userProfile?.role === 'admin' ? (
            // Admin Navigation
            <>
              <SidebarButton
                icon={<BsColumnsGap />}
                label="Dashboard"
                href="/dashboard/admin"
                isActive={isActive('/dashboard/admin')}
              />

              <SidebarButton
                icon={<TbUsers />}
                label="จัดการ Seller"
                href="/dashboard/admin/sellers"
                isActive={isActive('/dashboard/admin/sellers')}
              />

              <SidebarButton
                icon={<LuPlaneTakeoff />}
                label="จัดการ Trips"
                href="/dashboard/admin/trips"
                isActive={isActive('/dashboard/admin/trips')}
              />

              <SidebarButton
                icon={<TbUsers />}
                label="จัดการการจอง"
                href="/dashboard/admin/bookings"
                isActive={isActive('/dashboard/admin/bookings')}
              />
            </>
          ) : (
            // Seller Navigation
            <>
              <SidebarButton
                icon={<LuPlaneTakeoff />}
                label="ข้อมูล Trips"
                href="/dashboard/trips"
                isActive={isActive('/dashboard/trips')}
              />

              {userProfile?.status === 'approved' ? (
                <SidebarButton
                  icon={<TbUsers />}
                  label="รายงานยอดขาย"
                  href="/dashboard/reports"
                  isActive={isActive('/dashboard/reports')}
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
                  <span className="text-lg"><TbUsers /></span>
                  <span>รายงานยอดขาย (ต้องได้รับการอนุมัติ)</span>
                </div>
              )}

                 <SidebarButton
                icon={<BsColumnsGap />}
                label="Dashboard"
                href="/dashboard"
                isActive={isActive('/dashboard')}
              />


            </>
          )}
        </nav>
      </div>

      {/* Footer - User Info */}
      {/* Profile Verification Button */}
      {userProfile?.role !== 'admin' && (
        <div className="px-6 mb-6">
          <button
            onClick={() => {
              if (verificationInfo.status !== 'approved') {
                // Desktop sidebar: always use modal
                const event = new CustomEvent('openProfileModal')
                window.dispatchEvent(event)
              }
            }}
            disabled={verificationInfo.status === 'approved'}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium transition-all duration-300 relative ${
              verificationInfo.color === 'red'
                ? 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100'
                : verificationInfo.color === 'yellow'
                ? 'bg-yellow-50 text-yellow-700 border-2 border-yellow-200 hover:bg-yellow-100'
                : 'bg-green-50 text-green-700 border-2 border-green-200 cursor-default'
            } ${verificationInfo.pulse ? 'animate-pulse' : ''}`}
          >
            {/* Status Dot */}
            <div className="relative">
              <verificationInfo.icon className="text-lg" />
              {verificationInfo.status !== 'approved' && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  verificationInfo.color === 'red' ? 'bg-red-500' : 'bg-yellow-500'
                } ${verificationInfo.pulse ? 'animate-ping' : ''}`}></div>
              )}
            </div>
            
            <div className="flex-1 text-left">
              <div className="font-semibold">{verificationInfo.text}</div>
              {verificationInfo.subtext && (
                <div className="text-xs opacity-75">{verificationInfo.subtext}</div>
              )}
            </div>

            {/* Arrow or Status Indicator */}
            {verificationInfo.status === 'approved' ? (
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            ) : verificationInfo.status === 'pending' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      )}

      <div className="p-4 border-t border-gray-200">



        {userProfile?.role !== 'admin' && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.full_name || 'User'}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <FaRegUserCircle 
                className={`w-8 h-auto text-gray-400 ${userProfile?.avatar_url ? 'hidden' : ''}`} 
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {userProfile?.full_name || 'ไม่ระบุชื่อ'}
              </p>
              <p className="text-xs text-gray-500">
                ID: {userProfile?.referral_code || 'USERF11F'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <FiLogOut className="text-sm" />
          {loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
        </button>
      </div>

    </div>
  )
}

export default Sidebar
