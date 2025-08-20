interface StatusBadgeProps {
  status: string | null
  className?: string
}

const STATUS_STYLES = {
  'pending': 'bg-amber-50 text-amber-700 border border-amber-200',
  'inprogress': 'bg-blue-50 text-blue-700 border border-blue-200',
  'approved': 'bg-green-50 text-green-700 border border-green-200',
  'rejected': 'bg-red-50 text-red-700 border border-red-200',
  'cancelled': 'bg-gray-50 text-gray-700 border border-gray-200'
} as const

const STATUS_LABELS = {
  'pending': 'รอดำเนินการ',
  'inprogress': 'กำลังดำเนินการ',
  'approved': 'ผ่านการยืนยัน',
  'rejected': 'แอดมินยกเลิก',
  'cancelled': 'ลูกค้าายกเลิก'
} as const

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null
  
  const statusKey = status as keyof typeof STATUS_STYLES
  const style = STATUS_STYLES[statusKey] || 'bg-gray-50 text-gray-700 border border-gray-200'
  const label = STATUS_LABELS[statusKey] || status

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${style} ${className}`}>
      {label}
    </span>
  )
}
