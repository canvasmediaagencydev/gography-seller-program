'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

import { createClient } from '@/lib/supabase/client'
import { uploadSellerFile, updateSellerFiles } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { 
  FiAlertTriangle,
  FiCheck, 
  FiClipboard,
  FiFileText, 
  FiLoader,
  FiPlus,
  FiShield,
  FiUser, 
  FiX
} from 'react-icons/fi'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

// Constants
const UPLOAD_AREA_CLASSES = {
  base: "border-2 border-dashed rounded-2xl bg-slate-50/50 p-8 hover:border-opacity-75 transition-all duration-300 group",
  red: "border-red-200 hover:bg-red-50/30 hover:border-red-300",
  green: "border-green-200 hover:bg-green-50/30 hover:border-green-300",
  purple: "border-purple-200 hover:bg-purple-50/30 hover:border-purple-300"
}

const ICON_CONTAINER_CLASSES = {
  base: "mx-auto flex items-center justify-center group-hover:scale-105 transition-transform duration-200",
  red: "w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl",
  green: "w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full",
  purple: "w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full"
}

const SUCCESS_CARD_CLASSES = "bg-green-50 border-green-200"
const FILE_ITEM_CLASSES = "flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow"

// Reusable Components
interface FileSuccessDisplayProps {
  fileName: string
  description: string
  onRemove: () => void
  loading: boolean
}

const FileSuccessDisplay = ({ fileName, description, onRemove, loading }: FileSuccessDisplayProps) => (
  <Card className={SUCCESS_CARD_CLASSES}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <FiCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">{fileName}</p>
            <p className="text-xs text-green-600">{description}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={loading}
          className="text-red-600 hover:text-red-800 hover:bg-red-100"
        >
          <FiX className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
)

