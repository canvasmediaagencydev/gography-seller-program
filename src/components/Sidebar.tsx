'use client'

import React, { useState, useEffect } from 'react'
import { BsColumnsGap } from "react-icons/bs";
import { LuPlaneTakeoff } from "react-icons/lu";
import { TbUsers } from "react-icons/tb";
import { FaRegUserCircle } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import SidebarButton from '@/components/ui/SidebarButton'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
}

interface SidebarProps {
  className?: string
}

function Sidebar({ className }: SidebarProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
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
    <div className={`${className} flex flex-col justify-between bg-white border-r border-gray-200 min-h-screen w-64`}>
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
              
              <SidebarButton
                icon={<BsColumnsGap />}
                label="Dashboard"
                href="/dashboard"
                isActive={isActive('/dashboard')}
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
            </>
          )}
        </nav>
      </div>

      {/* Footer - User Info */}
      <div className="p-4 border-t border-gray-200">
        {userProfile?.role !== 'admin' && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10  rounded-full flex items-center justify-center">
              <FaRegUserCircle className="w-8 h-auto text-gray-400" />
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
