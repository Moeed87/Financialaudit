
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LiabilityFormData, LiabilityType, FormResponse, Liability } from '@/lib/types'
import { Home, Car, CreditCard, GraduationCap, DollarSign, Package } from 'lucide-react'
import { toast } from 'sonner'

interface LiabilityFormProps {
  liability?: Liability
  onSuccess: () => void
  onCancel: () => void
}

const liabilityTypes: { value: LiabilityType; label: string; icon: React.ReactNode }[] = [
  { value: 'mortgage', label: 'Mortgage', icon: <Home className="w-4 h-4" /> },
  { value: 'auto_loan', label: 'Auto Loan', icon: <Car className="w-4 h-4" /> },
  { value: 'credit_card', label: 'Credit Card', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'student_loan', label: 'Student Loan', icon: <GraduationCap className="w-4 h-4" /> },
  { value: 'personal_loan', label: 'Personal Loan', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'other', label: 'Other Debt', icon: <Package className="w-4 h-4" /> }
]

export function LiabilityForm({ liability, onSuccess, onCancel }: LiabilityFormProps) {
  const [formData, setFormData] = useState<LiabilityFormData>({
    type: liability?.type || 'credit_card',
    name: liability?.name || '',
    balance: liability?.balance || 0,
    interestRate: liability?.interestRate || undefined,
    minimumPayment: liability?.minimumPayment || undefined,
    creditLimit: liability?.creditLimit || undefined,
    description: liability?.description || '',
    details: liability?.details || {},
    amortizationYears: liability?.amortizationYears || undefined,
    renewalDate: liability?.renewalDate || undefined,
    maturityDate: liability?.maturityDate || undefined
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = liability ? `/api/liabilities/${liability.id}` : '/api/liabilities'
      const method = liability ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result: FormResponse<Liability> = await response.json()

      if (result.success) {
        toast.success(result.message || `Liability ${liability ? 'updated' : 'created'} successfully`)
        onSuccess()
      } else {
        toast.error(result.message || 'Failed to save liability')
      }
    } catch (error) {
      console.error('Error saving liability:', error)
      toast.error('Failed to save liability')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedLiabilityType = liabilityTypes.find(type => type.value === formData.type)
  const isCreditCard = formData.type === 'credit_card'
  const isMortgage = formData.type === 'mortgage'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {selectedLiabilityType?.icon}
          {liability ? 'Edit Liability' : 'Add New Liability'}
        </CardTitle>
        <CardDescription>
          Track your debts and liabilities to understand your complete financial picture
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Liability Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: LiabilityType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select liability type" />
              </SelectTrigger>
              <SelectContent>
                {liabilityTypes.map(type => (
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
            <Label htmlFor="name">Liability Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={isCreditCard ? "e.g., TD Visa, RBC Mastercard" : "e.g., TD Mortgage, Student Loan"}
              required
            />
          </div>

          <div>
            <Label htmlFor="balance">Current Balance ($)</Label>
            <Input
              id="balance"
              type="number"
              min="0"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interestRate">Interest Rate (% APR)</Label>
              <Input
                id="interestRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.interestRate || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  interestRate: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="19.99"
              />
            </div>

            <div>
              <Label htmlFor="minimumPayment">Minimum Payment ($)</Label>
              <Input
                id="minimumPayment"
                type="number"
                min="0"
                step="0.01"
                value={formData.minimumPayment || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  minimumPayment: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {isCreditCard && (
            <div>
              <Label htmlFor="creditLimit">Credit Limit ($)</Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                step="0.01"
                value={formData.creditLimit || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  creditLimit: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="0.00"
              />
            </div>
          )}

          {isMortgage && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amortizationYears">Amortization (Years)</Label>
                  <Input
                    id="amortizationYears"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.amortizationYears || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      amortizationYears: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="25"
                  />
                </div>

                <div>
                  <Label htmlFor="renewalDate">Next Renewal Date</Label>
                  <Input
                    id="renewalDate"
                    type="date"
                    value={formData.renewalDate ? new Date(formData.renewalDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      renewalDate: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="maturityDate">Maturity Date</Label>
                  <Input
                    id="maturityDate"
                    type="date"
                    value={formData.maturityDate ? new Date(formData.maturityDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maturityDate: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </div>

              {formData.amortizationYears && formData.interestRate && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">Mortgage Summary</p>
                  <p className="text-xs text-blue-600">
                    {formData.amortizationYears}-year amortization at {formData.interestRate}% APR
                    {formData.renewalDate && ` • Renews ${new Date(formData.renewalDate).toLocaleDateString()}`}
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about this debt..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : liability ? 'Update Liability' : 'Add Liability'}
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
