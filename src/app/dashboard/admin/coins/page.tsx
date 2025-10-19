'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CoinStatsOverview } from '@/components/admin/coins/CoinStatsOverview'
import { CampaignManager } from '@/components/admin/coins/CampaignManager'
import { RedemptionRequests } from '@/components/admin/coins/RedemptionRequests'
import { EarningRulesManager } from '@/components/admin/coins/EarningRulesManager'
import { ManualAdjustmentForm } from '@/components/admin/coins/ManualAdjustmentForm'
import { CoinsIcon, GiftIcon, BanknoteIcon, SettingsIcon, TrendingUpIcon, Sparkles } from 'lucide-react'

export default function AdminCoinsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Clean Professional Header */}
        <div className="bg-white border-b border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <CoinsIcon className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Coin System Management
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    จัดการระบบ Coins, แคมเปญ, การแลก และกำหนดกฎการได้รับ Coins
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Minimal Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 bg-gray-50 border-b border-gray-200 rounded-none p-0">
              <TabsTrigger
                value="overview"
                className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 py-3 px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <TrendingUpIcon className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="campaigns"
                className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 py-3 px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <GiftIcon className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Campaigns</span>
              </TabsTrigger>
              <TabsTrigger
                value="redemptions"
                className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 py-3 px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <BanknoteIcon className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Redemptions</span>
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 py-3 px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Rules</span>
              </TabsTrigger>
              <TabsTrigger
                value="manual"
                className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 py-3 px-4 col-span-2 sm:col-span-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <CoinsIcon className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Manual</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 p-6">
              <CoinStatsOverview />
            </TabsContent>

            <TabsContent value="campaigns" className="mt-0 p-6">
              <CampaignManager />
            </TabsContent>

            <TabsContent value="redemptions" className="mt-0 p-6">
              <RedemptionRequests />
            </TabsContent>

            <TabsContent value="rules" className="mt-0 p-6">
              <EarningRulesManager />
            </TabsContent>

            <TabsContent value="manual" className="mt-0 p-6">
              <ManualAdjustmentForm />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
