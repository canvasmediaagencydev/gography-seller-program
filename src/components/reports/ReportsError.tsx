interface ReportsErrorProps {
  message?: string
}

export default function ReportsError({ message = 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน' }: ReportsErrorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">รายงานยอดขาย</h1>
        <p className="mt-1 text-sm text-gray-600">
          รายงานสถิติการขายและการจองของ Seller
        </p>
      </div>
      
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">เกิดข้อผิดพลาด</h3>
        <p className="mt-1 text-sm text-gray-500">{message}</p>
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    </div>
  )
}
