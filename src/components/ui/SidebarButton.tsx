import Link from 'next/link'
import { ReactNode } from 'react'

interface SidebarButtonProps {
  icon: ReactNode
  label: string
  href: string
  isActive: boolean
}

export default function SidebarButton({ icon, label, href, isActive }: SidebarButtonProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-full text-lg font-medium transition-colors ${
        isActive
          ? 'bg-gray-800 text-white'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
