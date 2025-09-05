'use client'

import { createClient } from '@/lib/supabase/client'
import { uploadSellerFile, updateSellerFiles } from '@/lib/storage'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

export default function SellerVerificationPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  
  // File states
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  
  // Preview URLs
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  
  // File input refs
  const idCardInputRef = useRef<HTMLInputElement>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const documentsInputRef = useRef<HTMLInputElement>(null)
  
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
        .select('id, full_name, phone, role, status, referral_code, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
        setFullName(profile.full_name || '')
        setPhone(profile.phone || '')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Handle file selection
  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdCardFile(file)
      setError('')
      const previewUrl = URL.createObjectURL(file)
      setIdCardPreview(previewUrl)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileFile(file)
      setError('')
      const previewUrl = URL.createObjectURL(file)
      setProfilePreview(previewUrl)
    }
  }

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setDocumentFiles([...documentFiles, ...files])
    setError('')
    if (documentsInputRef.current) {
      documentsInputRef.current.value = ''
    }
  }

  const removeDocument = (indexToRemove: number) => {
    setDocumentFiles(documentFiles.filter((_, index) => index !== indexToRemove))
  }

  const removeIdCardFile = () => {
    if (idCardPreview) {
      URL.revokeObjectURL(idCardPreview)
      setIdCardPreview(null)
    }
    setIdCardFile(null)
  }

  const removeProfileFile = () => {
    if (profilePreview) {
      URL.revokeObjectURL(profilePreview)
      setProfilePreview(null)
    }
    setProfileFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUploadProgress('')

    try {
      if (!userProfile) {
        setError('ไม่พบข้อมูลผู้ใช้')
        return
      }

      // Validate required fields
      if (!fullName || !phone) {
        setError('กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์')
        return
      }

      if (!idCardFile) {
        setError('กรุณาอัปโหลดรูปบัตรประชาชน')
        return
      }

      const updates: any = {
        full_name: fullName,
        phone: phone,
      }

      // Upload ID card (required)
      setUploadProgress('กำลังอัปโหลดบัตรประชาชน...')
      const idCardResult = await uploadSellerFile(idCardFile, userProfile.id, 'id-card')
      updates.id_card_url = idCardResult.url
      updates.id_card_uploaded_at = new Date().toISOString()

      // Upload profile image (optional)
      if (profileFile) {
        setUploadProgress('กำลังอัปโหลดรูปโปรไฟล์...')
        const profileResult = await uploadSellerFile(profileFile, userProfile.id, 'profile')
        updates.avatar_url = profileResult.url
        updates.avatar_uploaded_at = new Date().toISOString()
      }

      // Upload documents (optional)
      const documentUrls: string[] = []
      if (documentFiles.length > 0) {
        setUploadProgress('กำลังอัปโหลดเอกสาร...')
        for (let i = 0; i < documentFiles.length; i++) {
          const docResult = await uploadSellerFile(
            documentFiles[i], 
            userProfile.id, 
            'documents',
            `document-${i + 1}-${Date.now()}.pdf`
          )
          documentUrls.push(docResult.url)
        }
        updates.documents_urls = documentUrls
        updates.document_uploaded_at = new Date().toISOString()
      }

      // Update user profile
      setUploadProgress('กำลังบันทึกข้อมูล...')
      await updateSellerFiles(userProfile.id, updates)

      // Success - redirect back to profile
      router.push('/dashboard/profile')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.push('/dashboard/profile')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900">ยืนยันตัวตน</h1>
            <p className="text-sm text-blue-600">เพื่อเริ่มต้นขายทริป</p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-14">
        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">ยืนยันตัวตนเพื่ความปลอดภัย</h3>
              <p className="text-blue-100 text-sm">เราต้องการข้อมูลเพื่อตรวจสอบประวัติและสร้างความเชื่อมั่น</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          </div>
        )}

        {uploadProgress && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="text-blue-700 text-sm font-medium">{uploadProgress}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              ข้อมูลส่วนตัว
            </h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all duration-200"
                  placeholder="กรอกชื่อ-นามสกุลตามบัตรประชาชน"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all duration-200"
                  placeholder="เบอร์โทรศัพท์สำหรับติดต่อ"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ID Card Upload */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 font-bold text-sm">2</span>
              </div>
              บัตรประชาชน <span className="text-red-500">*</span>
            </h4>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L12.732 4.5c-.77-.833-2.186-.833-2.956 0L2.857 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm text-amber-800 font-medium mb-1">เพื่อความปลอดภัยของลูกค้า</p>
                  <p className="text-xs text-amber-700">เราจะใช้ข้อมูลนี้ในการตรวจสอบประวัติอาชญากรรม</p>
                </div>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-red-200 rounded-xl bg-gray-50 p-6 hover:border-red-300 transition-all duration-300">
              {idCardFile ? (
                <div className="space-y-4">
                  <div className="mx-auto w-full max-w-sm h-56 border-2 border-red-200 rounded-xl overflow-hidden bg-gray-50 shadow-lg">
                    <img 
                      src={idCardPreview || ''} 
                      alt="ID Card Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-800">{idCardFile.name}</p>
                        <p className="text-xs text-green-600">อัปโหลดสำเร็จ</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeIdCardFile}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 p-2 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <label htmlFor="idCardFile" className="cursor-pointer">
                      <span className="inline-flex items-center px-6 py-4 border-2 border-red-300 text-base font-semibold rounded-xl text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 shadow-sm">
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        ถ่ายภาพบัตรประชาชน
                      </span>
                      <input
                        id="idCardFile"
                        name="idCardFile"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={loading}
                        ref={idCardInputRef}
                        onChange={handleIdCardChange}
                      />
                    </label>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2">คำแนะนำการถ่ายภาพ:</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• วางบัตรบนพื้นผิวเรียบ</p>
                      <p>• ถ่ายให้เห็นข้อมูลชัดเจน</p>
                      <p>• ไฟส่องสว่างพอ ไม่มีเงา</p>
                      <p>• รองรับไฟล์ JPG, PNG, WebP (ไม่เกิน 5MB)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Image Upload */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold text-sm">3</span>
              </div>
              รูปโปรไฟล์ 
              <span className="text-sm font-normal text-green-600 ml-2">(ไม่บังคับ)</span>
            </h4>
            
            <div className="border-2 border-dashed border-green-200 rounded-xl bg-gray-50 p-6 hover:border-green-300 transition-all duration-300">
              {profileFile ? (
                <div className="space-y-4">
                  <div className="mx-auto w-32 h-32 border-2 border-green-200 rounded-full overflow-hidden bg-gray-50 shadow-lg">
                    <img 
                      src={profilePreview || ''} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium text-green-800">{profileFile.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeProfileFile}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 p-2 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <label htmlFor="profileFile" className="cursor-pointer">
                      <span className="inline-flex items-center px-6 py-3 border-2 border-green-300 text-sm font-semibold rounded-xl text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        เลือกรูปโปรไฟล์
                      </span>
                      <input
                        id="profileFile"
                        name="profileFile"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={loading}
                        ref={profileInputRef}
                        onChange={handleProfileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    ใช้สำหรับแสดงในโปรไฟล์ Seller ของคุณ
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Documents Upload */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold text-sm">4</span>
              </div>
              เอกสารเพิ่มเติม 
              <span className="text-sm font-normal text-purple-600 ml-2">(ไม่บังคับ)</span>
            </h4>
            <p className="text-sm text-gray-500 mb-4">เช่น ประวัติการทำงาน ใบประกาศนียบัตร</p>
            
            {documentFiles.length > 0 && (
              <div className="mb-4 bg-purple-50 rounded-xl border border-purple-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    เอกสารที่เลือก ({documentFiles.length} ไฟล์)
                  </p>
                  <button
                    type="button"
                    onClick={() => setDocumentFiles([])}
                    disabled={loading}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors"
                  >
                    ลบทั้งหมด
                  </button>
                </div>
                
                <div className="space-y-2">
                  {documentFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-purple-150 rounded-xl">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        disabled={loading}
                        className="flex-shrink-0 text-red-600 hover:text-red-800 disabled:opacity-50 p-2 hover:bg-red-100 rounded-full transition-colors"
                        title="ลบไฟล์นี้"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-purple-200 rounded-xl bg-gray-50 p-6 hover:border-purple-300 transition-all duration-300">
              <div className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <label htmlFor="documentsFile" className="cursor-pointer">
                    <span className="inline-flex items-center px-6 py-3 border-2 border-purple-300 text-sm font-semibold rounded-xl text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {documentFiles.length > 0 ? 'เพิ่มเอกสาร' : 'อัปโหลดเอกสาร'}
                    </span>
                    <input
                      id="documentsFile"
                      name="documentsFile"
                      type="file"
                      className="sr-only"
                      accept="application/pdf"
                      multiple
                      disabled={loading}
                      ref={documentsInputRef}
                      onChange={handleDocumentsChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  รองรับไฟล์ PDF • ขนาดไม่เกิน 10MB ต่อไฟล์
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Fixed Bottom Button */}
      <div className="bg-white border-t border-gray-200 p-4 z-10">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังส่งข้อมูล...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              ส่งข้อมูลเพื่อยืนยันตัวตน
            </div>
          )}
        </button>
      </div>
    </div>
  )
}