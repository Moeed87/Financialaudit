
'use client';

import React, { useState, useEffect } from 'react';
import { BaseCalculator } from './base-calculator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateLoanPayment, LoanInputs, LoanResults } from '@/lib/calculator-utilities';
import { AlertTriangle, Car, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function LoanPaymentCalculator() {
  const [inputs, setInputs] = useState<LoanInputs>({
    principal: 25000,
    interestRate: 6.5,
    termYears: 5,
    paymentFrequency: 'monthly' as const,
    loanType: 'auto' as const
  });

  const [results, setResults] = useState<LoanResults | null>(null);
  const [error, setError] = useState<string>('');

  const updateInput = (key: keyof LoanInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const calculate = () => {
    setError('');
    try {
      // Validation
      if (inputs.principal <= 0) {
        setError('Loan amount must be greater than $0');
        return;
      }
      if (inputs.interestRate < 0 || inputs.interestRate > 50) {
        setError('Interest rate must be between 0% and 50%');
        return;
      }
      if (inputs.termYears <= 0 || inputs.termYears > 50) {
        setError('Loan term must be between 1 and 50 years');
        return;
      }

      const calculatedResults = calculateLoanPayment(inputs);
      setResults(calculatedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error');
      setResults(null);
    }
  };

  // Auto-calculate when inputs change
  useEffect(() => {
    calculate();
  }, [inputs]);

  const getLoanTypeInfo = (type: string) => {
    switch (type) {
      case 'auto':
        return {
          name: 'Auto Loan',
          icon: Car,
          description: 'Vehicle financing with competitive rates',
          typicalRate: '4-8%',
          typicalTerm: '3-7 years'
        };
      case 'personal':
        return {
          name: 'Personal Loan',
          icon: DollarSign,
          description: 'Unsecured loan for any purpose',
          typicalRate: '8-15%',
          typicalTerm: '2-7 years'
        };
      case 'student':
        return {
          name: 'Student Loan',
          icon: Calendar,
          description: 'Education financing with flexible terms',
          typicalRate: '3-6%',
          typicalTerm: '10-25 years'
        };
      case 'business':
        return {
          name: 'Business Loan',
          icon: TrendingUp,
          description: 'Commercial lending for business needs',
          typicalRate: '5-12%',
          typicalTerm: '1-10 years'
        };
      default:
        return {
          name: 'Loan',
          icon: DollarSign,
          description: 'General loan calculator',
          typicalRate: '5-15%',
          typicalTerm: '1-10 years'
        };
    }
  };

  const loanInfo = getLoanTypeInfo(inputs.loanType);
  const IconComponent = loanInfo.icon;

  const resultsComponent = results ? (
    <div className="space-y-6">
      {/* Key Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Payment Amount</p>
                <p className="text-xl font-bold">{formatCurrency(results.monthlyPayment)}</p>
                <p className="text-xs text-muted-foreground">{inputs.paymentFrequency}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Interest</p>
                <p className="text-xl font-bold">{formatCurrency(results.totalInterest)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold">{formatCurrency(results.totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Summary</CardTitle>
          <CardDescription>{loanInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Loan Amount</span>
                <span className="font-medium">{formatCurrency(inputs.principal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Interest Rate</span>
                <span className="font-medium">{inputs.interestRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Loan Term</span>
                <span className="font-medium">{inputs.termYears} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Payment Frequency</span>
                <span className="font-medium capitalize">{inputs.paymentFrequency}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Payment Amount</span>
                <span className="font-medium text-blue-600">{formatCurrency(results.monthlyPayment)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Interest</span>
                <span className="font-medium text-orange-600">{formatCurrency(results.totalInterest)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Interest as % of Loan</span>
                <span className="font-medium">{((results.totalInterest / inputs.principal) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-semibold">Total Payments</span>
                <span className="font-bold">{formatCurrency(results.totalCost)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Schedule Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule Preview</CardTitle>
          <CardDescription>First 12 payments breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Payment #</th>
                      <th className="text-right p-2">Payment</th>
                      <th className="text-right p-2">Principal</th>
                      <th className="text-right p-2">Interest</th>
                      <th className="text-right p-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.paymentSchedule.slice(0, 12).map((payment, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{payment.payment}</td>
                        <td className="text-right p-2">{formatCurrency(results.monthlyPayment)}</td>
                        <td className="text-right p-2">{formatCurrency(payment.principal)}</td>
                        <td className="text-right p-2">{formatCurrency(payment.interest)}</td>
                        <td className="text-right p-2">{formatCurrency(payment.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(results.paymentSchedule.length)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(results.paymentSchedule.slice(0, 12).reduce((sum, p) => sum + p.principal, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Principal (Year 1)</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(results.paymentSchedule.slice(0, 12).reduce((sum, p) => sum + p.interest, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Interest (Year 1)</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  ) : null;

  return (
    <BaseCalculator
      title="Loan Payment Calculator"
      description="Calculate payments for auto loans, personal loans, student loans, and business loans"
      calculatorType="loan_payment"
      inputs={inputs}
      calculatedResults={results || {}}
      results={resultsComponent}
    >
      <div className="space-y-6">
        {/* Loan Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Type</CardTitle>
            <CardDescription>Select the type of loan to see relevant rates and terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['auto', 'personal', 'student', 'business'] as const).map((type) => {
                const info = getLoanTypeInfo(type);
                const IconComp = info.icon;
                return (
                  <Card 
                    key={type}
                    className={`cursor-pointer transition-colors ${
                      inputs.loanType === type ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-muted'
                    }`}
                    onClick={() => updateInput('loanType', type)}
                  >
                    <CardContent className="p-4 text-center">
                      <IconComp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium">{info.name}</h3>
                      <p className="text-xs text-muted-foreground">{info.typicalRate}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Loan Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="principal">Loan Amount</Label>
              <Input
                id="principal"
                type="number"
                value={inputs.principal}
                onChange={(e) => updateInput('principal', Number(e.target.value))}
                placeholder="25000"
              />
            </div>

            <div>
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={inputs.interestRate}
                onChange={(e) => updateInput('interestRate', Number(e.target.value))}
                placeholder="6.5"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Typical range: {loanInfo.typicalRate}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="termYears">Loan Term (years)</Label>
              <Input
                id="termYears"
                type="number"
                value={inputs.termYears}
                onChange={(e) => updateInput('termYears', Number(e.target.value))}
                placeholder="5"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Typical range: {loanInfo.typicalTerm}
              </p>
            </div>

            <div>
              <Label htmlFor="paymentFrequency">Payment Frequency</Label>
              <Select value={inputs.paymentFrequency} onValueChange={(value: any) => updateInput('paymentFrequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </BaseCalculator>
  );
}
