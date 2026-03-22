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

        {/* Hero Banner — Premium Dark Gradient */}
        <div className="relative overflow-hidden bg-[#091321] rounded-[2rem] shadow-2xl shadow-blue-900/20 mb-8 border border-white/10">
          {/* Animated Orbs & Noise */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-[#176daf] rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse-slow" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] bg-[#11284a] rounded-full mix-blend-screen filter blur-[120px] opacity-60" />
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner max-w-fit">
                  <span className="text-3xl leading-none filter drop-shadow-md">🏆</span>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Leaderboard</h1>
                  <p className="text-blue-200/80 text-sm mt-1 font-medium">จัดอันดับและแข่งขัน Seller</p>
                </div>
              </div>

              {/* Period Filter */}
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 self-start sm:self-auto shadow-inner">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handlePeriodChange(opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                      period === opt.value
                        ? 'bg-gradient-to-r from-[#2c6ba8] to-[#4a8fcf] text-white shadow-lg shadow-blue-500/30 ring-1 ring-white/20 scale-100'
                        : 'text-blue-100/70 hover:bg-white/10 hover:text-white scale-95 hover:scale-100'
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
        <div className="flex gap-2.5 mb-8 overflow-x-auto pb-2 hide-scrollbar">
          {METRIC_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleMetricChange(opt.value)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 border focus:outline-none ${
                metric === opt.value
                  ? 'bg-gradient-to-r from-[#091321] to-[#11284a] border-[#11284a] text-white shadow-xl shadow-[#11284a]/20 scale-105 transform origin-left ring-2 ring-[#2c6ba8]/30 ring-offset-1 ring-offset-[#f8fafc]'
                  : 'bg-white/80 backdrop-blur-lg border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 hover:text-gray-900 shadow-sm hover:shadow active:scale-95'
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
