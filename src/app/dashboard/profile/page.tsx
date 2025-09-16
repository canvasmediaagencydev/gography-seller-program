'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, UserCircleIcon, PhoneIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { BsShieldCheck, BsExclamationTriangle, BsClock, BsCheckCircle } from "react-icons/bs"
import Image from 'next/image'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
  id_card_url: string | null
  created_at: string | null
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, role, status, referral_code, avatar_url, id_card_url, created_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
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
        needsAction: true
      }
    }
    
    if (userProfile.status === 'pending') {
      return {
        status: 'pending',
        text: 'อยู่ระหว่างตรวจสอบ',
        subtext: 'รอการอนุมัติ',
        color: 'yellow',
        icon: BsClock,
        needsAction: false
      }
    }
    
    if (userProfile.status === 'approved') {
      return {
        status: 'approved',
        text: 'ยืนยันแล้ว',
        subtext: 'ข้อมูลถูกต้อง',
        color: 'green',
        icon: BsCheckCircle,
        needsAction: false
      }
    }
    
    return {
      status: 'not_approved',
      text: 'ยืนยันตัวตน',
      subtext: 'จำเป็นต้องอัปเดต',
      color: 'red',
      icon: BsExclamationTriangle,
      needsAction: true
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  const verificationInfo = getVerificationStatus()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b rounded-2xl border-gray-200">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.push('/dashboard/trips')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">โปรไฟล์</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4">
        {/* Profile Header */}
        <div className="bg-white rounded-xl p-6 mb-4 border border-gray-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
              {userProfile?.avatar_url ? (
                <Image
                  src={userProfile.avatar_url}
                  alt={userProfile.full_name || 'User'}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <UserCircleIcon className={`w-full h-full text-gray-400 ${userProfile?.avatar_url ? 'hidden' : ''}`} />
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {userProfile?.full_name || 'ไม่ระบุชื่อ'}
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                ID: {userProfile?.id ? userProfile.id.slice(-5) : 'ไม่มี'}
              </p>
              <p className="text-xs text-gray-400">
                สมัครเมื่อ: {userProfile?.created_at ? formatDate(userProfile.created_at) : 'ไม่ทราบ'}
              </p>
            </div>
          </div>

          {/* Verification Status */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${
            verificationInfo.color === 'red'
              ? 'bg-red-50 text-red-700 border-red-200'
              : verificationInfo.color === 'yellow'
              ? 'bg-yellow-50 text-primary-yellow border-secondary-yellow'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            <div className="relative">
              <verificationInfo.icon className="text-lg" />
              {verificationInfo.needsAction && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="font-semibold">{verificationInfo.text}</div>
              {verificationInfo.subtext && (
                <div className="text-xs opacity-75">{verificationInfo.subtext}</div>
              )}
            </div>

            {/* Status Indicator */}
            {verificationInfo.status === 'approved' ? (
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลส่วนตัว</h3>
          
          <div className="space-y-4">
            {/* Full Name */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <UserCircleIcon className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">ชื่อ-นามสกุล</p>
                <p className="text-gray-900">{userProfile?.full_name || 'ยังไม่กรอก'}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <PhoneIcon className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</p>
                <p className="text-gray-900">{userProfile?.phone || 'ยังไม่กรอก'}</p>
              </div>
            </div>

            {/* ID Card Status */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <IdentificationIcon className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">บัตรประชาชน</p>
                <p className="text-gray-900">
                  {userProfile?.id_card_url ? 'อัปโหลดแล้ว' : 'ยังไม่อัปโหลด'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {verificationInfo.needsAction && (
          <div className="mb-4">
            <button
              onClick={() => router.push('/dashboard/profile/seller-verification')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <BsExclamationTriangle className="w-5 h-5" />
              <span>ยืนยันตัวตนเพื่อเริ่มขาย</span>
            </button>
          </div>
        )}

        {/* Account Actions */}
        <div className="bg-white rounded-xl border border-gray-200 block md:hidden">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">การตั้งค่า</h3>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}