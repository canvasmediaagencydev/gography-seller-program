import { Pagination } from '@/components/ui/Pagination'
import { HistoryIcon, CoinsIcon, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface CoinTransactionHistoryProps {
  transactions: CoinTransaction[]
  currentPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  transactionType: string
  onTransactionTypeChange: (type: string) => void
  startDate: string
  onStartDateChange: (date: string) => void
  endDate: string
  onEndDateChange: (date: string) => void
}

export function CoinTransactionHistory({
  transactions,
  currentPage,
  totalPages,
  totalCount,
  onPageChange
}: CoinTransactionHistoryProps) {

  const getTransactionBadge = (type: string, amount: number) => {
    const isPositive = amount > 0

    const statusConfig: Record<string, { label: string; bg: string; icon: any }> = {
      earn: {
        label: 'ได้รับ',
        bg: 'bg-green-50 text-green-700',
        icon: <TrendingUp className="w-3.5 h-3.5" />
      },
      bonus: {
        label: 'โบนัส',
        bg: 'bg-blue-50 text-blue-700',
        icon: <CoinsIcon className="w-3.5 h-3.5" />
      },
      redeem: {
        label: 'แลก',
        bg: 'bg-purple-50 text-purple-700',
        icon: <TrendingDown className="w-3.5 h-3.5" />
      },
      adjustment: {
        label: 'ปรับปรุง',
        bg: isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
        icon: <CoinsIcon className="w-3.5 h-3.5" />
      }
    }

    const config = statusConfig[type] || statusConfig.earn

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${config.bg}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const getSourceBadge = (sourceType: string) => {
    const sourceLabels: Record<string, string> = {
      booking: 'การจอง',
      sales_target: 'เป้าหมายยอดขาย',
      referral: 'แนะนำเพื่อน',
      campaign: 'แคมเปญ',
      admin: 'Admin'
    }

    return (
      <span className="text-xs text-gray-500">
        {sourceLabels[sourceType] || sourceType}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg">
              <HistoryIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">ประวัติการทำรายการ</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                ติดตามและตรวจสอบรายการ Coins ทั้งหมด
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
              <span className="text-sm text-gray-600">แสดง </span>
              <span className="text-sm font-bold text-gray-900">{transactions.length}</span>
              <span className="text-sm text-gray-600"> จาก </span>
              <span className="text-sm font-bold text-gray-900">{totalCount}</span>
              <span className="text-sm text-gray-600"> รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-16">
          <HistoryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">ไม่พบรายการ</p>
          <p className="text-sm text-gray-400 mt-1">ลองเปลี่ยนตัวกรองเพื่อค้นหารายการอื่น</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    รายละเอียด
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    จำนวน Coins
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    คงเหลือหลังทำรายการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => {
                  const isPositive = transaction.amount > 0

                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {transaction.description}
                          </p>
                          {getSourceBadge(transaction.source_type)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-900">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(transaction.created_at).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {getTransactionBadge(transaction.transaction_type, transaction.amount)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-lg font-bold ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isPositive ? '+' : ''}{transaction.amount.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">coins</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {transaction.balance_after.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">coins</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
