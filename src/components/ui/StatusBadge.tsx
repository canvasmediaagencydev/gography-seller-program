interface StatusBadgeProps {
  status: string | null
  className?: string
}

const STATUS_STYLES = {
  'approved': 'bg-green-50 text-green-700 border border-green-200',
  'confirmed': 'bg-green-50 text-green-700 border border-green-200',
  'pending': 'bg-amber-50 text-amber-700 border border-amber-200',
  'cancelled': 'bg-red-50 text-red-700 border border-red-200',
  'rejected': 'bg-red-50 text-red-700 border border-red-200'
} as const

const STATUS_LABELS = {
  'approved': 'อนุมัติแล้ว',
  'confirmed': 'ยืนยันแล้ว',
  'pending': 'รอดำเนินการ',
  'cancelled': 'ยกเลิกแล้ว',
  'rejected': 'ปฏิเสธ'
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
