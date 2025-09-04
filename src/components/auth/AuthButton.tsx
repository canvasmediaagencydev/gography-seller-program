'use client'

import { ReactNode } from 'react'

interface AuthButtonProps {
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  icon?: ReactNode
  loadingIcon?: ReactNode
}

const defaultLoadingIcon = (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

export default function AuthButton({
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  loadingText,
  children,
  variant = 'primary',
  icon,
  loadingIcon = defaultLoadingIcon
}: AuthButtonProps) {
  const baseClasses = "w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
  
  const variantClasses = {
    primary: "border border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500"
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {loading ? (
        <>
          {loadingIcon}
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}