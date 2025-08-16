'use client'


import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Country {
  id: string
  name: string
  code: string
  flag_emoji: string | null
}

export default function NewTripPage() {
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

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name')

    if (data) setCountries(data)
    if (error) console.error('Error fetching countries:', error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('ไม่พบข้อมูลผู้ใช้')
      }

      const tripData = {
        ...formData,
        created_by: user.id,
        price_per_person: Number(formData.price_per_person),
        commission_value: Number(formData.commission_value),
        duration_days: Number(formData.duration_days),
        duration_nights: Number(formData.duration_nights),
        total_seats: Number(formData.total_seats)
      }

      const { error } = await supabase
        .from('trips')
        .insert([tripData])

      if (error) throw error

      router.push('/dashboard/admin/trips')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการสร้างทริป')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/dashboard/admin/trips"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับ
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">สร้างทริปใหม่</h1>
        <p className="text-gray-600">กรอกข้อมูลทริปที่ต้องการสร้าง</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                ชื่อทริป *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="เช่น เที่ยวญี่ปุ่น โตเกียว-โอซาก้า"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                รายละเอียด
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="รายละเอียดของทริป เช่น สถานที่ท่องเที่ยว กิจกรรม"
              />
            </div>

            <div>
              <label htmlFor="country_id" className="block text-sm font-medium text-gray-700">
                ประเทศ
              </label>
              <select
                name="country_id"
                id="country_id"
                value={formData.country_id}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
              <label htmlFor="cover_image_url" className="block text-sm font-medium text-gray-700">
                รูปภาพปก
              </label>
              <input
                type="url"
                name="cover_image_url"
                id="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">ระยะเวลาและราคา</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="duration_nights" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="price_per_person" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="total_seats" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">คอมมิชชั่น</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="commission_type" className="block text-sm font-medium text-gray-700">
                ประเภทคอมมิชชั่น *
              </label>
              <select
                name="commission_type"
                id="commission_type"
                required
                value={formData.commission_type}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="percentage">เปอร์เซ็นต์</option>
                <option value="fixed">จำนวนคงที่ (บาท)</option>
              </select>
            </div>

            <div>
              <label htmlFor="commission_value" className="block text-sm font-medium text-gray-700">
                ค่าคอมมิชชั่น *
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="commission_value"
                  id="commission_value"
                  min="0"
                  step="0.01"
                  required
                  value={formData.commission_value}
                  onChange={handleChange}
                  className="flex-1 border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  {formData.commission_type === 'percentage' ? '%' : 'บาท'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลเพิ่มเติม</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="geography_link" className="block text-sm font-medium text-gray-700">
                ลิงก์แผนที่
              </label>
              <input
                type="url"
                name="geography_link"
                id="geography_link"
                value={formData.geography_link}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="flex items-center">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                เปิดใช้งานทันที
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/dashboard/admin/trips"
            className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'กำลังสร้าง...' : 'สร้างทริป'}
          </button>
        </div>
      </form>
    </div>
  )
}
