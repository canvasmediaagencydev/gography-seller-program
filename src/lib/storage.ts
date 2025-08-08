import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// File types และ sizes
export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  PDF: ['application/pdf']
}

export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  PDF: 10 * 1024 * 1024   // 10MB
}

// Helper สำหรับ validate file
export const validateFile = (file: File, type: 'IMAGE' | 'PDF') => {
  const allowedTypes = FILE_TYPES[type]
  const maxSize = MAX_FILE_SIZES[type]

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`กรุณาเลือกไฟล์ ${type === 'IMAGE' ? 'รูปภาพ (JPG, PNG, WebP)' : 'PDF'} เท่านั้น`)
  }

  if (file.size > maxSize) {
    const sizeMB = maxSize / (1024 * 1024)
    throw new Error(`ไฟล์ต้องมีขนาดไม่เกิน ${sizeMB}MB`)
  }
}

// Upload ไฟล์ไปยัง Supabase Storage
export const uploadSellerFile = async (
  file: File,
  sellerId: string,
  category: 'id-card' | 'documents' | 'profile',
  fileName?: string
) => {
  // Validate file based on category
  const fileType = category === 'documents' ? 'PDF' : 'IMAGE'
  validateFile(file, fileType)

  // Generate file name
  const timestamp = Date.now()
  const fileExtension = file.name.split('.').pop()
  const finalFileName = fileName || `${category}-${timestamp}.${fileExtension}`
  
  // Create path: seller-assets/{sellerId}/{category}/{fileName}
  const filePath = `${sellerId}/${category}/${finalFileName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('seller-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false // ไม่ให้ overwrite ไฟล์เดิม
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('seller-assets')
    .getPublicUrl(filePath)

  return {
    path: filePath,
    url: urlData.publicUrl,
    fileName: finalFileName
  }
}

// ลบไฟล์จาก Storage
export const deleteSellerFile = async (filePath: string) => {
  const { error } = await supabase.storage
    .from('seller-assets')
    .remove([filePath])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`เกิดข้อผิดพลาดในการลบไฟล์: ${error.message}`)
  }
}

// Get file URL (สำหรับ preview)
export const getSellerFileUrl = (filePath: string) => {
  const { data } = supabase.storage
    .from('seller-assets')
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

// Update seller profile with file URLs
export const updateSellerFiles = async (
  sellerId: string,
  updates: {
    id_card_url?: string
    avatar_url?: string  
    document_url?: string
    documents_urls?: string[]
    id_card_uploaded_at?: string
    avatar_uploaded_at?: string
    document_uploaded_at?: string
  }
) => {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', sellerId)

  if (error) {
    console.error('Update profile error:', error)
    throw new Error(`เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ${error.message}`)
  }
}
