'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import MobileBottomNav from '@/components/MobileBottomNav'
import ProfileCompletionModal from '@/components/ProfileCompletionModal'

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
      <main className="flex-1 w-full md:py-6 md:px-6 lg:px-8 md:overflow-y-auto">
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