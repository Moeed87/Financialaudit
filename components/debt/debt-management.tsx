
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DebtForm } from './debt-form';
import { Debt, DebtFormData, Liability } from '@/lib/types';
import { 
  calculateMinimumPayment, 
  getDebtKindDisplayName, 
  debtToLiability, 
  liabilityToDebt 
} from '@/lib/debt-calculator';
import { 
  CreditCard, 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Calculator 
} from 'lucide-react';

interface DebtManagementProps {
  liabilities: Liability[];
  onSave: (debtData: DebtFormData, debtId?: string) => Promise<void>;
  onDelete: (debtId: string) => Promise<void>;
  isLoading?: boolean;
}

export function DebtManagement({ liabilities, onSave, onDelete, isLoading = false }: DebtManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Convert liabilities to debts on component mount
  useEffect(() => {
    const convertedDebts = liabilities
      .map(liability => liabilityToDebt(liability))
      .filter((debt): debt is Debt => debt !== null);
    setDebts(convertedDebts);
  }, [liabilities]);

  const handleSaveDebt = async (debtData: DebtFormData) => {
    try {
      setError(null);
      const debtId = editingDebt?.id;
      await onSave(debtData, debtId);
      setShowForm(false);
      setEditingDebt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save debt');
    }
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setShowForm(true);
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        setError(null);
        await onDelete(debtId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete debt');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDebt(null);
    setError(null);
  };

  // Calculate totals
  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMinPayments = debts.reduce((sum, debt) => sum + debt.minPayment, 0);
  const totalUserPayments = debts.reduce((sum, debt) => sum + (debt.userPayment || debt.minPayment), 0);
  const totalInterest = debts.reduce((sum, debt) => {
    const monthlyRate = debt.interestRate / 100 / 12;
    return sum + (debt.balance * monthlyRate);
  }, 0);

  if (showForm) {
    return (
      <DebtForm
        debt={editingDebt || undefined}
        onSave={handleSaveDebt}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Debt Management</h2>
          <p className="text-gray-600">Manage your debts and optimize your payments</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          Add Debt
        </Button>
      </div>

      {/* Summary Cards */}
      {debts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-xl font-bold text-red-600">
                    ${totalBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Min Payments</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${totalMinPayments.toFixed(0)}/mo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Your Payments</p>
                  <p className="text-xl font-bold text-green-600">
                    ${totalUserPayments.toFixed(0)}/mo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Monthly Interest</p>
                  <p className="text-xl font-bold text-orange-600">
                    ${totalInterest.toFixed(0)}/mo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Debt List */}
      <div className="space-y-4">
        {debts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No debts added yet</h3>
              <p className="text-gray-600 mb-4">
                Start managing your debts by adding your first debt account.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your First Debt
              </Button>
            </CardContent>
          </Card>
        ) : (
          debts.map((debt) => (
            <Card key={debt.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{debt.name}</h3>
                      <Badge variant="secondary">
                        {getDebtKindDisplayName(debt.kind)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Balance</p>
                        <p className="font-semibold text-red-600">
                          ${debt.balance.toLocaleString()}
                        </p>
                      </div>
                      
                      {debt.limit && (
                        <div>
                          <p className="text-sm text-gray-600">Credit Limit</p>
                          <p className="font-semibold">
                            ${debt.limit.toLocaleString()}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min((debt.balance / debt.limit) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm text-gray-600">Interest Rate</p>
                        <p className="font-semibold">{debt.interestRate.toFixed(2)}%</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Monthly Payment</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-green-600">
                            ${(debt.userPayment || debt.minPayment).toFixed(0)}
                          </p>
                          {debt.userPayment && (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        {debt.userPayment && (
                          <p className="text-xs text-gray-500">
                            Min: ${debt.minPayment.toFixed(0)}
                          </p>
                        )}
                      </div>
                    </div>

                    {debt.description && (
                      <p className="text-sm text-gray-600 mt-3">{debt.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDebt(debt)}
                      className="flex items-center gap-1 min-h-[40px]"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDebt(debt.id)}
                      className="flex items-center gap-1 min-h-[40px] text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
