'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BanknoteIcon, CheckCircle, XCircle, Clock, AlertCircle, CoinsIcon } from 'lucide-react'
import { format } from 'date-fns'
import { LoadingSystem } from '@/components/ui'

interface Redemption {
  id: string
  seller_id: string
  coin_amount: number
  cash_amount: number
  conversion_rate: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  requested_at: string
  approved_at: string | null
  paid_at: string | null
  rejection_reason: string | null
  notes: string | null
  seller: {
    id: string
    full_name: string | null
    email: string | null
  }
  bank_account: {
    bank_name: string
    account_number: string
    account_name: string
  }
  approver: {
    full_name: string | null
    email: string | null
  } | null
}

export function RedemptionRequests() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRedemptions()
  }, [statusFilter])

  const fetchRedemptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/coins/redemptions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch redemptions')

      const data = await response.json()
      setRedemptions(data.redemptions)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openActionModal = (redemption: Redemption) => {
    setSelectedRedemption(redemption)
    setShowActionModal(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock, color: 'text-orange-500' },
      approved: { variant: 'default', icon: CheckCircle, color: 'text-blue-500' },
      rejected: { variant: 'destructive', icon: XCircle, color: 'text-red-500' },
      paid: { variant: 'outline', icon: CheckCircle, color: 'text-green-500' }
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="capitalize">
        <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
        {status}
      </Badge>
    )
  }

  if (loading) return <LoadingSystem />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Redemption Requests</h2>
          <p className="text-muted-foreground">Review and process coin redemption requests</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Redemptions List */}
      <div className="space-y-4">
        {redemptions.map((redemption) => (
          <Card key={redemption.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">
                      {redemption.seller.full_name || redemption.seller.email}
                    </h3>
                    {getStatusBadge(redemption.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Coins</p>
                      <p className="font-bold text-yellow-600 dark:text-yellow-500">
                        {redemption.coin_amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cash (THB)</p>
                      <p className="font-bold text-green-600 dark:text-green-500">
                        {redemption.cash_amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank</p>
                      <p className="font-medium">{redemption.bank_account.bank_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {redemption.bank_account.account_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Requested</p>
                      <p className="font-medium">
                        {format(new Date(redemption.requested_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(redemption.requested_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>

                  {redemption.rejection_reason && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Rejection reason:</span> {redemption.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="ml-4">
                  {redemption.status === 'pending' && (
                    <Button onClick={() => openActionModal(redemption)} size="sm">
                      Review
                    </Button>
                  )}
                  {redemption.status === 'approved' && (
                    <Button onClick={() => openActionModal(redemption)} variant="outline" size="sm">
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {redemptions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BanknoteIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No redemption requests found</p>
          </CardContent>
        </Card>
      )}

      {/* Action Modal */}
      {showActionModal && selectedRedemption && (
        <ActionModal
          redemption={selectedRedemption}
          onClose={() => {
            setShowActionModal(false)
            setSelectedRedemption(null)
          }}
          onSuccess={() => {
            setShowActionModal(false)
            setSelectedRedemption(null)
            fetchRedemptions()
          }}
        />
      )}
    </div>
  )
}

function ActionModal({
  redemption,
  onClose,
  onSuccess
}: {
  redemption: Redemption
  onClose: () => void
  onSuccess: () => void
}) {
  const [action, setAction] = useState<'approve' | 'reject' | 'paid'>('approve')
  const [rejectionReason, setRejectionReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (action === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/coins/redemptions/${redemption.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'paid',
          rejection_reason: action === 'reject' ? rejectionReason : undefined,
          notes: notes || undefined
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update redemption')

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isPending = redemption.status === 'pending'

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Redemption Request</DialogTitle>
          <DialogDescription>
            Review and take action on this coin redemption request
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Redemption Details */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Seller:</span>
              <span className="text-sm">{redemption.seller.full_name || redemption.seller.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Coins:</span>
              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-500">
                {redemption.coin_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Cash (THB):</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-500">
                {redemption.cash_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Bank:</span>
              <span className="text-sm">
                {redemption.bank_account.bank_name} - {redemption.bank_account.account_number}
              </span>
            </div>
          </div>

          {isPending ? (
            <>
              {/* Action Selection */}
              <div className="space-y-2">
                <Label>Action *</Label>
                <Select value={action} onValueChange={(v: any) => setAction(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rejection Reason */}
              {action === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejection_reason">Rejection Reason *</Label>
                  <Textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label>Action</Label>
              <p className="text-sm text-muted-foreground">
                Mark this approved redemption as paid
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

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
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : isPending ? (action === 'approve' ? 'Approve' : 'Reject') : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