export default function SellerVerificationPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  
  // Bank account states
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [branch, setBranch] = useState('')
  
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

  // Helper functions
  const handleFileChange = (
    file: File,
    setFile: (file: File) => void,
    setPreview: (url: string) => void
  ) => {
    setFile(file)
    setError('')
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
  }

  const removeFile = (
    previewUrl: string | null,
    setFile: (file: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreview(null)
    }
    setFile(null)
  }

  // Handle file selection
  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileChange(file, setIdCardFile, setIdCardPreview)
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileChange(file, setProfileFile, setProfilePreview)
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

  const removeIdCardFile = () => removeFile(idCardPreview, setIdCardFile, setIdCardPreview)
  const removeProfileFile = () => removeFile(profilePreview, setProfileFile, setProfilePreview)

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

      if (!bankName || !accountNumber || !accountName) {
        setError('กรุณากรอกข้อมูลธนาคารให้ครบถ้วน')
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

      // Save bank account information
      setUploadProgress('กำลังบันทึกข้อมูลธนาคาร...')
      const { error: bankError } = await supabase
        .from('bank_accounts')
        .upsert({
          seller_id: userProfile.id,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          branch: branch || null,
          is_primary: true
        }, {
          onConflict: 'seller_id,is_primary'
        })

      if (bankError) {
        throw new Error('ไม่สามารถบันทึกข้อมูลธนาคารได้: ' + bankError.message)
      }

      // Notify other components about profile update
      const profileUpdateEvent = new CustomEvent('profileUpdated', {
        detail: { userId: userProfile.id, updates }
      })
      window.dispatchEvent(profileUpdateEvent)

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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <FiLoader className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-600 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl">
      {/* Header */}
      <div className="bg-white rounded-2xl border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/profile')}
            className="-ml-2"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900">ยืนยันตัวตน</h1>
            <p className="text-sm text-blue-600">เพื่อเริ่มต้นขายทริป</p>
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Info Card */}
        <Card className="mb-6 overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-4 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <FiShield className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">ยืนยันตัวตนเพื่ความปลอดภัย</h3>
                <p className="text-blue-100 text-sm leading-relaxed">เราต้องการข้อมูลเพื่อตรวจสอบประวัติและสร้างความเชื่อมั่นให้กับลูกค้า</p>
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-red-800 text-sm font-medium leading-relaxed">{error}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {uploadProgress && (
          <Card className="border-blue-200 bg-blue-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <FiLoader className="animate-spin h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-blue-800 text-sm font-medium">{uploadProgress}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Badge variant="secondary" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full p-0 flex items-center justify-center mr-3 bg-blue-100 text-blue-700 font-bold text-xs sm:text-sm">
                  1
                </Badge>
                ข้อมูลส่วนตัว
              </CardTitle>
              <CardDescription className="text-sm">
                กรอกข้อมูลส่วนตัวของคุณให้ถูกต้องตามบัตรประชาชน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  disabled={loading}
                  className="h-11 sm:h-12 text-base"
                  placeholder="กรอกชื่อ-นามสกุลตามบัตรประชาชน"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  disabled={loading}
                  className="h-11 sm:h-12 text-base"
                  placeholder="เบอร์โทรศัพท์สำหรับติดต่อ"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* ID Card Upload */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Badge variant="destructive" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full p-0 flex items-center justify-center mr-3 bg-red-100 text-red-700 font-bold text-xs sm:text-sm">
                  2
                </Badge>
                บัตรประชาชน <span className="text-red-500">*</span>
              </CardTitle>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <FiAlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium mb-1">เพื่อความปลอดภัยของลูกค้า</p>
                      <p className="text-xs text-amber-700">เราจะใช้ข้อมูลนี้ในการตรวจสอบประวัติอาชญากรรม</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardHeader>
            <CardContent>
              <div className={`${UPLOAD_AREA_CLASSES.base} ${UPLOAD_AREA_CLASSES.red}`}>
                {idCardFile ? (
                  <div className="space-y-6">
                    <div className="mx-auto w-full max-w-md h-64 border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-md">
                      <img 
                        src={idCardPreview || ''} 
                        alt="ID Card Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <FileSuccessDisplay
                      fileName={idCardFile.name}
                      description="อัปโหลดเรียบร้อยแล้ว"
                      onRemove={removeIdCardFile}
                      loading={loading}
                    />
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className={`${ICON_CONTAINER_CLASSES.base} ${ICON_CONTAINER_CLASSES.red}`}>
                      <FiFileText className="w-12 h-12 text-red-600" />
                    </div>
                    <div>
                      <label htmlFor="idCardFile" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-14 px-8 border-2 border-red-200 text-red-700 bg-white hover:bg-red-50 hover:border-red-300 shadow-sm"
                          asChild
                        >
                          <span>
                            <FiPlus className="w-5 h-5 mr-3" />
                            เลือกไฟล์บัตรประชาชน
                          </span>
                        </Button>
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
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-3">คำแนะนำการถ่ายภาพ:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>วางบนพื้นเรียบ</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>ข้อมูลชัดเจน</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>แสงสว่างพอ</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>JPG/PNG/WebP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Image Upload */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Badge className="w-8 h-8 rounded-full p-0 flex items-center justify-center mr-3 bg-green-100 text-green-700 font-bold text-sm">
                  3
                </Badge>
                รูปโปรไฟล์ 
                <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                  ไม่บังคับ
                </Badge>
              </CardTitle>
              <CardDescription>
                อัปโหลดรูปโปรไฟล์เพื่อแสดงในหน้า Seller ของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`${UPLOAD_AREA_CLASSES.base} ${UPLOAD_AREA_CLASSES.green}`}>
                {profileFile ? (
                  <div className="space-y-6">
                    <div className="mx-auto w-40 h-40 border-2 border-slate-200 rounded-full overflow-hidden bg-white shadow-md">
                      <img 
                        src={profilePreview || ''} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <FiCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-800">{profileFile.name}</p>
                              <p className="text-xs text-green-600">รูปโปรไฟล์พร้อมใช้งาน</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeProfileFile}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100"
                          >
                            <FiX className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <FiUser className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                      <label htmlFor="profileFile" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-12 px-6 border-2 border-green-200 text-green-700 bg-white hover:bg-green-50 hover:border-green-300 shadow-sm"
                          asChild
                        >
                          <span>
                            <FiPlus className="w-5 h-5 mr-2" />
                            เลือกรูปโปรไฟล์
                          </span>
                        </Button>
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
                    <p className="text-sm text-slate-600 bg-white rounded-lg px-4 py-2 border border-slate-200">
                      ใช้สำหรับแสดงในโปรไฟล์ Seller ของคุณ
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents Upload */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Badge className="w-8 h-8 rounded-full p-0 flex items-center justify-center mr-3 bg-purple-100 text-purple-700 font-bold text-sm">
                  4
                </Badge>
                เอกสารเพิ่มเติม 
                <Badge variant="outline" className="ml-2 text-purple-600 border-purple-200">
                  ไม่บังคับ
                </Badge>
              </CardTitle>
              <CardDescription>
                เช่น ประวัติการทำงาน ใบประกาศนียบัตร ใบรับรองต่างๆ เพื่อเพิ่มความน่าเชื่อถือ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentFiles.length > 0 && (
                <Card className="bg-purple-50 border-purple-200 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <FiClipboard className="w-4 h-4 text-purple-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                          เอกสารที่เลือก ({documentFiles.length} ไฟล์)
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDocumentFiles([])}
                        disabled={loading}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-800"
                      >
                        ลบทั้งหมด
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {documentFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                              <FiFileText className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB • PDF</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDocument(index)}
                            disabled={loading}
                            className="flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-100"
                            title="ลบไฟล์นี้"
                          >
                            <FiX className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="border-2 border-dashed border-purple-200 rounded-2xl bg-slate-50/50 p-8 hover:border-purple-300 hover:bg-purple-50/30 transition-all duration-300 group">
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <FiFileText className="w-10 h-10 text-purple-600" />
                  </div>
                  <div>
                    <label htmlFor="documentsFile" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-12 px-6 border-2 border-purple-200 text-purple-700 bg-white hover:bg-purple-50 hover:border-purple-300 shadow-sm"
                        asChild
                      >
                        <span>
                          <FiPlus className="w-5 h-5 mr-2" />
                          {documentFiles.length > 0 ? 'เพิ่มเอกสาร' : 'อัปโหลดเอกสาร'}
                        </span>
                      </Button>
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
                  <p className="text-sm text-slate-600 bg-white rounded-lg px-4 py-2 border border-slate-200">
                    รองรับไฟล์ PDF • ขนาดไม่เกิน 10MB ต่อไฟล์
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Information */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Badge variant="secondary" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full p-0 flex items-center justify-center mr-3 bg-orange-100 text-orange-700 font-bold text-xs sm:text-sm">
                  4
                </Badge>
                ข้อมูลบัญชีธนาคาร
              </CardTitle>
              <CardDescription className="text-sm">
                กรอกข้อมูลบัญชีธนาคารสำหรับรับเงินค่าคอมมิชชั่น
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="bankName" className="block text-sm font-semibold text-slate-700">
                    ชื่อธนาคาร <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="bankName"
                    name="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 sm:h-12 text-base w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">เลือกธนาคาร</option>
                    <option value="กสิกรไทย">ธนาคารกสิกรไทย</option>
                    <option value="กรุงเทพ">ธนาคารกรุงเทพ</option>
                    <option value="กรุงไทย">ธนาคารกรุงไทย</option>
                    <option value="ไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                    <option value="กรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                    <option value="ทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</option>
                    <option value="ออมสิน">ธนาคารออมสิน</option>
                    <option value="อาคารสงเคราะห์">ธนาคารอาคารสงเคราะห์</option>
                    <option value="เกียรตินาคินภัทร">ธนาคารเกียรตินาคินภัทร</option>
                    <option value="ซีไอเอ็มบีไทย">ธนาคารซีไอเอ็มบีไทย</option>
                    <option value="ยูโอบี">ธนาคารยูโอบี</option>
                    <option value="แลนด์ แอนด์ เฮ้าส์">ธนาคารแลนด์ แอนด์ เฮ้าส์</option>
                    <option value="ไอซีบีซี">ธนาคารไอซีบีซี (ไทย)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="accountNumber" className="block text-sm font-semibold text-slate-700">
                    เลขที่บัญชี <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    placeholder="xxx-x-xxxxx-x"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 sm:h-12 text-base"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="accountName" className="block text-sm font-semibold text-slate-700">
                    ชื่อบัญชี <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="accountName"
                    name="accountName"
                    type="text"
                    placeholder="ชื่อเจ้าของบัญชี"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 sm:h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="branch" className="block text-sm font-semibold text-slate-700">
                    สาขา
                  </label>
                  <Input
                    id="branch"
                    name="branch"
                    type="text"
                    placeholder="สาขาที่เปิดบัญชี (ไม่บังคับ)"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={loading}
                    className="h-11 sm:h-12 text-base"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Submit Button */}
        <div className="mt-6 mb-10">
          <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-200 relative overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <FiLoader className="animate-spin -ml-1 mr-3 h-5 w-5" />
              กำลังส่งข้อมูล...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <FiShield className="w-5 h-5 mr-2" />
              ส่งข้อมูลเพื่อยืนยันตัวตน
            </div>
          )}
          </Button>
        </div>
      </div>
    </div>
  )
}