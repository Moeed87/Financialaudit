
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AssetFormData, AssetType, FormResponse, Asset } from '@/lib/types'
import { Home, Car, TrendingUp, Wallet, PiggyBank, Shield, Package } from 'lucide-react'
import { toast } from 'sonner'

interface AssetFormProps {
  asset?: Asset
  onSuccess: () => void
  onCancel: () => void
}

const assetTypes: { value: AssetType; label: string; icon: React.ReactNode }[] = [
  { value: 'home', label: 'Home/Real Estate', icon: <Home className="w-4 h-4" /> },
  { value: 'vehicle', label: 'Vehicle', icon: <Car className="w-4 h-4" /> },
  { value: 'investment', label: 'Investment Account', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'savings', label: 'Savings Account', icon: <PiggyBank className="w-4 h-4" /> },
  { value: 'checking', label: 'Checking Account', icon: <Wallet className="w-4 h-4" /> },
  { value: 'retirement', label: 'Retirement Account (RRSP/TFSA)', icon: <Shield className="w-4 h-4" /> },
  { value: 'other', label: 'Other Asset', icon: <Package className="w-4 h-4" /> }
]

export function AssetForm({ asset, onSuccess, onCancel }: AssetFormProps) {
  const [formData, setFormData] = useState<AssetFormData>({
    type: asset?.type || 'savings',
    name: asset?.name || '',
    value: asset?.value || 0,
    description: asset?.description || '',
    details: asset?.details || {}
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = asset ? `/api/assets/${asset.id}` : '/api/assets'
      const method = asset ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result: FormResponse<Asset> = await response.json()

      if (result.success) {
        toast.success(result.message || `Asset ${asset ? 'updated' : 'created'} successfully`)
        onSuccess()
      } else {
        toast.error(result.message || 'Failed to save asset')
      }
    } catch (error) {
      console.error('Error saving asset:', error)
      toast.error('Failed to save asset')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedAssetType = assetTypes.find(type => type.value === formData.type)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {selectedAssetType?.icon}
          {asset ? 'Edit Asset' : 'Add New Asset'}
        </CardTitle>
        <CardDescription>
          Track your valuable assets to calculate your net worth
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Asset Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: AssetType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Asset Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Toronto Condo, 2020 Honda Civic"
              required
            />
          </div>

          <div>
            <Label htmlFor="value">Current Value ($)</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about this asset..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : asset ? 'Update Asset' : 'Add Asset'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
