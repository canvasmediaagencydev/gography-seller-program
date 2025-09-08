'use client'

import { ReactNode } from 'react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: ReactNode
  error?: string
  errorId?: string
}

export default function AuthLayout({ children, title, subtitle, error, errorId }: AuthLayoutProps) {
  useEffect(() => {
    // Pre-initialize Supabase client and auth session
    const supabase = createClient()
    supabase.auth.getSession()
  }, [])

  return (
    <div className="lg:min-h-screen h-full flex items-center justify-center bg-gradient-to-br md:py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full py-8 md:py-0">
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6 sm:p-8 will-change-auto">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center mb-4 sm:h-16 sm:w-16 flex-shrink-0">
              <svg className="h-7 w-7 text-white sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl min-h-[28px] sm:min-h-[32px]">{title}</h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed min-h-[20px]">{subtitle}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4" role="alert" aria-live="polite" id={errorId}>
              <div className="flex items-start">
                <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-red-700 text-sm leading-relaxed">{error}</div>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}