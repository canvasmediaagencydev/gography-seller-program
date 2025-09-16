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
  const [currentProfile, setCurrentProfile] = useState(initialProfile)
  
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

    const handleProfileUpdate = () => {
      console.log('DashboardLayout: Profile updated, refreshing layout...')
      // Force a page refresh to get the latest data from server
      setTimeout(() => {
        window.location.reload()
      }, 1000) // Wait 1 second for database to update
    }

    window.addEventListener('openProfileModal', handleOpenProfileModal)
    window.addEventListener('profileUpdated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('openProfileModal', handleOpenProfileModal)
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar initialProfile={currentProfile} />

      {/* Main Content */}
      <main className="flex-1 w-full md:py-6  md:px-6 lg:px-8 overflow-y-hidden md:overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userProfile={currentProfile} />

      {/* Profile Completion Modal - Desktop Only */}
      <div className="hidden md:block">
        <ProfileCompletionModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false)
            // Force page refresh to update profile data
            window.location.reload()
          }}
          userId={currentProfile.id}
        />
      </div>
    </div>
  )
}