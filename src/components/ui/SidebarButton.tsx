import { ReactNode, memo, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface SidebarButtonProps {
  icon: ReactNode
  label: string
  href: string
  isActive: boolean
  prefetch?: boolean
  onClick?: () => void
}

const SidebarButton = memo(function SidebarButton({ icon, label, href, isActive, prefetch = true, onClick }: SidebarButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Instant navigation with startTransition for better UX
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Call onClick callback if provided (for mobile sidebar close)
    if (onClick) {
      onClick()
    }

    if (!isActive) {
      // Use startTransition for non-blocking navigation
      startTransition(() => {
        router.push(href)
      })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isActive || isPending}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-lg font-medium transition-all duration-75 cursor-pointer ${
        isActive
          ? 'bg-gray-800 text-white shadow-sm'
          : isPending
          ? 'bg-blue-50 text-blue-700 scale-95 animate-pulse'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 active:scale-95'
      } disabled:cursor-default`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-left">{label}</span>
      {isPending && (
        <div className="ml-auto">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  )
})

export default SidebarButton
