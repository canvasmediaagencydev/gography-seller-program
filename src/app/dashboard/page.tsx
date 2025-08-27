'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import ProfileCompletionModal from '@/components/ProfileCompletionModal'
import { BsBarChart, BsGraphUp, BsTrophy, BsCalendar, BsPeople, BsCurrencyDollar } from 'react-icons/bs'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  commission_goal: number | null
  referral_code: string | null
}

interface ComingSoonCardProps {
  title: string
  description: string
  mockValue: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow'
}

function ComingSoonCard({ title, description, mockValue, icon, color }: ComingSoonCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50 border-blue-200',
    green: 'from-green-500 to-green-600 text-green-600 bg-green-50 border-green-200',
    purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50 border-purple-200',
    orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50 border-orange-200',
    red: 'from-red-500 to-red-600 text-red-600 bg-red-50 border-red-200',
    yellow: 'from-yellow-500 to-yellow-600 text-yellow-600 bg-yellow-50 border-yellow-200'
  }

  const colors = colorClasses[color].split(' ')
  const gradientColor = colors[0] + ' ' + colors[1]
  const iconColor = colors[2]
  const bgColor = colors[3]
  const borderColor = colors[4]

  return (
    <div className="relative group">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-xl z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className={`bg-gradient-to-r ${gradientColor} text-white px-6 py-3 rounded-full font-semibold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300`}>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Coming Soon
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className={`bg-white border-2 ${borderColor} rounded-xl p-6 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center ${iconColor}`}>
            {icon}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-400">{mockValue}</div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        {/* Progress bar mockup */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${gradientColor} rounded-full animate-pulse`} style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SellerDashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Fun Icon */}
        <div className="text-8xl mb-6 animate-bounce">
          🚧
        </div>
        
        {/* Main Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          อยู่ระหว่างพัฒนา
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Dashboard กำลังสร้าง... <br />
          รอหน่อยนะ จะเสร็จเร็วๆ นี้! 😊
        </p>

        {/* Simple Progress */}
        <div className="bg-white rounded-full p-2 shadow-lg mb-6">
          <div className="h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>

        {/* Small note */}
        <p className="text-sm text-gray-500 mt-6">
          ระหว่างนี้ลองดู <span className="font-semibold text-blue-600">ข้อมูล Trips</span> กันก่อนได้นะ!
        </p>
      </div>
    </div>
  )
}
