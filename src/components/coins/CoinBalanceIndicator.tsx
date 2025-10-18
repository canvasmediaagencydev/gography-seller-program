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
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
      >
        <CoinsIcon className="h-5 w-5 text-yellow-500" />
        <div className="flex flex-col">
          {showLabel && <span className="text-xs text-muted-foreground">Coins</span>}
          <span className="font-bold text-yellow-600 dark:text-yellow-500">
            {balance?.toLocaleString() || '0'}
          </span>
        </div>
      </Link>
    )
  }

  if (variant === 'sidebar') {
    return (
      <Link
        href="/dashboard/coins"
        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors border border-yellow-200 dark:border-yellow-800"
      >
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
          <CoinsIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
        </div>
        <div className="flex flex-col flex-1">
          {showLabel && <span className="text-xs text-muted-foreground font-medium">My Coins</span>}
          <span className="text-lg font-bold text-yellow-600 dark:text-yellow-500">
            {balance?.toLocaleString() || '0'}
          </span>
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
