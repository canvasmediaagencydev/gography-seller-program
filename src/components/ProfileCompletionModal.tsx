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
  
  // UI states
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
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileFile(file)
      setError('')
    }
  }

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setDocumentFiles(files)
    setError('')
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
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            กรอกข้อมูลส่วนตัว
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          กรุณากรอกข้อมูลเพื่อให้เราสามารถติดต่อและตรวจสอบข้อมูลของคุณได้
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="text-red-700 text-sm">
              {error}
            </div>
          </div>
        )}

        {uploadProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="text-blue-700 text-sm flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {uploadProgress}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุล *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                placeholder="กรอกชื่อ-นามสกุลของคุณ"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรศัพท์ *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                placeholder="กรอกเบอร์โทรศัพท์ของคุณ"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* ID Card Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รูปบัตรประชาชน * 
              <span className="text-xs text-gray-500 font-normal ml-2">
                (สำหรับใช้ในการตรวจสอบประวัติอาชญากรรม เพื่อความปลอดภัยของลูกค้า)
              </span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                {idCardFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">{idCardFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setIdCardFile(null)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="idCardFile" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>อัปโหลดรูปบัตรประชาชน</span>
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
                      <p className="pl-1">หรือลากไฟล์มาวาง</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP ขนาดไม่เกิน 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รูปโปรไฟล์ <span className="text-gray-400">(ไม่บังคับ)</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                {profileFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">{profileFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setProfileFile(null)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="profileFile" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>อัปโหลดรูปโปรไฟล์</span>
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
                      <p className="pl-1">หรือลากไฟล์มาวาง</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP ขนาดไม่เกิน 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Documents Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เอกสารประกอบ (เช่น ประวัติการทำงาน) <span className="text-gray-400">(ไม่บังคับ)</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                {documentFiles.length > 0 ? (
                  <div className="space-y-2">
                    {documentFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-center space-x-2">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-600">{file.name}</span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDocumentFiles([])}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50"
                    >
                      ลบไฟล์ทั้งหมด
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="documentsFile" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>อัปโหลดเอกสาร PDF</span>
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
                      <p className="pl-1">หรือลากไฟล์มาวาง</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF ขนาดไม่เกิน 10MB ต่อไฟล์ (เลือกได้หลายไฟล์)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
