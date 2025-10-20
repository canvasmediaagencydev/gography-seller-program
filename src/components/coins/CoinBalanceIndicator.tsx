'use client'

import { useState, useEffect } from 'react'
import { CoinsIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface CoinBalance {
  balance: number
}

interface CoinBalanceIndicatorProps {
  userId: string
  variant?: 'sidebar' | 'mobile' | 'header'
  showLabel?: boolean
}

export function CoinBalanceIndicator({
  userId,
  variant = 'sidebar',
  showLabel = true
}: CoinBalanceIndicatorProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBalance()

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)

    // Listen for coin balance updates
    const handleCoinUpdate = () => {
      fetchBalance()
    }

    window.addEventListener('coinBalanceUpdated', handleCoinUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('coinBalanceUpdated', handleCoinUpdate)
    }
  }, [userId])

  const fetchBalance = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('seller_coins')
        .select('balance')
        .eq('seller_id', userId)
        .single()

      if (error) {
        // If no record exists yet, balance is 0
        if (error.code === 'PGRST116') {
          setBalance(0)
        } else {
          console.error('Error fetching coin balance:', error)
        }
      } else {
        setBalance(data?.balance || 0)
      }
    } catch (err) {
      console.error('Error fetching coin balance:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    if (variant === 'sidebar') {
      return (
        <div className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-br from-amber-50/50 via-yellow-50/50 to-amber-50/50 dark:from-yellow-900/10 dark:via-amber-900/10 dark:to-yellow-900/10 animate-pulse">
          <div className="p-2.5 bg-gradient-to-br from-amber-400/50 to-yellow-500/50 rounded-xl">
            <CoinsIcon className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col flex-1 gap-1.5">
            <div className="h-3 w-16 bg-amber-200 dark:bg-amber-800 rounded"></div>
            <div className="h-5 w-20 bg-amber-300 dark:bg-amber-700 rounded"></div>
          </div>
        </div>
      )
    }
    return (
      <div className={getContainerClass(variant)}>
        <CoinsIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
        {showLabel && <span className="text-sm text-muted-foreground">Loading...</span>}
      </div>
    )
  }

  if (variant === 'mobile') {
    return (
      <Link
        href="/dashboard/coins"
        className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-yellow-900/20 dark:to-amber-900/20 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-yellow-900/30 dark:hover:to-amber-900/30 transition-all duration-300 border border-amber-200/50 dark:border-yellow-800/50 shadow-sm hover:shadow overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        <div className="relative p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform duration-300">
          <CoinsIcon className="h-4 w-4 text-white" />
        </div>
        <div className="relative flex flex-col">
          {showLabel && <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Coins</span>}
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-amber-600 dark:text-amber-500">
              {balance?.toLocaleString() || '0'}
            </span>
            <span className="text-xs text-amber-500/70">coins</span>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'sidebar') {
    return (
      <Link
        href="/dashboard/coins"
        className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full  hover:from-amber-100 hover:via-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/30 dark:hover:via-amber-900/30 dark:hover:to-yellow-900/30 transition-all duration-300 shadow-md hover:shadow-md overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

        {/* Icon with gradient background and animation */}
        <div className="relative p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
          <CoinsIcon className="h-5 w-5 text-white" />
          {/* Sparkle effect */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
        </div>

        {/* Content */}
        <div className="relative flex flex-col flex-1 min-w-0">
          {showLabel && (
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
              My Coins
            </span>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-amber-600 dark:text-amber-500 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              {balance?.toLocaleString() || '0'}
            </span>
            <span className="text-xs font-semibold text-amber-500/70 dark:text-amber-600">
              coins
            </span>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="relative text-amber-400 dark:text-amber-600 group-hover:translate-x-1 transition-transform duration-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    )
  }

  // header variant
  return (
    <Link
      href="/dashboard/coins"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
    >
      <CoinsIcon className="h-4 w-4 text-yellow-500" />
      {showLabel && <span className="text-sm text-muted-foreground">Coins:</span>}
      <span className="font-bold text-yellow-600 dark:text-yellow-500">
        {balance?.toLocaleString() || '0'}
      </span>
    </Link>
  )
}

function getContainerClass(variant: 'sidebar' | 'mobile' | 'header') {
  switch (variant) {
    case 'sidebar':
      return 'flex items-center gap-3 px-4 py-3'
    case 'mobile':
      return 'flex items-center gap-2 px-3 py-2'
    case 'header':
      return 'flex items-center gap-2 px-3 py-1.5'
  }
}
