'use client'

import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import type { MonthlySalesData, ChartPeriod, DashboardStats } from '@/types/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

interface SalesChartProps {
  data: MonthlySalesData[] | undefined
  stats?: DashboardStats | undefined
  isLoading: boolean
  selectedPeriod: ChartPeriod
  onPeriodChange: (period: ChartPeriod) => void
}

const PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = [
  { value: 3, label: '3 เดือน' },
  { value: 6, label: '6 เดือน' },
  { value: 12, label: '12 เดือน' }
]

function formatCurrency(value: number): string {
  return value.toLocaleString()
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const salesPayload = payload.find((p: any) => p.dataKey === 'sales')
    const commissionPayload = payload.find((p: any) => p.dataKey === 'commission')
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-[#FF6B35]">
            ยอดขาย: <span className="font-semibold">{salesPayload?.value?.toLocaleString()} บาท</span>
          </p>
          <p className="text-sm text-[#C4B5A0]">
            คอมมิชชั่น: <span className="font-semibold">{commissionPayload?.value?.toLocaleString()} บาท</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

// Custom X-axis tick showing commission value and month name
function CustomXAxisTick({ x, y, payload, visibleTicksCount, chartData }: any) {
  const item = chartData?.find((d: any) => d.name === payload.value)
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle" fill="#374151" fontSize={12} fontWeight={500}>
        {item?.commission ? `${item.commission.toLocaleString()}.-` : ''}
      </text>
      <text x={0} y={16} dy={14} textAnchor="middle" fill="#9ca3af" fontSize={11}>
        {payload.value}
      </text>
    </g>
  )
}

export default function SalesChart({
  data,
  stats,
  isLoading,
  selectedPeriod,
  onPeriodChange
}: SalesChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const chartData = data?.map(d => ({
    name: d.monthLabel.split(' ')[0],
    sales: d.sales,
    commission: d.commission
  })) || []

  // Calculate total sales from data if stats not provided
  const totalSales = stats?.totalSales || data?.reduce((sum, d) => sum + d.sales, 0) || 0

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-base font-medium text-[#FF6B35] mb-1">สรุปยอดขายรวม</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalSales)}.-
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(parseInt(e.target.value) as ChartPeriod)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white"
          >
            {PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF6B35]" />
          <span className="text-sm text-gray-600">ยอดขายรวม</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#C4B5A0]" />
          <span className="text-sm text-gray-600">คอมมิชชั่น</span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>ยังไม่มีข้อมูลยอดขาย</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={(props: any) => <CustomXAxisTick {...props} chartData={chartData} />}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              interval={0}
              height={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar
              dataKey="commission"
              stackId="stack"
              fill="#C4B5A0"
              maxBarSize={50}
            />
            <Bar
              dataKey="sales"
              stackId="stack"
              fill="#FF6B35"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
