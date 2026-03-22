import React from 'react'
import Image from 'next/image'
import { UserCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { RankBadge } from './RankBadge'
import type { LeaderboardEntry, RankingMetric } from '@/app/api/seller/ranking/route'

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[]
  currentUserRank: number
  totalPages: number
  currentPage: number
  metric: RankingMetric
  isLoading?: boolean
  onPageChange: (page: number) => void
}

function formatValue(value: number, metric: RankingMetric): string {
  if (metric === 'bookings' || metric === 'coins') return value.toLocaleString('th-TH')
  return `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatRelativeValue(selfValue: number, otherValue: number, metric: RankingMetric): string {
  const diff = otherValue - selfValue
  if (diff === 0) return '—'
  const absDiff = Math.abs(diff)
  if (metric === 'bookings') return `${diff > 0 ? '+' : '-'}${absDiff.toLocaleString('th-TH')}`
  if (metric === 'coins') return `${diff > 0 ? '+' : '-'}${absDiff.toLocaleString('th-TH')}`
  const formatted = absDiff >= 1_000_000
    ? `${(absDiff / 1_000_000).toFixed(1)}M`
    : absDiff >= 1_000
      ? `${(absDiff / 1_000).toFixed(0)}K`
      : absDiff.toLocaleString('th-TH')
  return diff > 0 ? `+฿${formatted}` : `-฿${formatted}`
}

const METRIC_COLUMN_LABEL: Record<RankingMetric, string> = {
  sales: 'ยอดขาย',
  commission: 'คอมมิชชั่น',
  coins: 'Coins',
  bookings: 'Booking',
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
      <td className="px-5 py-4"><div className="h-3.5 bg-slate-100 rounded-full w-5 animate-pulse" /></td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex-shrink-0 animate-pulse" />
          <div className="h-3.5 bg-slate-100 rounded-full w-28 animate-pulse" />
        </div>
      </td>
      <td className="px-5 py-4 text-right"><div className="h-3.5 bg-slate-100 rounded-full w-20 ml-auto animate-pulse" /></td>
      <td className="px-5 py-4 text-right hidden sm:table-cell"><div className="h-3.5 bg-slate-100 rounded-full w-14 ml-auto animate-pulse" /></td>
    </tr>
  )
}

function getPageNumbers(totalPages: number, currentPage: number): number[] {
  const total = Math.min(totalPages, 5)
  return Array.from({ length: total }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (currentPage <= 3) return i + 1
    if (currentPage >= totalPages - 2) return totalPages - 4 + i
    return currentPage - 2 + i
  })
}

function getTop3RowBg(rank: number, isSelf: boolean): string {
  if (isSelf) return ''
  if (rank === 1) return 'bg-amber-50/50'
  if (rank === 2) return 'bg-slate-50/60'
  if (rank === 3) return 'bg-orange-50/30'
  return ''
}

export function LeaderboardTable({
  leaderboard, currentUserRank, totalPages, currentPage, metric, isLoading, onPageChange,
}: LeaderboardTableProps) {
  const selfEntry = leaderboard.find(e => e.isSelf)
  const selfValue = selfEntry?.value ?? 0
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header bar — matches site table header pattern */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg">
              <span className="text-base leading-none">🏅</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">อันดับทั้งหมด</h3>
              <p className="text-xs text-gray-500 mt-0.5">รายชื่อ Seller ทุกคน</p>
            </div>
          </div>
          {currentUserRank > 0 && (
            <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
              <span className="text-sm text-gray-600">ตำแหน่งคุณ: </span>
              <span className="text-sm font-bold text-blue-600">#{currentUserRank}</span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-100">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-14">#</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Seller</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{METRIC_COLUMN_LABEL[metric]}</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">vs คุณ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)
              : leaderboard.map((entry, idx) => {
                  const isTop3 = entry.rank <= 3
                  const top3Bg = getTop3RowBg(entry.rank, entry.isSelf)
                  return (
                    <tr
                      key={entry.rank}
                      className={`transition-colors ${
                        entry.isSelf
                          ? 'bg-blue-50/70 border-l-[3px] border-l-[#2c6ba8]'
                          : isTop3
                            ? `${top3Bg} hover:brightness-95`
                            : idx % 2 !== 0
                              ? 'bg-slate-50/50 hover:bg-slate-50'
                              : 'bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-5 py-3.5">
                        {isTop3 ? (
                          <span className="text-base leading-none">{medals[entry.rank - 1]}</span>
                        ) : (
                          <span className={`text-sm font-mono tabular-nums ${
                            entry.isSelf ? 'font-bold text-[#2c6ba8]' : 'text-gray-400'
                          }`}>
                            {entry.rank}
                          </span>
                        )}
                      </td>

                      {/* Seller */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center ${
                            entry.isSelf
                              ? 'ring-2 ring-[#2c6ba8] ring-offset-1'
                              : 'border border-gray-200'
                          }`}>
                            {entry.avatarUrl ? (
                              <Image src={entry.avatarUrl} alt={entry.sellerName} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                            ) : (
                              <UserCircleIcon className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-sm truncate leading-snug ${
                                entry.isSelf ? 'font-semibold text-[#2c6ba8]' : 'text-gray-700'
                              }`}>
                                {entry.sellerName}
                              </p>
                              {entry.isSelf && (
                                <span className="text-[10px] font-semibold text-[#2c6ba8] bg-blue-100 rounded px-1.5 py-0.5 leading-none flex-shrink-0">
                                  คุณ
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5">
                              <RankBadge rank={entry.rank} totalSellers={0} size="sm" showLabel={false} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Value */}
                      <td className="px-5 py-3.5 text-right">
                        {entry.isSelf ? (
                          <span className="font-semibold text-gray-800">
                            {formatValue(entry.value, metric)}
                          </span>
                        ) : (
                          <span
                            className="text-gray-400 blur-[4px] hover:blur-none transition-all duration-200 cursor-default select-none"
                            title="วางเมาส์เพื่อดู"
                          >
                            {formatValue(entry.value, metric)}
                          </span>
                        )}
                      </td>

                      {/* Relative diff */}
                      <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                        {entry.isSelf ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                            entry.value > selfValue
                              ? 'text-red-500 bg-red-50'
                              : entry.value < selfValue
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-gray-400'
                          }`}>
                            {formatRelativeValue(selfValue, entry.value, metric)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-4 border-t border-gray-100 bg-slate-50/40 flex items-center justify-between gap-4">
          <span className="text-xs text-gray-400">
            หน้า <span className="font-semibold text-gray-600">{currentPage}</span> / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>
            {getPageNumbers(totalPages, currentPage).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                  pageNum === currentPage
                    ? 'bg-[#2c6ba8] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
