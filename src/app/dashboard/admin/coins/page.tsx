'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CoinStatsOverview } from '@/components/admin/coins/CoinStatsOverview'
import { CampaignManager } from '@/components/admin/coins/CampaignManager'
import { RedemptionRequests } from '@/components/admin/coins/RedemptionRequests'
import { EarningRulesManager } from '@/components/admin/coins/EarningRulesManager'
import { ManualAdjustmentForm } from '@/components/admin/coins/ManualAdjustmentForm'
import { CoinsIcon, GiftIcon, BanknoteIcon, SettingsIcon, TrendingUpIcon } from 'lucide-react'

export default function AdminCoinsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CoinsIcon className="h-8 w-8 text-yellow-500" />
          Coin System Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage coins, campaigns, redemptions, and earning rules
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <GiftIcon className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="flex items-center gap-2">
            <BanknoteIcon className="h-4 w-4" />
            Redemptions
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <CoinsIcon className="h-4 w-4" />
            Manual Adjust
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CoinStatsOverview />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <CampaignManager />
        </TabsContent>

        <TabsContent value="redemptions" className="mt-6">
          <RedemptionRequests />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <EarningRulesManager />
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <ManualAdjustmentForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
