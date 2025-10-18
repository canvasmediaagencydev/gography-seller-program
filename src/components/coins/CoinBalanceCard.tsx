import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CoinsIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface CoinBalance {
  seller_id: string
  balance: number
  total_earned: number
  total_redeemed: number
  created_at: string
  updated_at: string
}

interface CoinBalanceCardProps {
  balance: CoinBalance | null
}

export function CoinBalanceCard({ balance }: CoinBalanceCardProps) {
  if (!balance) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No coin data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current Balance */}
      <Card className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CoinsIcon className="h-4 w-4 text-yellow-500" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-500">
              {balance.balance.toLocaleString()}
            </p>
            <span className="text-lg text-muted-foreground">coins</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ≈ {balance.balance.toLocaleString()} THB
          </p>
        </CardContent>
      </Card>

      {/* Total Earned */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Total Earned
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-green-600 dark:text-green-500">
              {balance.total_earned.toLocaleString()}
            </p>
            <span className="text-sm text-muted-foreground">coins</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            All-time earnings
          </p>
        </CardContent>
      </Card>

      {/* Total Redeemed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-blue-500" />
            Total Redeemed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
              {balance.total_redeemed.toLocaleString()}
            </p>
            <span className="text-sm text-muted-foreground">coins</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            All-time redemptions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
