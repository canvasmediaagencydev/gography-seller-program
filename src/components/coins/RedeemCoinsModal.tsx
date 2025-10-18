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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CoinsIcon, BanknoteIcon, AlertCircle, CheckCircle } from 'lucide-react'
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
  const [selectedBankAccount, setSelectedBankAccount] = useState('')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchBankAccounts()
  }, [])

  const fetchBankAccounts = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('seller_id', user.id)
        .order('is_primary', { ascending: false })

      if (error) throw error

      setBankAccounts(data || [])

      // Auto-select primary account
      const primaryAccount = data?.find(acc => acc.is_primary)
      if (primaryAccount) {
        setSelectedBankAccount(primaryAccount.id)
      }
    } catch (err: any) {
      console.error('Error fetching bank accounts:', err)
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

    if (!selectedBankAccount) {
      setError('Please select a bank account')
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
          bank_account_id: selectedBankAccount
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
        <DialogContent>
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Redemption Request Submitted!</h3>
            <p className="text-muted-foreground">
              Your request to redeem {parseFloat(coinAmount).toLocaleString()} coins has been submitted successfully.
              An admin will review and process your request soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CoinsIcon className="h-5 w-5 text-yellow-500" />
            Redeem Coins
          </DialogTitle>
          <DialogDescription>
            Convert your coins to cash. 1 coin = 1 THB
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Balance */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
              {currentBalance.toLocaleString()} coins
            </p>
          </div>

          {/* Coin Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="coin-amount">Coin Amount</Label>
            <Input
              id="coin-amount"
              type="number"
              min="1"
              max={currentBalance}
              step="1"
              value={coinAmount}
              onChange={(e) => setCoinAmount(e.target.value)}
              placeholder="Enter amount to redeem"
              required
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum: 1 coin</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setCoinAmount(currentBalance.toString())}
              >
                Use maximum
              </Button>
            </div>
          </div>

          {/* Cash Amount Display */}
          {coinAmount && parseFloat(coinAmount) > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BanknoteIcon className="h-5 w-5 text-green-600 dark:text-green-500" />
                  <span className="font-medium">You will receive:</span>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-500">
                  {cashAmount.toLocaleString()} THB
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Conversion rate: 1 coin = {conversionRate} THB
              </p>
            </div>
          )}

          {/* Bank Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="bank-account">Bank Account</Label>
            {bankAccounts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No bank account found. Please add a bank account in your profile first.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount} required>
                <SelectTrigger id="bank-account">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_number} ({account.account_name})
                      {account.is_primary && ' (Primary)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || bankAccounts.length === 0}>
              {loading ? 'Processing...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
