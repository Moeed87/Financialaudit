
'use client';

import React, { useState, useEffect } from 'react';
import { BaseCalculator } from './base-calculator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateHomeAffordability, HomeAffordabilityInputs, HomeAffordabilityResults } from '@/lib/calculator-utilities';
import { AlertTriangle, Home, DollarSign, TrendingUp, Info } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

const PROVINCES = [
  { value: 'ON', label: 'Ontario' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'AB', label: 'Alberta' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'YT', label: 'Yukon' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' }
];

export function HomeAffordabilityCalculator() {
  const [inputs, setInputs] = useState<HomeAffordabilityInputs>({
    grossIncome: 75000,
    monthlyDebts: 500,
    downPayment: 50000,
    interestRate: 5.5,
    amortizationPeriod: 25,
    province: 'ON',
    heatingCosts: 150,
    propertyTax: 0,
    condoFees: 0
  });

  const [results, setResults] = useState<HomeAffordabilityResults | null>(null);
  const [error, setError] = useState<string>('');

  const updateInput = (key: keyof HomeAffordabilityInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const calculate = () => {
    setError('');
    try {
      // Validation
      if (inputs.grossIncome <= 0) {
        setError('Gross income must be greater than $0');
        return;
      }
      if (inputs.monthlyDebts < 0) {
        setError('Monthly debts cannot be negative');
        return;
      }
      if (inputs.downPayment < 0) {
        setError('Down payment cannot be negative');
        return;
      }
      if (inputs.interestRate <= 0 || inputs.interestRate > 50) {
        setError('Interest rate must be between 0.1% and 50%');
        return;
      }
      if (inputs.amortizationPeriod <= 0 || inputs.amortizationPeriod > 35) {
        setError('Amortization period must be between 1 and 35 years');
        return;
      }

      const calculatedResults = calculateHomeAffordability(inputs);
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

  const monthlyIncome = inputs.grossIncome / 12;

  const resultsComponent = results ? (
    <div className="space-y-6">
      {/* Key Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Max Home Price</p>
                <p className="text-xl font-bold">{formatCurrency(results.maxHomePrice)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Max Loan Amount</p>
                <p className="text-xl font-bold">{formatCurrency(results.maxLoanAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Housing</p>
                <p className="text-xl font-bold">{formatCurrency(results.monthlyHousingCosts)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt Service Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Debt Service Ratios</CardTitle>
          <CardDescription>Canadian lending guidelines require GDSR ≤ 39% and TDSR ≤ 44%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span>Gross Debt Service Ratio (GDSR)</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatPercentage(results.gdsr * 100)}</span>
                  {results.gdsr <= 0.39 ? (
                    <Badge variant="default">✓ Good</Badge>
                  ) : results.gdsr <= 0.44 ? (
                    <Badge variant="secondary">⚠ Caution</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Too High</Badge>
                  )}
                </div>
              </div>
              <Progress value={Math.min(results.gdsr * 100 / 39 * 100, 100)} className="h-2" />
              <p className="text-sm text-muted-foreground mt-1">
                Housing costs as % of gross income (max 39%)
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span>Total Debt Service Ratio (TDSR)</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatPercentage(results.tdsr * 100)}</span>
                  {results.tdsr <= 0.44 ? (
                    <Badge variant="default">✓ Good</Badge>
                  ) : results.tdsr <= 0.50 ? (
                    <Badge variant="secondary">⚠ Caution</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Too High</Badge>
                  )}
                </div>
              </div>
              <Progress value={Math.min(results.tdsr * 100 / 44 * 100, 100)} className="h-2" />
              <p className="text-sm text-muted-foreground mt-1">
                Total debt payments as % of gross income (max 44%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Housing Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Mortgage Payment</span>
              <span className="font-medium">{formatCurrency(results.breakdown.mortgage)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Property Tax</span>
              <span className="font-medium">{formatCurrency(results.breakdown.propertyTax)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Heating Costs</span>
              <span className="font-medium">{formatCurrency(results.breakdown.heating)}</span>
            </div>
            {results.breakdown.condoFees > 0 && (
              <div className="flex justify-between items-center">
                <span>Condo Fees</span>
                <span className="font-medium">{formatCurrency(results.breakdown.condoFees)}</span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-bold">
                <span>Total Monthly Housing</span>
                <span>{formatCurrency(results.monthlyHousingCosts)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Income Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Annual Gross Income</span>
              <span className="font-medium">{formatCurrency(inputs.grossIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Monthly Gross Income</span>
              <span className="font-medium">{formatCurrency(monthlyIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Current Monthly Debts</span>
              <span className="font-medium">{formatCurrency(inputs.monthlyDebts)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Available for Housing</span>
              <span className="font-medium text-green-600">{formatCurrency(results.monthlyHousingCosts)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : null;

  return (
    <BaseCalculator
      title="Home Affordability Calculator"
      description="Determine how much home you can afford based on Canadian lending guidelines (GDSR & TDSR)"
      calculatorType="home_affordability"
      inputs={inputs}
      calculatedResults={results || {}}
      results={resultsComponent}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="grossIncome">Annual Gross Income</Label>
            <Input
              id="grossIncome"
              type="number"
              value={inputs.grossIncome}
              onChange={(e) => updateInput('grossIncome', Number(e.target.value))}
              placeholder="75000"
            />
          </div>

          <div>
            <Label htmlFor="monthlyDebts">Monthly Debt Payments</Label>
            <Input
              id="monthlyDebts"
              type="number"
              value={inputs.monthlyDebts}
              onChange={(e) => updateInput('monthlyDebts', Number(e.target.value))}
              placeholder="500"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Include credit cards, loans, car payments (exclude proposed mortgage)
            </p>
          </div>

          <div>
            <Label htmlFor="downPayment">Down Payment Available</Label>
            <Input
              id="downPayment"
              type="number"
              value={inputs.downPayment}
              onChange={(e) => updateInput('downPayment', Number(e.target.value))}
              placeholder="50000"
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
              placeholder="5.5"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="amortizationPeriod">Amortization Period (years)</Label>
            <Input
              id="amortizationPeriod"
              type="number"
              value={inputs.amortizationPeriod}
              onChange={(e) => updateInput('amortizationPeriod', Number(e.target.value))}
              placeholder="25"
            />
          </div>

          <div>
            <Label htmlFor="province">Province</Label>
            <Select value={inputs.province} onValueChange={(value) => updateInput('province', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((province) => (
                  <SelectItem key={province.value} value={province.value}>
                    {province.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="heatingCosts">Monthly Heating Costs (optional)</Label>
            <Input
              id="heatingCosts"
              type="number"
              value={inputs.heatingCosts || ''}
              onChange={(e) => updateInput('heatingCosts', Number(e.target.value) || 150)}
              placeholder="150"
            />
          </div>

          <div>
            <Label htmlFor="condoFees">Monthly Condo Fees (optional)</Label>
            <Input
              id="condoFees"
              type="number"
              value={inputs.condoFees || ''}
              onChange={(e) => updateInput('condoFees', Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </BaseCalculator>
  );
}
