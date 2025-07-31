
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssetForm } from './asset-form'
import { LiabilityForm } from './liability-form'
import { NetWorthDashboard } from './net-worth-dashboard'
import { Asset, Liability, FormResponse } from '@/lib/types'
import { 
  Plus, 
  Home, 
  Car, 
  TrendingUp, 
  Wallet, 
  PiggyBank, 
  Shield, 
  Package,
  CreditCard,
  GraduationCap,
  DollarSign,
  Edit,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

export function FinancialManagement() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [showLiabilityForm, setShowLiabilityForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>()
  const [editingLiability, setEditingLiability] = useState<Liability | undefined>()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [assetsResponse, liabilitiesResponse] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/liabilities')
      ])

      const [assetsResult, liabilitiesResult]: [FormResponse<Asset[]>, FormResponse<Liability[]>] = await Promise.all([
        assetsResponse.json(),
        liabilitiesResponse.json()
      ])

      if (assetsResult.success && assetsResult.data) {
        setAssets(assetsResult.data)
      }

      if (liabilitiesResult.success && liabilitiesResult.data) {
        setLiabilities(liabilitiesResult.data)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
      toast.error('Failed to load financial data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssetSuccess = () => {
    setShowAssetForm(false)
    setEditingAsset(undefined)
    fetchData()
  }

  const handleLiabilitySuccess = () => {
    setShowLiabilityForm(false)
    setEditingLiability(undefined)
    fetchData()
  }

  const deleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      const result: FormResponse = await response.json()

      if (result.success) {
        toast.success('Asset deleted successfully')
        fetchData()
      } else {
        toast.error(result.message || 'Failed to delete asset')
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast.error('Failed to delete asset')
    }
  }

  const deleteLiability = async (id: string) => {
    if (!confirm('Are you sure you want to delete this liability?')) return

    try {
      const response = await fetch(`/api/liabilities/${id}`, { method: 'DELETE' })
      const result: FormResponse = await response.json()

      if (result.success) {
        toast.success('Liability deleted successfully')
        fetchData()
      } else {
        toast.error(result.message || 'Failed to delete liability')
      }
    } catch (error) {
      console.error('Error deleting liability:', error)
      toast.error('Failed to delete liability')
    }
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4 h-4" />
      case 'vehicle': return <Car className="w-4 h-4" />
      case 'investment': return <TrendingUp className="w-4 h-4" />
      case 'savings': return <PiggyBank className="w-4 h-4" />
      case 'checking': return <Wallet className="w-4 h-4" />
      case 'retirement': return <Shield className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getLiabilityIcon = (type: string) => {
    switch (type) {
      case 'mortgage': return <Home className="w-4 h-4" />
      case 'auto_loan': return <Car className="w-4 h-4" />
      case 'credit_card': return <CreditCard className="w-4 h-4" />
      case 'student_loan': return <GraduationCap className="w-4 h-4" />
      case 'personal_loan': return <DollarSign className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
          <TabsTrigger value="overview" className="text-sm sm:text-base p-3">Net Worth Overview</TabsTrigger>
          <TabsTrigger value="assets" className="text-sm sm:text-base p-3">Assets ({assets.length})</TabsTrigger>
          <TabsTrigger value="liabilities" className="text-sm sm:text-base p-3">Liabilities ({liabilities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <NetWorthDashboard />
        </TabsContent>

        <TabsContent value="assets" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Your Assets</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Track valuable items that build your net worth</p>
            </div>
            <Button 
              onClick={() => setShowAssetForm(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Add Asset
            </Button>
          </div>

          {showAssetForm && (
            <AssetForm
              asset={editingAsset}
              onSuccess={handleAssetSuccess}
              onCancel={() => {
                setShowAssetForm(false)
                setEditingAsset(undefined)
              }}
            />
          )}

          {assets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Assets Recorded</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your valuable assets to calculate your net worth
                </p>
                <Button onClick={() => setShowAssetForm(true)}>
                  Add Your First Asset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getAssetIcon(asset.type)}
                        <CardTitle className="text-sm sm:text-base truncate">{asset.name}</CardTitle>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                          onClick={() => {
                            setEditingAsset(asset)
                            setShowAssetForm(true)
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                          onClick={() => deleteAsset(asset.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="capitalize text-xs sm:text-sm">
                      {asset.type.replace('_', ' ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
                      {formatCurrency(asset.value)}
                    </div>
                    {asset.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{asset.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liabilities" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Your Liabilities</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Track debts that reduce your net worth</p>
            </div>
            <Button 
              onClick={() => setShowLiabilityForm(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Add Liability
            </Button>
          </div>

          {showLiabilityForm && (
            <LiabilityForm
              liability={editingLiability}
              onSuccess={handleLiabilitySuccess}
              onCancel={() => {
                setShowLiabilityForm(false)
                setEditingLiability(undefined)
              }}
            />
          )}

          {liabilities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Liabilities Recorded</h3>
                <p className="text-muted-foreground mb-4">
                  Track your debts to get a complete picture of your finances
                </p>
                <Button onClick={() => setShowLiabilityForm(true)}>
                  Add Your First Liability
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {liabilities.map((liability) => (
                <Card key={liability.id} className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getLiabilityIcon(liability.type)}
                        <CardTitle className="text-sm sm:text-base truncate">{liability.name}</CardTitle>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                          onClick={() => {
                            setEditingLiability(liability)
                            setShowLiabilityForm(true)
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                          onClick={() => deleteLiability(liability.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="capitalize text-xs sm:text-sm">
                      {liability.type.replace('_', ' ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-red-600 mb-2">
                      {formatCurrency(liability.balance)}
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm">
                      {liability.interestRate && (
                        <div className="flex justify-between items-center">
                          <span>Interest Rate:</span>
                          <Badge variant="secondary" className="text-xs">{liability.interestRate}% APR</Badge>
                        </div>
                      )}
                      {liability.minimumPayment && (
                        <div className="flex justify-between">
                          <span>Min Payment:</span>
                          <span>{formatCurrency(liability.minimumPayment)}</span>
                        </div>
                      )}
                      {liability.creditLimit && (
                        <div className="flex justify-between">
                          <span>Utilization:</span>
                          <span>{((liability.balance / liability.creditLimit) * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      
                      {/* Mortgage-specific fields */}
                      {liability.type === 'mortgage' && (
                        <>
                          {liability.amortizationYears && (
                            <div className="flex justify-between">
                              <span>Amortization:</span>
                              <span>{liability.amortizationYears} years</span>
                            </div>
                          )}
                          {liability.renewalDate && (
                            <div className="flex justify-between">
                              <span>Renewal Date:</span>
                              <span className="text-blue-600 font-medium">
                                {new Date(liability.renewalDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {liability.maturityDate && (
                            <div className="flex justify-between">
                              <span>Maturity Date:</span>
                              <span className="text-green-600 font-medium">
                                {new Date(liability.maturityDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {liability.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{liability.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
