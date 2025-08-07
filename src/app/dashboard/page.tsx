'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import ProfileCompletionModal from '@/components/ProfileCompletionModal'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  commission_goal: number | null
  referral_code: string | null
}

export default function SellerDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tripsCount, setTripsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData)

        // Get trips count
        const { count } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })

        setTripsCount(count || 0)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

    const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }

    const statusText = {
      pending: 'รอการอนุมัติ',
      approved: 'อนุมัติแล้ว',
      rejected: 'ถูกปฏิเสธ'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-lg font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    )
  }

  const isProfileIncomplete = !profile?.full_name || !profile?.phone

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          สวัสดี, {profile?.full_name || 'User'}
            <p className="ml-4 inline">
              {profile.status && getStatusBadge(profile.status)}
            </p>
        </h1>
        <p className="text-gray-600">ยินดีต้อนรับสู่ Seller Dashboard</p>
      </div>

      {/* Profile Incomplete Alert */}
      {isProfileIncomplete && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                กรุณากรอกข้อมูลส่วนตัว
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  คุณยังไม่ได้กรอกข้อมูลส่วนตัวให้ครบถ้วน กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์
                </p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="bg-blue-100 px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-200 transition-colors"
                >
                  กรอกข้อมูลเลย
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Alert */}
      {profile?.status === 'pending' && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                บัญชีของคุณอยู่ในสถานะรอการอนุมัติ
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  คุณสามารถดูข้อมูล trips ได้ แต่ยังไม่สามารถเข้าถึงรายงานยอดขายได้ 
                  กรุณารอการอนุมัติจากผู้ดูแลระบบ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {profile?.status === 'approved' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                บัญชีของคุณได้รับการอนุมัติแล้ว
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  คุณสามารถใช้งานระบบได้เต็มรูปแบบ รวมถึงการดูรายงานยอดขาย
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">จำนวน Trips ทั้งหมด</dt>
                  <dd className="text-lg font-medium text-gray-900">{tripsCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">เป้าหมายคอมมิชชั่น</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ฿{profile?.commission_goal ? Number(profile.commission_goal).toLocaleString() : '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Referral Code</dt>
                  <dd className="text-lg font-medium text-gray-900">{profile?.referral_code || 'ไม่มี'}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={profile.id}
      />
    </div>
  )
}
