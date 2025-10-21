'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CoinsIcon, BanknoteIcon, AlertCircle, CheckCircle, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  account_name: string
  is_primary: boolean
}

interface RedeemCoinsModalProps {
  currentBalance: number
  onClose: () => void
  onSuccess: () => void
}

export function RedeemCoinsModal({ currentBalance, onClose, onSuccess }: RedeemCoinsModalProps) {
  const [coinAmount, setCoinAmount] = useState('')
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchBankAccount()
  }, [])

  const fetchBankAccount = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('seller_id', user.id)
        .single()

      if (error) throw error

      setBankAccount(data)
    } catch (err: any) {
      console.error('Error fetching bank account:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amount = parseFloat(coinAmount)

    // Validation
    if (!amount || amount <= 0) {
      setError('Please enter a valid coin amount')
      return
    }

    if (amount > currentBalance) {
      setError(`Insufficient balance. You have ${currentBalance.toLocaleString()} coins available.`)
      return
    }

    if (!bankAccount) {
      setError('Please add a bank account in your profile first')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/coins/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coin_amount: amount,
          bank_account_id: bankAccount.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create redemption request')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cashAmount = parseFloat(coinAmount) || 0
  const conversionRate = 1.0

  if (success) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <div className="text-center py-6">
            <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-9 w-9 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Request Submitted!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your request to redeem <span className="font-semibold text-gray-900">{parseFloat(coinAmount).toLocaleString()} coins</span> has been submitted.
            </p>
            <p className="text-xs text-gray-500">
              An admin will review and process your request soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Redeem Coins</DialogTitle>
          <DialogDescription>
            Convert your coins to cash (1 coin = 1 THB)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Current Balance */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div>
              <p className="text-xs text-gray-600 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-yellow-700">
                {currentBalance.toLocaleString()}
              </p>
            </div>
            <CoinsIcon className="h-8 w-8 text-yellow-600" />
          </div>

          {/* Coin Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="coin-amount">Amount to Redeem</Label>
            <div className="relative">
              <Input
                id="coin-amount"
                type="number"
                min="1"
                max={currentBalance}
                step="1"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                placeholder="Enter amount"
                className="pr-16"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                coins
              </span>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setCoinAmount(currentBalance.toString())}
              >
                Use all
              </Button>
            </div>
          </div>

          {/* Cash Amount Display */}
          {coinAmount && parseFloat(coinAmount) > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BanknoteIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">You will receive</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  ฿{cashAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Bank Account Display */}
          <div className="space-y-2">
            <Label>Bank Account</Label>
            {!bankAccount ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No bank account found. Please add one in your profile first.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{bankAccount.bank_name}</p>
                    <p className="text-sm font-mono text-gray-600">{bankAccount.account_number}</p>
                    <p className="text-sm text-gray-500">{bankAccount.account_name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !bankAccount}
            >
              {loading ? 'Processing...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
