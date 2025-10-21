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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SettingsIcon, EditIcon, AlertCircle, CoinsIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LoadingSystem } from '@/components/ui'

interface EarningRule {
  id: string
  rule_name: string
  rule_type: string
  coin_amount: number
  calculation_type: string
  is_active: boolean
  priority: number
  created_at: string
}

export function EarningRulesManager() {
  const [rules, setRules] = useState<EarningRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState<EarningRule | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('coin_earning_rules')
        .select('*')
        .order('priority', { ascending: false })

      if (error) throw error
      setRules(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (rule: EarningRule) => {
    setSelectedRule(rule)
    setShowEditModal(true)
  }

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      booking_approved: 'Booking Approved',
      sales_target_monthly: 'Monthly Sales Target',
      referral_first_sale: 'Referral First Sale',
      referral_signup: 'Referral Signup'
    }
    return labels[type] || type
  }

  if (loading) return <LoadingSystem />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Earning Rules</h2>
        <p className="text-muted-foreground">Manage how sellers earn coins</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {rule.rule_name}
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getRuleTypeLabel(rule.rule_type)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                <p className="text-sm text-muted-foreground">Coins Earned</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                  {rule.coin_amount.toLocaleString()} coins
                </p>
              </div>

              <div className="text-sm space-y-1">
                <p><span className="font-medium">Calculation:</span> {rule.calculation_type}</p>
                <p><span className="font-medium">Priority:</span> {rule.priority}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(rule)}
                className="w-full"
              >
                <EditIcon className="h-4 w-4 mr-1" />
                Edit Rule
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <SettingsIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No earning rules found</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Rule Modal */}
      {showEditModal && selectedRule && (
        <EditRuleModal
          rule={selectedRule}
          onClose={() => {
            setShowEditModal(false)
            setSelectedRule(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedRule(null)
            fetchRules()
          }}
        />
      )}
    </div>
  )
}

function EditRuleModal({
  rule,
  onClose,
  onSuccess
}: {
  rule: EarningRule
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    coin_amount: rule.coin_amount.toString(),
    is_active: rule.is_active,
    priority: rule.priority.toString()
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/coins/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin_amount: parseFloat(formData.coin_amount),
          is_active: formData.is_active,
          priority: parseInt(formData.priority)
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update rule')

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Edit Earning Rule</DialogTitle>
          <DialogDescription>
            Update the earning rule settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">{rule.rule_name}</p>
            <p className="text-xs text-muted-foreground">{rule.rule_type}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coin_amount">Coin Amount *</Label>
            <Input
              id="coin_amount"
              type="number"
              min="1"
              step="1"
              value={formData.coin_amount}
              onChange={(e) => setFormData({ ...formData, coin_amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              min="0"
              step="1"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Higher priority rules are evaluated first
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-400">
            <div>
              <Label htmlFor="is_active">Active Status</Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable this rule
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              className='bg-white'
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
              {loading ? 'Updating...' : 'Update Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
