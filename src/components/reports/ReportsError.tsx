interface ReportsErrorProps {
  message?: string
}

export default function ReportsError({ message = 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน' }: ReportsErrorProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">รายงานการขาย</h1>
            <p className="mt-1 text-gray-600">
              ภาพรวมและสถิติการจองของคุณ
            </p>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="text-center py-16">
          <div className="mx-auto h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่สามารถโหลดข้อมูลได้</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
