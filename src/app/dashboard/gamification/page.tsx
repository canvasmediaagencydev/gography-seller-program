'use client'

import { GamificationChallenges } from '@/components/coins/GamificationChallenges'
import { Gamepad2, Target } from 'lucide-react'

export default function GamificationPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Gamification Challenges
            </h1>
          </div>
          <p className="text-gray-600">
            ทำภารกิจและรับรางวัล Coins
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                วิธีเล่น
              </h3>
              <div className="space-y-1.5 text-sm text-gray-700">
                <p><strong>1. ทำภารกิจ:</strong> ทำกิจกรรมตามเงื่อนไข Condition 1 เพื่อรับ Earning Coins</p>
                <p><strong>2. ปลดล็อก:</strong> ทำ Condition 2 เพื่อปลดล็อก Earning Coins ให้กลายเป็น Redeemable Coins</p>
                <p><strong>3. แลกของรางวัล:</strong> นำ Redeemable Coins ไปแลกเป็นเงินสดได้ในหน้า Coins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gamification Challenges Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <GamificationChallenges />
        </div>
      </div>
    </div>
  )
}
