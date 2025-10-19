'use client'

import { useState, useEffect, useCallback } from 'react'
import { CoinTransactionHistory } from '@/components/coins/CoinTransactionHistory'
import { ActiveCampaigns } from '@/components/coins/ActiveCampaigns'
import { RedeemCoinsModal } from '@/components/coins/RedeemCoinsModal'
import { LoadingSystem, ErrorSystem } from '@/components/ui'
import {
  CoinsIcon,
  RefreshCw,
  TrendingUp,
  Gift,
  Clock
} from 'lucide-react'

interface CoinBalance {
  seller_id: string
  balance: number
  total_earned: number
  total_redeemed: number
  created_at: string
  updated_at: string
}

interface CoinTransaction {
  id: string
  seller_id: string
  transaction_type: 'earn' | 'redeem' | 'bonus' | 'adjustment'
  source_type: 'booking' | 'sales_target' | 'referral' | 'campaign' | 'admin'
  source_id: string | null
  amount: number
  balance_before: number
  balance_after: number
  description: string
  metadata: any
  created_at: string
}

interface Campaign {
  id: string
  title: string
  description: string
  campaign_type: 'trip_specific' | 'date_specific' | 'sales_milestone' | 'general'
  coin_amount: number
  target_trip_id: string | null
  start_date: string
  end_date: string
}

export default function CoinsPage() {
  const [balance, setBalance] = useState<CoinBalance | null>(null)
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRedeemModal, setShowRedeemModal] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filter state
  const [transactionType, setTransactionType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchCoinsData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20'
      })

      if (transactionType && transactionType !== 'all') params.append('transaction_type', transactionType)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      // Fetch coins balance and transactions
      const coinsResponse = await fetch(`/api/coins?${params}`)
      if (!coinsResponse.ok) throw new Error('Failed to fetch coins data')

      const coinsData = await coinsResponse.json()
      setBalance(coinsData.balance)
      setTransactions(coinsData.transactions)
      setTotalPages(coinsData.pagination.totalPages)
      setTotalCount(coinsData.pagination.total)

      // Fetch active campaigns
      const campaignsResponse = await fetch('/api/coins/campaigns')
      if (!campaignsResponse.ok) throw new Error('Failed to fetch campaigns')

      const campaignsData = await campaignsResponse.json()
      setCampaigns(campaignsData.campaigns)

    } catch (err: any) {
      setError(err.message)
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [currentPage, transactionType, startDate, endDate])

  const handleRefresh = async () => {
    if (refreshing) return
    await fetchCoinsData(true)
  }

  useEffect(() => {
    fetchCoinsData()
  }, [fetchCoinsData])

  const handleRedeemSuccess = () => {
    setShowRedeemModal(false)
    fetchCoinsData() // Refresh data
  }

  if (loading && !balance) {
    return <LoadingSystem />
  }

  if (error) {
    return <ErrorSystem message={error} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header with Gold Gradient Background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl shadow-xl mb-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <CoinsIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      จัดการ Coins และรางวัล
                    </h1>
                    <p className="text-amber-100 text-sm mt-1">
                      ติดตามและแลก Coins ของคุณ
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{refreshing ? 'กำลังโหลด...' : 'รีเฟรช'}</span>
                </button>

                {/* Redeem Button */}
                <button
                  onClick={() => setShowRedeemModal(true)}
                  disabled={!balance || balance.balance <= 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-amber-600 rounded-xl font-medium hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <span>แลก Coins</span>
                </button>
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 flex items-center gap-2 text-amber-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Balance Card */}
          <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform duration-300">
                  <CoinsIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-50 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5 text-yellow-600" />
                  <span className="text-xs font-semibold text-yellow-700">Active</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">ยอด Coins คงเหลือ</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">
                  {balance?.balance.toLocaleString() || '0'}
                </p>
                <span className="text-lg font-semibold text-gray-500">Coins</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">พร้อมใช้งาน</p>
                <p className="text-xs font-semibold text-amber-600">≈ ฿{balance?.balance.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>

          {/* Total Earned Card */}
          <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 rounded-full">
                  <Gift className="w-3.5 h-3.5 text-green-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Coins ที่ได้รับทั้งหมด</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">
                  {balance?.total_earned.toLocaleString() || '0'}
                </p>
                <span className="text-lg font-semibold text-gray-500">Coins</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">สะสมตั้งแต่เริ่มใช้งาน</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-600">รับต่อเนื่อง</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Redeemed Card */}
          <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 rounded-full">
                  <span className="text-xs font-semibold text-purple-600">{(balance?.total_redeemed || 0) > 0 ? 'แลกแล้ว' : 'ยังไม่ได้แลก'}</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Coins ที่แลกไปแล้ว</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">
                  {balance?.total_redeemed.toLocaleString() || '0'}
                </p>
                <span className="text-lg font-semibold text-gray-500">Coins</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">มูลค่าที่แลกแล้ว</p>
                <p className="text-xs font-semibold text-purple-600">≈ ฿{balance?.total_redeemed.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        {campaigns.length > 0 && (
          <ActiveCampaigns campaigns={campaigns} />
        )}

        {/* Transaction History */}
        <CoinTransactionHistory
          transactions={transactions}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setCurrentPage}
          transactionType={transactionType}
          onTransactionTypeChange={setTransactionType}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && balance && (
        <RedeemCoinsModal
          currentBalance={balance.balance}
          onClose={() => setShowRedeemModal(false)}
          onSuccess={handleRedeemSuccess}
        />
      )}
    </div>
  )
}
