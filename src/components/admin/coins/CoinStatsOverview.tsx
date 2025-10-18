'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CoinsIcon, TrendingUp, TrendingDown, Users, GiftIcon, AlertCircle } from 'lucide-react'
import { LoadingSystem, ErrorSystem } from '@/components/ui'

interface CoinStats {
  total_distributed: number
  total_redeemed: number
  current_balance: number
  pending_redemptions: {
    count: number
    coins: number
    cash: number
  }
  approved_redemptions: {
    count: number
    coins: number
    cash: number
  }
  active_campaigns: number
  sellers_with_coins: number
}

export function CoinStatsOverview() {
  const [stats, setStats] = useState<CoinStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/coins/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSystem />
  if (error) return <ErrorSystem message={error} />
  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Distributed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Distributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-500">
              {stats.total_distributed.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">coins given to sellers</p>
          </CardContent>
        </Card>

        {/* Total Redeemed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              Total Redeemed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
              {stats.total_redeemed.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">coins exchanged for cash</p>
          </CardContent>
        </Card>

        {/* Current Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CoinsIcon className="h-4 w-4 text-yellow-500" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
              {stats.current_balance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">total coins in circulation</p>
          </CardContent>
        </Card>

        {/* Active Sellers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Active Sellers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-500">
              {stats.sellers_with_coins.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">sellers with coins</p>
          </CardContent>
        </Card>
      </div>

      {/* Redemption Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Redemptions */}
        <Card className="border-2 border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Pending Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <span className="text-sm font-medium">Requests:</span>
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                {stats.pending_redemptions.count}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Coins</p>
                <p className="text-lg font-bold">
                  {stats.pending_redemptions.coins.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Cash (THB)</p>
                <p className="text-lg font-bold">
                  {stats.pending_redemptions.cash.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved Redemptions */}
        <Card className="border-2 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CoinsIcon className="h-5 w-5 text-blue-500" />
              Approved (Pending Payment)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span className="text-sm font-medium">Requests:</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                {stats.approved_redemptions.count}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Coins</p>
                <p className="text-lg font-bold">
                  {stats.approved_redemptions.coins.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Cash (THB)</p>
                <p className="text-lg font-bold">
                  {stats.approved_redemptions.cash.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GiftIcon className="h-5 w-5 text-purple-500" />
            Active Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-500">
            {stats.active_campaigns}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            campaigns currently running
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
