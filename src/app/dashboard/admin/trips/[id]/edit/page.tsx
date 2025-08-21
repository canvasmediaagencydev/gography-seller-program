'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Country {
  id: string
  name: string
  code: string
  flag_emoji: string | null
}

interface Trip {
  id: string
  title: string
  description: string | null
  duration_days: number
  duration_nights: number
  price_per_person: number
  total_seats: number
  commission_type: string
  commission_value: number
  country_id: string | null
  geography_link: string | null
  cover_image_url: string | null
  is_active: boolean | null
}

export default function EditTripPage() {
  const params = useParams()
  const tripId = params.id as string
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_days: 1,
    duration_nights: 0,
    price_per_person: 0,
    total_seats: 10,
    commission_type: 'percentage',
    commission_value: 5,
    country_id: '',
    geography_link: '',
    cover_image_url: '',
    is_active: true
  })
  
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trip, setTrip] = useState<Trip | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const supabase = createClient()

  // Load trip data
  useEffect(() => {
    async function loadTripData() {
      try {
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single()

        if (tripError) throw tripError

        setTrip(tripData as Trip)
        setFormData({
          title: tripData.title,
          description: tripData.description || '',
          duration_days: tripData.duration_days,
          duration_nights: tripData.duration_nights,
          price_per_person: tripData.price_per_person,
          total_seats: tripData.total_seats,
          commission_type: tripData.commission_type || 'percentage',
          commission_value: tripData.commission_value,
          country_id: tripData.country_id || '',
          geography_link: tripData.geography_link || '',
          cover_image_url: tripData.cover_image_url || '',
          is_active: tripData.is_active !== false
        })
      } catch (error) {
        console.error('Error loading trip data:', error)
        setError('ไม่สามารถโหลดข้อมูลทริปได้')
      }
    }

    loadTripData()
  }, [tripId, supabase])

  // Load countries
  useEffect(() => {
    async function loadCountries() {
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('id, name, code, flag_emoji')
          .order('name')

        if (error) throw error
        setCountries(data || [])
      } catch (error) {
        console.error('Error loading countries:', error)
      }
    }

    loadCountries()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    let convertedValue: any = value
    
    if (type === 'checkbox') {
      convertedValue = (e.target as HTMLInputElement).checked
    } else if (type === 'number') {
      convertedValue = parseFloat(value) || 0
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: convertedValue
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic client-side validation
    if (formData.title.length < 5 || formData.title.length > 200) {
      setError('ชื่อทริปต้องมีความยาว 5-200 ตัวอักษร')
      setLoading(false)
      return
    }

    if (formData.description.length < 10 || formData.description.length > 2000) {
      setError('รายละเอียดต้องมีความยาว 10-2000 ตัวอักษร')
      setLoading(false)
      return
    }

    try {
      // For edit page, we only update trip data, not schedules
      const { error } = await supabase
        .from('trips')
        .update({
          title: formData.title,
          description: formData.description || null,
          duration_days: Number(formData.duration_days),
          duration_nights: Number(formData.duration_nights),
          price_per_person: Number(formData.price_per_person),
          total_seats: Number(formData.total_seats),
          commission_type: formData.commission_type,
          commission_value: Number(formData.commission_value),
          country_id: formData.country_id || null,
          geography_link: formData.geography_link || null,
          cover_image_url: formData.cover_image_url || null,
          is_active: Boolean(formData.is_active)
        })
        .eq('id', tripId)

      if (error) throw error

      router.push('/dashboard/admin/trips')
    } catch (error) {
      console.error('Error updating trip:', error)
      setError('ไม่สามารถอัปเดตทริปได้')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)

      if (error) throw error

      router.push('/dashboard/admin/trips')
    } catch (error) {
      console.error('Error deleting trip:', error)
      setError('ไม่สามารถลบทริปได้')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/dashboard/admin/trips"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              กลับสู่รายการทริป
            </Link>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-medium text-gray-900 mb-1">แก้ไขทริป</h1>
              <p className="text-gray-600 text-sm">อัปเดตข้อมูลและรายละเอียดทริป</p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900 transition-colors"
            >
              ลบทริป
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-base font-medium text-gray-900 mb-3 border-b border-gray-100 pb-2">ข้อมูลพื้นฐาน</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อทริป * (5-200 ตัวอักษร)
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  placeholder="เช่น เที่ยวญี่ปุ่น โตเกียว-โอซาก้า"
                />
                {formData.title && (formData.title.length < 5 || formData.title.length > 200) && (
                  <p className="mt-1 text-sm text-red-600">
                    ชื่อทริปต้องมีความยาว 5-200 ตัวอักษร (ปัจจุบัน: {formData.title.length})
                  </p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด * (10-2000 ตัวอักษร)
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  placeholder="รายละเอียดของทริป เช่น สถานที่ท่องเที่ยว กิจกรรม"
                />
                {formData.description && (formData.description.length < 10 || formData.description.length > 2000) && (
                  <p className="mt-1 text-sm text-red-600">
                    รายละเอียดต้องมีความยาว 10-2000 ตัวอักษร (ปัจจุบัน: {formData.description.length})
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="country_id" className="block text-sm font-medium text-gray-700 mb-1">
                  ประเทศ
                </label>
                <select
                  name="country_id"
                  id="country_id"
                  value={formData.country_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="">เลือกประเทศ</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.flag_emoji} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cover_image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  รูปภาพปก
                </label>
                <input
                  type="url"
                  name="cover_image_url"
                  id="cover_image_url"
                  value={formData.cover_image_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Duration and Price */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-base font-medium text-gray-900 mb-3 border-b border-gray-100 pb-2">ระยะเวลาและราคา</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนวัน *
                </label>
                <input
                  type="number"
                  name="duration_days"
                  id="duration_days"
                  min="1"
                  required
                  value={formData.duration_days}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>

              <div>
                <label htmlFor="duration_nights" className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนคืน *
                </label>
                <input
                  type="number"
                  name="duration_nights"
                  id="duration_nights"
                  min="0"
                  required
                  value={formData.duration_nights}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>

              <div>
                <label htmlFor="price_per_person" className="block text-sm font-medium text-gray-700 mb-1">
                  ราคาต่อคน (บาท) *
                </label>
                <input
                  type="number"
                  name="price_per_person"
                  id="price_per_person"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price_per_person}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>

              <div>
                <label htmlFor="total_seats" className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนที่นั่งทั้งหมด *
                </label>
                <input
                  type="number"
                  name="total_seats"
                  id="total_seats"
                  min="1"
                  required
                  value={formData.total_seats}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Commission */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-base font-medium text-gray-900 mb-3 border-b border-gray-100 pb-2">คอมมิชชั่น</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label htmlFor="commission_type" className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทคอมมิชชั่น *
                </label>
                <select
                  name="commission_type"
                  id="commission_type"
                  required
                  value={formData.commission_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="percentage">เปอร์เซ็นต์</option>
                  <option value="fixed">จำนวนคงที่ (บาท)</option>
                </select>
              </div>

              <div>
                <label htmlFor="commission_value" className="block text-sm font-medium text-gray-700 mb-1">
                  ค่าคอมมิชชั่น *
                </label>
                <div className="flex rounded border border-gray-300">
                  <input
                    type="number"
                    name="commission_value"
                    id="commission_value"
                    min="0"
                    step="0.01"
                    required
                    value={formData.commission_value}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 rounded-l focus:ring-1 focus:ring-gray-400 focus:border-gray-400 border-0"
                  />
                  <span className="inline-flex items-center px-3 rounded-r border-l border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    {formData.commission_type === 'percentage' ? '%' : 'บาท'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-base font-medium text-gray-900 mb-3 border-b border-gray-100 pb-2">ข้อมูลเพิ่มเติม</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="geography_link" className="block text-sm font-medium text-gray-700 mb-1">
                  ลิงก์ข้อมูลเพิ่มเติม
                </label>
                <input
                  type="url"
                  name="geography_link"
                  id="geography_link"
                  value={formData.geography_link}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  placeholder="https://example.com/trip-info..."
                />
              </div>

              <div className="flex items-center">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-400 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  เปิดใช้งานทริปนี้
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href="/dashboard/admin/trips"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">ยืนยันการลบทริป</h3>
                  <p className="text-gray-600 text-sm">การกระทำนี้ไม่สามารถยกเลิกได้</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6 text-sm">
                คุณแน่ใจหรือไม่ที่จะลบทริป <span className="font-medium">"{trip?.title}"</span> นี้?
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {loading ? 'กำลังลบ...' : 'ลบทริป'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}