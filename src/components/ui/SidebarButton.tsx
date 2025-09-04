import { ReactNode, memo, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SidebarButtonProps {
  icon: ReactNode
  label: string
  href: string
  isActive: boolean
  prefetch?: boolean
}

const SidebarButton = memo(function SidebarButton({ icon, label, href, isActive, prefetch = true }: SidebarButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Lightning-fast navigation with fallback
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isActive && !isNavigating) {
      setIsNavigating(true)
      
      // Try instant router navigation
      router.push(href)
      
      // Fallback to browser navigation if still slow
      const timeoutId = setTimeout(() => {
        if (isNavigating) {
          window.location.assign(href)
        }
        setIsNavigating(false)
      }, 50) // Very quick fallback
      
      // Cancel fallback if navigation succeeds quickly
      setTimeout(() => {
        clearTimeout(timeoutId)
        setIsNavigating(false)
      }, 100)
    }
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={isActive || isNavigating}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-lg font-medium transition-all duration-75 cursor-pointer ${
        isActive
          ? 'bg-gray-800 text-white shadow-sm'
          : isNavigating
          ? 'bg-blue-50 text-blue-700 scale-95'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 active:scale-95'
      } disabled:cursor-default`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-left">{label}</span>
    </button>
  )
})

export default SidebarButton
