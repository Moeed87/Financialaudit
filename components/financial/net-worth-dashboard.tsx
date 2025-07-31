
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { NetWorthSummary, FormResponse } from '@/lib/types'
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function NetWorthDashboard() {
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNetWorth()
  }, [])

  const fetchNetWorth = async () => {
    try {
      const response = await fetch('/api/net-worth')
      const result: FormResponse<NetWorthSummary> = await response.json()

      if (result.success && result.data) {
        setNetWorth(result.data)
      } else {
        toast.error('Failed to load net worth data')
      }
    } catch (error) {
      console.error('Error fetching net worth:', error)
      toast.error('Failed to load net worth data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!netWorth) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No financial data available</p>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  const getNetWorthColor = (netWorth: number) => {
    if (netWorth >= 100000) return 'text-green-600'
    if (netWorth >= 0) return 'text-blue-600'
    return 'text-red-600'
  }

  const getNetWorthIcon = (netWorth: number) => {
    if (netWorth >= 0) return <TrendingUp className="w-5 h-5" />
    return <TrendingDown className="w-5 h-5" />
  }

  const getHealthStatus = () => {
    if (netWorth.netWorth < 0) return { status: 'critical', color: 'destructive', icon: <AlertTriangle className="w-4 h-4" /> }
    if ((netWorth.debtToIncomeRatio ?? 0) > 0.4) return { status: 'concerning', color: 'secondary', icon: <AlertTriangle className="w-4 h-4" /> }
    if ((netWorth.liquidityRatio ?? 0) < 3) return { status: 'improving', color: 'secondary', icon: <DollarSign className="w-4 h-4" /> }
    return { status: 'healthy', color: 'default', icon: <CheckCircle className="w-4 h-4" /> }
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(netWorth.totalAssets)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(netWorth.totalLiabilities)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            {getNetWorthIcon(netWorth.netWorth)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getNetWorthColor(netWorth.netWorth)}`}>
              {formatCurrency(netWorth.netWorth)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={healthStatus.color as any} className="flex items-center gap-1">
                {healthStatus.icon}
                {healthStatus.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Debt-to-Income Ratio</CardTitle>
            <CardDescription>
              Total debt divided by annual income (should be under 40%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Current Ratio</span>
                <span className="font-medium">
                  {((netWorth.debtToIncomeRatio ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min((netWorth.debtToIncomeRatio ?? 0) * 100, 100)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {(netWorth.debtToIncomeRatio ?? 0) > 0.4 ? 
                  'Consider reducing debt to improve financial health' :
                  'Good debt management'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emergency Fund Coverage</CardTitle>
            <CardDescription>
              Liquid assets divided by monthly expenses (should be 3-6 months)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Coverage</span>
                <span className="font-medium">
                  {(netWorth.liquidityRatio ?? 0).toFixed(1)} months
                </span>
              </div>
              <Progress 
                value={Math.min(((netWorth.liquidityRatio ?? 0) / 6) * 100, 100)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {(netWorth.liquidityRatio ?? 0) < 3 ? 
                  'Consider building emergency fund' :
                  'Good emergency fund coverage'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Breakdown</CardTitle>
          <CardDescription>Distribution of your assets by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(netWorth.assetsByType)
              .filter(([_, value]) => value > 0)
              .sort(([_, a], [__, b]) => b - a)
              .map(([type, value]) => {
                const percentage = netWorth.totalAssets > 0 ? (value / netWorth.totalAssets) * 100 : 0
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <span className="font-medium">{formatCurrency(value)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Liability Breakdown */}
      {netWorth.totalLiabilities > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Liability Breakdown</CardTitle>
            <CardDescription>Distribution of your debts by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(netWorth.liabilitiesByType)
                .filter(([_, value]) => value > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([type, value]) => {
                  const percentage = netWorth.totalLiabilities > 0 ? (value / netWorth.totalLiabilities) * 100 : 0
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <span className="font-medium text-red-600">{formatCurrency(value)}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
