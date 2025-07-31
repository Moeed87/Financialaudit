
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DebtKind, Debt, DebtFormData } from '@/lib/types';
import { 
  calculateMinimumPayment, 
  getDebtKindDisplayName, 
  requiresCreditLimit, 
  requiresLoanTerm 
} from '@/lib/debt-calculator';
import { CreditCard, Calculator, DollarSign, AlertTriangle } from 'lucide-react';

interface DebtFormProps {
  debt?: Debt;
  onSave: (debt: DebtFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DebtForm({ debt, onSave, onCancel, isLoading = false }: DebtFormProps) {
  const [formData, setFormData] = useState<DebtFormData>({
    kind: debt?.kind || 'CreditCard',
    name: debt?.name || '',
    balance: debt?.balance || 0,
    limit: debt?.limit,
    interestRate: debt?.interestRate || 0,
    userPayment: debt?.userPayment,
    term: debt?.term,
    description: debt?.description || ''
  });

  const [useCustomPayment, setUseCustomPayment] = useState(!!debt?.userPayment);
  const [calculatedMinPayment, setCalculatedMinPayment] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-calculate minimum payment when relevant fields change
  useEffect(() => {
    if (formData.balance > 0 && formData.interestRate >= 0) {
      const minPayment = calculateMinimumPayment(
        formData.kind,
        formData.balance,
        formData.interestRate,
        formData.term,
        formData.limit
      );
      setCalculatedMinPayment(minPayment);
    } else {
      setCalculatedMinPayment(0);
    }
  }, [formData.kind, formData.balance, formData.interestRate, formData.term, formData.limit]);

  // Reset custom payment when debt type changes
  useEffect(() => {
    if (!debt) { // Only reset for new debts, not when editing
      setUseCustomPayment(false);
      setFormData(prev => ({ ...prev, userPayment: undefined }));
    }
  }, [formData.kind, debt]);

  const handleInputChange = (field: keyof DebtFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleCustomPaymentToggle = (enabled: boolean) => {
    setUseCustomPayment(enabled);
    if (!enabled) {
      setFormData(prev => ({ ...prev, userPayment: undefined }));
    } else {
      setFormData(prev => ({ ...prev, userPayment: calculatedMinPayment }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.name.trim()) {
      newErrors.push('Debt name is required');
    }
    
    if (formData.balance <= 0) {
      newErrors.push('Balance must be greater than 0');
    }
    
    if (formData.interestRate < 0) {
      newErrors.push('Interest rate cannot be negative');
    }
    
    if (requiresCreditLimit(formData.kind) && (!formData.limit || formData.limit <= 0)) {
      newErrors.push(`${getDebtKindDisplayName(formData.kind)} requires a credit limit`);
    }
    
    if (requiresCreditLimit(formData.kind) && formData.limit && formData.balance > formData.limit) {
      newErrors.push('Balance cannot exceed credit limit');
    }
    
    if (requiresLoanTerm(formData.kind) && (!formData.term || formData.term <= 0)) {
      newErrors.push(`${getDebtKindDisplayName(formData.kind)} requires a loan term`);
    }
    
    if (useCustomPayment && formData.userPayment && formData.userPayment < calculatedMinPayment) {
      newErrors.push('Custom payment cannot be less than minimum payment');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const currentPayment = useCustomPayment ? formData.userPayment || calculatedMinPayment : calculatedMinPayment;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          {debt ? 'Edit Debt' : 'Add New Debt'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Debt Type */}
          <div className="space-y-2">
            <Label htmlFor="kind">Debt Type</Label>
            <Select
              value={formData.kind}
              onValueChange={(value: DebtKind) => handleInputChange('kind', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CreditCard">Credit Card</SelectItem>
                <SelectItem value="LOC">Line of Credit</SelectItem>
                <SelectItem value="PersonalLoan">Personal Loan</SelectItem>
                <SelectItem value="StudentLoan">Student Loan</SelectItem>
                <SelectItem value="OtherLoan">Other Loan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Debt Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Debt Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={`Enter ${getDebtKindDisplayName(formData.kind).toLowerCase()} name`}
              className="w-full"
            />
          </div>

          {/* Balance and Credit Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance ($)</Label>
              <Input
                id="balance"
                type="number"
                value={formData.balance || ''}
                onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full"
              />
            </div>

            {requiresCreditLimit(formData.kind) && (
              <div className="space-y-2">
                <Label htmlFor="limit">Credit Limit ($)</Label>
                <Input
                  id="limit"
                  type="number"
                  value={formData.limit || ''}
                  onChange={(e) => handleInputChange('limit', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Interest Rate and Loan Term */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                value={formData.interestRate || ''}
                onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full"
              />
            </div>

            {requiresLoanTerm(formData.kind) && (
              <div className="space-y-2">
                <Label htmlFor="term">Loan Term (months)</Label>
                <Input
                  id="term"
                  type="number"
                  value={formData.term || ''}
                  onChange={(e) => handleInputChange('term', parseInt(e.target.value) || 0)}
                  min="1"
                  step="1"
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Minimum Payment Display */}
          {calculatedMinPayment > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Calculated Minimum Payment</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                ${calculatedMinPayment.toFixed(2)}/month
              </div>
              <div className="text-sm text-blue-700 mt-1">
                {formData.kind === 'LOC' && 'Interest-only payment'}
                {formData.kind === 'CreditCard' && '3% of outstanding balance'}
                {requiresLoanTerm(formData.kind) && formData.term && 
                  `Amortized over ${formData.term} months`}
                {requiresLoanTerm(formData.kind) && !formData.term && 
                  '2% of balance (default - please set loan term for accurate calculation)'}
              </div>
            </div>
          )}

          {/* Custom Payment Option */}
          {calculatedMinPayment > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="customPayment" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Use Custom Payment Amount
                </Label>
                <Switch
                  id="customPayment"
                  checked={useCustomPayment}
                  onCheckedChange={handleCustomPaymentToggle}
                />
              </div>

              {useCustomPayment && (
                <div className="space-y-2">
                  <Label htmlFor="userPayment">Your Monthly Payment ($)</Label>
                  <Input
                    id="userPayment"
                    type="number"
                    value={formData.userPayment || ''}
                    onChange={(e) => handleInputChange('userPayment', parseFloat(e.target.value) || calculatedMinPayment)}
                    min={calculatedMinPayment}
                    step="0.01"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">
                    Minimum required: ${calculatedMinPayment.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add any notes about this debt..."
              className="w-full h-20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 min-h-[44px]"
            >
              {isLoading ? 'Saving...' : debt ? 'Update Debt' : 'Add Debt'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 min-h-[44px]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
