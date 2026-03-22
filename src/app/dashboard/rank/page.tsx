'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MyPositionCard } from '@/components/rank/MyPositionCard'
import { TopPodium } from '@/components/rank/TopPodium'
import { LeaderboardTable } from '@/components/rank/LeaderboardTable'
import type { RankingAPIResponse, RankingMetric } from '@/app/api/seller/ranking/route'
import type { PeriodFilter } from '@/types/dashboard'

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'month', label: 'เดือนนี้' },
  { value: 'week', label: 'สัปดาห์นี้' },
]

const METRIC_OPTIONS: { value: RankingMetric; label: string; emoji: string }[] = [
  { value: 'sales', label: 'ยอดขาย', emoji: '💰' },
  { value: 'commission', label: 'คอมมิชชั่น', emoji: '💳' },
  { value: 'coins', label: 'Coins', emoji: '🪙' },
  { value: 'bookings', label: 'Booking', emoji: '✈️' },
]

export default function RankPage() {
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [metric, setMetric] = useState<RankingMetric>('sales')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<RankingAPIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (p: PeriodFilter, m: RankingMetric, pg: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/seller/ranking?period=${p}&metric=${m}&page=${pg}&pageSize=20`)
      if (!res.ok) throw new Error('Failed to fetch leaderboard')
      const json: RankingAPIResponse = await res.json()
      setData(json)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(period, metric, page)
  }, [period, metric, page, fetchData])

  const handlePeriodChange = (p: PeriodFilter) => { setPeriod(p); setPage(1) }
  const handleMetricChange = (m: RankingMetric) => { setMetric(m); setPage(1) }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-10">

        {/* Hero Banner — matches reports/coins page style */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl mb-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <span className="text-2xl leading-none">🏆</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Leaderboard</h1>
                  <p className="text-blue-100 text-sm mt-1">จัดอันดับและแข่งขัน Seller</p>
                </div>
              </div>

              {/* Period Filter */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20 self-start sm:self-auto">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handlePeriodChange(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      period === opt.value
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metric tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {METRIC_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleMetricChange(opt.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                metric === opt.value
                  ? 'bg-white border-gray-200 text-gray-900 shadow-sm'
                  : 'bg-white/60 border-transparent text-gray-500 hover:bg-white hover:border-gray-100 hover:shadow-sm'
              }`}
            >
              <span className="text-base leading-none">{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Error state */}
        {error ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchData(period, metric, page)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg shadow-blue-500/30"
            >
              ลองใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <MyPositionCard
                rank={data?.currentUser.rank ?? 0}
                totalSellers={data?.currentUser.totalSellers ?? 0}
                value={data?.currentUser.value ?? 0}
                nextRankGap={data?.currentUser.nextRankGap ?? null}
                progressToNextRank={data?.currentUser.progressToNextRank ?? 0}
                metric={metric}
                isLoading={isLoading}
              />
              <TopPodium
                leaderboard={data?.leaderboard ?? []}
                metric={metric}
                isLoading={isLoading}
              />
            </div>

            <LeaderboardTable
              leaderboard={data?.leaderboard ?? []}
              currentUserRank={data?.currentUser.rank ?? 0}
              totalPages={data?.totalPages ?? 0}
              currentPage={page}
              metric={metric}
              isLoading={isLoading}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
