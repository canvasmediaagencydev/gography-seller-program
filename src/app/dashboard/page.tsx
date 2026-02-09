'use client'

import { useState } from 'react'
import { BsCalendar3, BsChevronDown } from 'react-icons/bs'
import {
  useSellerDashboard,
  useSoldTrips,
  useUpdateCommissionGoal
} from '@/hooks/use-seller-dashboard'
import {
  SummaryCards,
  SalesChart,
  CommissionGoalCard,
  SoldTripsTable
} from '@/components/dashboard'
import type { PeriodFilter, ChartPeriod, CommissionStatusFilter } from '@/types/dashboard'

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'week', label: 'สัปดาห์นี้' },
  { value: 'month', label: 'เดือนนี้' }
]

export default function SellerDashboard() {
  // Filter states
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(6)
  const [commissionFilter, setCommissionFilter] = useState<CommissionStatusFilter>('all')
  const [tablePage, setTablePage] = useState(1)

  // Data hooks
  const {
    stats,
    monthlySales,
    ranking,
    topTrips,
    isLoading,
    isError,
    errors
  } = useSellerDashboard(period, chartPeriod)

  const {
    data: soldTripsData,
    isLoading: isLoadingSoldTrips
  } = useSoldTrips(period, commissionFilter, tablePage)

  const updateGoalMutation = useUpdateCommissionGoal()

  // Error state
  if (isError) {
    return (
      <div className="w-full px-4 py-6 md:px-0 md:py-0">
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
          <div className="text-center">
            <div className="text-6xl mb-4">
              <span role="img" aria-label="error">!</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 mb-4">
              ไม่สามารถโหลดข้อมูล Dashboard ได้
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-secondary-blue transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900">รายงานการขายทั้งหมด</h1>

        {/* Period Filter Dropdown */}
        <div className="relative flex items-center gap-2">
          <BsCalendar3 className="w-4 h-4 text-gray-500" />
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as PeriodFilter)
              setTablePage(1) // Reset page when filter changes
            }}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white cursor-pointer"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <BsChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <SummaryCards
          stats={stats?.stats}
          ranking={ranking?.ranking}
          isLoading={isLoading}
          period={period}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Sales Chart - Takes 3 columns on lg */}
        <div className="lg:col-span-3">
          <SalesChart
            data={monthlySales?.data}
            stats={stats?.stats}
            isLoading={isLoading}
            selectedPeriod={chartPeriod}
            onPeriodChange={setChartPeriod}
          />
        </div>

        {/* Right Column - Commission Goal with Top Trips */}
        <div className="lg:col-span-2">
          <CommissionGoalCard
            commissionGoal={stats?.commissionGoal}
            topTrips={topTrips?.trips}
            isLoading={isLoading}
            onUpdateGoal={(goal) => updateGoalMutation.mutate(goal)}
            isUpdating={updateGoalMutation.isPending}
          />
        </div>
      </div>

      {/* Sold Trips Table */}
      <SoldTripsTable
        trips={soldTripsData?.trips}
        isLoading={isLoadingSoldTrips}
        totalCount={soldTripsData?.totalCount || 0}
        currentPage={soldTripsData?.currentPage || 1}
        totalPages={soldTripsData?.totalPages || 1}
        commissionFilter={commissionFilter}
        onCommissionFilterChange={(filter) => {
          setCommissionFilter(filter)
          setTablePage(1)
        }}
        onPageChange={setTablePage}
      />
    </div>
  )
}
