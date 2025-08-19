'use client'

// Hooks
import { useCustomersAdmin } from '@/hooks/useCustomersAdmin'

// Components
import StatCard from '@/components/ui/StatCard'
import CustomerCard from '@/components/admin/CustomerCard'
import EmptyState from '@/components/ui/EmptyState'

export default function CustomersPage() {
  const {
    customers,
    loading,
    searchTerm,
    setSearchTerm,
    updatingStatus,
    updateBookingStatus,
    calculateStats
  } = useCustomersAdmin()

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">จัดการลูกค้าและการจอง</h1>
              <p className="text-gray-600">จัดการข้อมูลลูกค้า อนุมัติการจอง และติดตามสถานะ</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <span className="text-gray-700 text-sm font-medium">ลูกค้าทั้งหมด: {stats.totalCustomers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Professional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="ลูกค้าทั้งหมด"
            value={stats.totalCustomers}
            colorClass="text-gray-900"
            icon={
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          
          <StatCard
            title="การจองรวม"
            value={stats.totalBookings}
            colorClass="text-gray-900"
            icon={
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H9.5" />
              </svg>
            }
          />
          
          <StatCard
            title="รอดำเนินการ"
            value={stats.pendingBookings}
            colorClass="text-amber-600"
            icon={
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <StatCard
            title="อนุมัติ/ยืนยันแล้ว"
            value={stats.approvedBookings}
            colorClass="text-green-600"
            icon={
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
        </div>

        {/* Professional Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Customer Cards */}
        <div className="space-y-6">
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onStatusUpdate={updateBookingStatus}
              updatingStatus={updatingStatus}
            />
          ))}
        </div>

        {/* Empty State */}
        {customers.length === 0 && (
          <EmptyState
            title="ไม่พบข้อมูลลูกค้า"
            description="ยังไม่มีลูกค้าในระบบ"
            searchTerm={searchTerm || undefined}
          />
        )}
      </div>
    </div>
  )
}
