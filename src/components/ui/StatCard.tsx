interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  colorClass: string
  className?: string
}

export default function StatCard({
  title,
  value,
  icon,
  colorClass,
  className = ''
}: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-semibold ${colorClass}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 ${colorClass.replace('text-', 'bg-').replace('-600', '-50')} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
