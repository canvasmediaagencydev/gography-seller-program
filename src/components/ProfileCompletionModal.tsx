'use client'

import { createClient } from '@/lib/supabase/client'
import { uploadSellerFile, updateSellerFiles } from '@/lib/storage'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function ProfileCompletionModal({ isOpen, onClose, userId }: ProfileCompletionModalProps) {
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

  // Handle file selection
  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdCardFile(file)
      setError('')
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setIdCardPreview(previewUrl)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileFile(file)
      setError('')
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setProfilePreview(previewUrl)
    }
  }

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    // เพิ่มไฟล์ใหม่เข้ากับไฟล์เดิม
    setDocumentFiles([...documentFiles, ...files])
    setError('')
    // Reset input เพื่อให้เลือกไฟล์เดิมได้อีก
    if (documentsInputRef.current) {
      documentsInputRef.current.value = ''
    }
  }

  const removeDocument = (indexToRemove: number) => {
    setDocumentFiles(documentFiles.filter((_, index) => index !== indexToRemove))
  }

  // Clean up preview URLs when component unmounts or files change
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
      const idCardResult = await uploadSellerFile(idCardFile, userId, 'id-card')
      updates.id_card_url = idCardResult.url
      updates.id_card_uploaded_at = new Date().toISOString()

      // Upload profile image (optional)
      if (profileFile) {
        setUploadProgress('กำลังอัปโหลดรูปโปรไฟล์...')
        const profileResult = await uploadSellerFile(profileFile, userId, 'profile')
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
            userId, 
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
      await updateSellerFiles(userId, updates)

      // Success
      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto border border-gray-200">
        <div className="flex justify-between items-center p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              กรอกข้อมูลส่วนตัว
            </h3>
            <p className="text-blue-600 text-sm mt-1">
              เพิ่มข้อมูลเพื่อเริ่มต้นเป็น Seller
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-2 hover:bg-white/50 rounded-full transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          <p className="text-gray-600 mb-8 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <svg className="inline w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            กรุณากรอกข้อมูลเพื่อให้เราสามารถติดต่อและตรวจสอบข้อมูลของคุณได้
          </p>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-red-700 text-sm">
                {error}
              </div>
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
              <div className="text-blue-700 text-sm font-medium">
                {uploadProgress}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              ข้อมูลส่วนตัว
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all duration-200"
                  placeholder="กรอกชื่อ-นามสกุลของคุณ"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                  เบอร์โทรศัพท์ *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all duration-200"
                  placeholder="กรอกเบอร์โทรศัพท์ของคุณ"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ID Card Upload */}
          <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 118 0v2m-4 0a2 2 0 104 0m-4 0a2 2 0 014 0z" />
              </svg>
              รูปบัตรประชาชน *
            </h4>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-amber-800 flex items-center">
                <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L12.732 4.5c-.77-.833-2.186-.833-2.956 0L2.857 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                สำหรับใช้ในการตรวจสอบประวัติอาชญากรรม เพื่อความปลอดภัยของลูกค้า
              </p>
            </div>
            
            <div className="border-3 border-dashed border-red-200 rounded-2xl bg-white p-8 hover:border-red-300 hover:bg-red-25 transition-all duration-300">
              <div className="space-y-4 text-center">
                {idCardFile ? (
                  <div className="space-y-4">
                    {/* Preview Image */}
                    <div className="mx-auto w-64 h-40 border-2 border-red-200 rounded-xl overflow-hidden bg-gray-50 shadow-lg">
                      <img 
                        src={idCardPreview || ''} 
                        alt="ID Card Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-center space-x-3 bg-green-50 border border-green-200 rounded-xl p-3">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">{idCardFile.name}</span>
                      <button
                        type="button"
                        onClick={removeIdCardFile}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="idCardFile" className="cursor-pointer">
                        <span className="inline-flex items-center px-6 py-3 border-2 border-red-300 text-sm font-semibold rounded-xl text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          อัปโหลดรูปบัตรประชาชน
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
                    <p className="text-sm text-gray-500">
                      รองรับไฟล์ PNG, JPG, WebP • ขนาดไม่เกิน 5MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile Image Upload */}
          <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              รูปโปรไฟล์ 
              <span className="text-sm font-normal text-green-600 ml-2">(ไม่บังคับ)</span>
            </h4>
            
            <div className="border-3 border-dashed border-green-200 rounded-2xl bg-white p-8 hover:border-green-300 hover:bg-green-25 transition-all duration-300">
              <div className="space-y-4 text-center">
                {profileFile ? (
                  <div className="space-y-4">
                    {/* Preview Image */}
                    <div className="mx-auto w-32 h-32 border-2 border-green-200 rounded-full overflow-hidden bg-gray-50 shadow-lg">
                      <img 
                        src={profilePreview || ''} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-center space-x-3 bg-green-50 border border-green-200 rounded-xl p-3">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">{profileFile.name}</span>
                      <button
                        type="button"
                        onClick={removeProfileFile}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                          อัปโหลดรูปโปรไฟล์
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
                    <p className="text-sm text-gray-500">
                      รองรับไฟล์ PNG, JPG, WebP • ขนาดไม่เกิน 5MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Documents Upload */}
          <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              เอกสารประกอบ (เช่น ประวัติการทำงาน) 
              <span className="text-sm font-normal text-purple-600 ml-2">(ไม่บังคับ)</span>
            </h4>
            
            {/* แสดงไฟล์ที่เลือกแล้ว */}
            {documentFiles.length > 0 && (
              <div className="mb-6 bg-white rounded-xl border border-purple-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    ไฟล์ที่เลือก ({documentFiles.length} ไฟล์)
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
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {documentFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-purple-25 border border-purple-150 rounded-xl hover:bg-purple-50 transition-colors">
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

            {/* Upload Area */}
            <div className="border-3 border-dashed border-purple-200 rounded-2xl bg-white p-8 hover:border-purple-300 hover:bg-purple-25 transition-all duration-300">
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
                      {documentFiles.length > 0 ? 'เพิ่มเอกสาร PDF' : 'อัปโหลดเอกสาร PDF'}
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
                <p className="text-sm text-gray-500">
                  รองรับไฟล์ PDF • ขนาดไม่เกิน 10MB ต่อไฟล์ • เลือกได้หลายไฟล์
                </p>
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-4 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  บันทึกข้อมูล
                </div>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
