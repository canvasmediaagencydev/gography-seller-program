import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GiftIcon, CalendarIcon, CoinsIcon, TargetIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Campaign {
  id: string
  title: string
  description: string
  campaign_type: 'trip_specific' | 'date_specific' | 'sales_milestone' | 'general'
  coin_amount: number
  target_trip_id: string | null
  start_date: string
  end_date: string
}

interface ActiveCampaignsProps {
  campaigns: Campaign[]
}

const getCampaignTypeIcon = (type: string) => {
  switch (type) {
    case 'trip_specific':
      return <TargetIcon className="h-4 w-4" />
    case 'date_specific':
      return <CalendarIcon className="h-4 w-4" />
    case 'sales_milestone':
      return <CoinsIcon className="h-4 w-4" />
    default:
      return <GiftIcon className="h-4 w-4" />
  }
}

const getCampaignTypeBadge = (type: string) => {
  const labels: Record<string, string> = {
    trip_specific: 'Trip Specific',
    date_specific: 'Date Specific',
    sales_milestone: 'Sales Milestone',
    general: 'General'
  }

  return (
    <Badge variant="outline" className="capitalize">
      {labels[type] || type}
    </Badge>
  )
}

export function ActiveCampaigns({ campaigns }: ActiveCampaignsProps) {
  if (campaigns.length === 0) {
    return null
  }

  return (
    <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GiftIcon className="h-5 w-5 text-purple-500" />
          Active Campaigns
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Earn bonus coins by participating in these campaigns
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-background"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getCampaignTypeIcon(campaign.campaign_type)}
                  <h3 className="font-semibold">{campaign.title}</h3>
                </div>
                {getCampaignTypeBadge(campaign.campaign_type)}
              </div>

              {campaign.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {campaign.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                  <span className="text-sm font-medium">Reward:</span>
                  <span className="text-lg font-bold text-yellow-600 dark:text-yellow-500">
                    +{campaign.coin_amount} coins
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      {format(new Date(campaign.start_date), 'MMM d, yyyy')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
