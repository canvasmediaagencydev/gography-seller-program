'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import MobileBottomNav from '@/components/MobileBottomNav'
import ProfileCompletionModal from '@/components/ProfileCompletionModal'
import { useBackgroundSync } from '@/hooks/useBackgroundSync'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface DashboardLayoutProps {
  children: React.ReactNode
  initialProfile: UserProfile
}

export default function DashboardLayout({ children, initialProfile }: DashboardLayoutProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  // Enable background sync for sellers to detect admin updates
  useBackgroundSync({ 
    enabled: true,
    interval: 30000, // เช็คทุก 30 วินาที
    userRole: initialProfile?.role 
  })

  useEffect(() => {
    const handleOpenProfileModal = () => {
      // Modal will only show on desktop due to CSS classes
      setShowProfileModal(true)
    }

    window.addEventListener('openProfileModal', handleOpenProfileModal)
    return () => window.removeEventListener('openProfileModal', handleOpenProfileModal)
  }, [])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <Sidebar initialProfile={initialProfile} />

      {/* Main Content */}
      <main className="flex-1 w-full md:py-6 md:px-6 lg:px-8 overflow-y-auto mobile-content-padding">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userProfile={initialProfile} />

      {/* Profile Completion Modal - Desktop Only */}
      <div className="hidden md:block">
        <ProfileCompletionModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false)
            // Force page refresh to update profile data
            window.location.reload()
          }}
          userId={initialProfile.id}
        />
      </div>
    </div>
  )
}