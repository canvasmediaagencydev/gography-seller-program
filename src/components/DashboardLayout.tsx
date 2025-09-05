'use client'

import { useState, useEffect } from 'react'
import SidebarLazy from '@/components/SidebarLazy'
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
      setShowProfileModal(true)
    }

    window.addEventListener('openProfileModal', handleOpenProfileModal)
    return () => window.removeEventListener('openProfileModal', handleOpenProfileModal)
  }, [])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <SidebarLazy initialProfile={initialProfile} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userProfile={initialProfile} />

      {/* Profile Completion Modal */}
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
  )
}