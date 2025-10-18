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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GiftIcon, PlusIcon, EditIcon, ToggleLeftIcon, ToggleRightIcon, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { LoadingSystem } from '@/components/ui'

interface Campaign {
  id: string
  title: string
  description: string | null
  campaign_type: string
  coin_amount: number
  target_trip_id: string | null
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  user_profiles: {
    full_name: string | null
    email: string | null
  }
}

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/coins/campaigns')
      if (!response.ok) throw new Error('Failed to fetch campaigns')

      const data = await response.json()
      setCampaigns(data.campaigns)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleCampaign = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/coins/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update campaign')

      fetchCampaigns()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  if (loading) return <LoadingSystem />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Management</h2>
          <p className="text-muted-foreground">Create and manage bonus campaigns</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Campaigns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className={!campaign.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {campaign.title}
                    <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                      {campaign.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {campaign.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                <p className="text-sm text-muted-foreground">Reward</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                  {campaign.coin_amount.toLocaleString()} coins
                </p>
              </div>

              <div className="text-sm space-y-1">
                <p><span className="font-medium">Type:</span> {campaign.campaign_type}</p>
                <p><span className="font-medium">Start:</span> {format(new Date(campaign.start_date), 'MMM d, yyyy')}</p>
                <p><span className="font-medium">End:</span> {format(new Date(campaign.end_date), 'MMM d, yyyy')}</p>
                <p><span className="font-medium">Created by:</span> {campaign.user_profiles.full_name || campaign.user_profiles.email}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCampaign(campaign.id, campaign.is_active)}
                  className="flex-1"
                >
                  {campaign.is_active ? (
                    <><ToggleRightIcon className="h-4 w-4 mr-1" /> Deactivate</>
                  ) : (
                    <><ToggleLeftIcon className="h-4 w-4 mr-1" /> Activate</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <GiftIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No campaigns yet. Create your first campaign!</p>
          </CardContent>
        </Card>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchCampaigns()
          }}
        />
      )}
    </div>
  )
}

function CreateCampaignModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    campaign_type: 'general',
    coin_amount: '',
    start_date: '',
    end_date: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/coins/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          coin_amount: parseFloat(formData.coin_amount)
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create campaign')

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Create a bonus campaign to incentivize sellers
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign_type">Campaign Type *</Label>
            <Select
              value={formData.campaign_type}
              onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}
            >
              <SelectTrigger id="campaign_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="trip_specific">Trip Specific</SelectItem>
                <SelectItem value="date_specific">Date Specific</SelectItem>
                <SelectItem value="sales_milestone">Sales Milestone</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
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
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
