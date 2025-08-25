'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import SellerDetailsModal from '@/components/SellerDetailsModal'
import { MdOutlineMail } from "react-icons/md";
import { IoCallOutline } from "react-icons/io5";
import { LuTag } from "react-icons/lu";

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: 'pending' | 'approved' | 'rejected' | null
  commission_goal: number | null
  referral_code: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string | null
  updated_at: string | null
  email: string | null // Email from auth.users via RPC
  id_card_url: string | null
  avatar_url: string | null
  document_url: string | null
  documents_urls: string[] | null
  id_card_uploaded_at: string | null
  avatar_uploaded_at: string | null
  document_uploaded_at: string | null
}

export default function SellersManagement() {
  const [sellers, setSellers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [error, setError] = useState('')
  
  // Modal states
  const [selectedSeller, setSelectedSeller] = useState<UserProfile | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSellers()
  }, [filter])

  const fetchSellers = async () => {
    try {
      setError('')
      
      // Use RPC function to get sellers with emails from auth.users
      const { data, error } = await supabase
        .rpc('get_sellers_with_emails')

      if (error) {
        console.error('RPC Error:', error)
        setError(`เกิดข้อผิดพลาด: ${error.message}`)
        return
      }

      // Filter by status if needed (data is array of sellers)
      let filteredData = data || []
      
      // Filter out admin users - show only sellers
      filteredData = filteredData.filter((user) => user.role === 'seller')
      
      if (filter !== 'all' && Array.isArray(filteredData)) {
        filteredData = filteredData.filter((seller) => seller.status === filter)
      }

      setSellers(filteredData as UserProfile[])
    } catch (err) {
      console.error('Fetch Error:', err)
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (sellerId: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(sellerId)
    setError('')

    try {
      // Check if seller has complete profile before approving
      if (newStatus === 'approved') {
        const seller = sellers.find(s => s.id === sellerId)
        if (!seller?.full_name || !seller?.phone) {
          setError('ไม่สามารถอนุมัติได้: Seller ยังกรอกข้อมูลไม่ครบถ้วน (ชื่อ-นามสกุล และเบอร์โทรศัพท์)')
          setActionLoading(null)
          return
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: newStatus,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', sellerId)

      if (error) {
        setError(error.message)
      } else {
        // Refresh the list
        await fetchSellers()
        
        // Show success message
        alert(`${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} seller สำเร็จ`)
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    } finally {
      setActionLoading(null)
    }
  }

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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    )
  }

  const openDetailsModal = (seller: UserProfile) => {
    setSelectedSeller(seller)
    setIsDetailsModalOpen(true)
  }

  const closeDetailsModal = () => {
    setSelectedSeller(null)
    setIsDetailsModalOpen(false)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการ Sellers</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'pending', label: 'รอการอนุมัติ' },
            { key: 'approved', label: 'อนุมัติแล้ว' },
            { key: 'rejected', label: 'ถูกปฏิเสธ' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Sellers table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {sellers.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {sellers.map((seller) => {
              const isProfileComplete = seller.full_name && seller.phone
              const canApprove = isProfileComplete && seller.status === 'pending'
              
              return (
              <li key={seller.id}>
                <div className={`px-4 py-4 sm:px-6 ${!isProfileComplete ? 'bg-gray-50 border-l-4 border-orange-400' : ''}`}>
                  {!isProfileComplete && (
                    <div className="mb-3 flex items-center">
                      <svg className="h-5 w-5 text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-orange-800 font-medium">
                        ข้อมูลไม่ครบถ้วน - ไม่สามารถอนุมัติได้
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className={`text-sm font-medium truncate ${isProfileComplete ? 'text-blue-600' : 'text-gray-500'}`}>
                          {seller.full_name || 'ยังไม่กรอกชื่อ'}
                        </p>
                        <div className="ml-4">
                          {seller.status && getStatusBadge(seller.status)}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                        <div className={`flex items-center text-sm ${seller.email ? 'text-gray-500' : 'text-orange-600'}`}>
                         <MdOutlineMail className='mr-2 text-xl text-gray-400'/>
                          {seller.email || 'ไม่มีอีเมล'}
                        </div>
                        <div className={`flex items-center text-sm ${seller.phone ? 'text-gray-500' : 'text-orange-600'}`}>
                          <IoCallOutline className='mr-2 text-xl text-gray-400'/>
                          {seller.phone || 'ยังไม่กรอกเบอร์โทร'}
                        </div>
                        {seller.referral_code && (
                          <div className="flex items-center text-sm text-gray-500">
                            <LuTag className='mr-2 text-xl text-gray-400'/>
                            Referral: {seller.referral_code}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        สมัครเมื่อ: {seller.created_at ? new Date(seller.created_at).toLocaleDateString('th-TH') : 'ไม่มีข้อมูล'}
                        {seller.approved_at && (
                          <span className="ml-4">
                            {seller.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}เมื่อ: {new Date(seller.approved_at).toLocaleDateString('th-TH')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex space-x-2">
                      {/* Details button - always visible */}
                      <button
                        onClick={() => openDetailsModal(seller)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        ดูรายละเอียด
                      </button>

                      {seller.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(seller.id, 'approved')}
                            disabled={!canApprove || actionLoading === seller.id}
                            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              canApprove 
                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`}
                            title={!canApprove ? 'ต้องกรอกข้อมูลครบก่อนอนุมัติ' : 'อนุมัติ seller'}
                          >
                            {actionLoading === seller.id ? (
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleStatusChange(seller.id, 'rejected')}
                            disabled={actionLoading === seller.id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === seller.id ? (
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            ปฏิเสธ
                          </button>
                        </>
                      )}
                      {seller.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(seller.id, 'rejected')}
                          disabled={actionLoading === seller.id}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ปฏิเสธ
                        </button>
                      )}
                      {seller.status === 'rejected' && (
                        <button
                          onClick={() => handleStatusChange(seller.id, 'approved')}
                          disabled={!canApprove || actionLoading === seller.id}
                          className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                            canApprove 
                              ? 'text-gray-700 bg-white hover:bg-gray-50'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          อนุมัติ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มี Seller</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'ยังไม่มี seller ที่สมัครสมาชิก' : `ไม่มี seller ที่มีสถานะ ${filter}`}
            </p>
          </div>
        )}
      </div>

      {/* Seller Details Modal */}
      <SellerDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        seller={selectedSeller}
      />
    </div>
  )
}
