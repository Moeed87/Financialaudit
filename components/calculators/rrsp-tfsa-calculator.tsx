
'use client';

import React, { useState, useEffect } from 'react';
import { BaseCalculator } from './base-calculator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateRRSPvsTFSA, RRSPvsTFSAInputs, RRSPvsTFSAResults } from '@/lib/calculator-utilities';
import { AlertTriangle, TrendingUp, DollarSign, Target, Info } from 'lucide-react';
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

const TAX_BRACKETS = {
  'ON': [
    { min: 0, max: 51446, rate: 20.05 },
    { min: 51447, max: 102894, rate: 24.15 },
    { min: 102895, max: 150000, rate: 35.39 },
    { min: 150001, max: 220000, rate: 39.41 },
    { min: 220001, max: Infinity, rate: 46.16 }
  ],
  // Simplified for other provinces - you'd want full brackets in production
  'BC': [
    { min: 0, max: 47937, rate: 20.06 },
    { min: 47938, max: 95875, rate: 22.70 },
    { min: 95876, max: 150000, rate: 28.20 },
    { min: 150001, max: Infinity, rate: 43.70 }
  ]
};

function getMarginalTaxRate(income: number, province: string): number {
  const brackets = TAX_BRACKETS[province as keyof typeof TAX_BRACKETS] || TAX_BRACKETS.ON;
  for (const bracket of brackets) {
    if (income >= bracket.min && income <= bracket.max) {
      return bracket.rate;
    }
  }
  return brackets[brackets.length - 1].rate;
}

export function RRSPvsTFSACalculator() {
  const [inputs, setInputs] = useState<RRSPvsTFSAInputs>({
    age: 35,
    currentIncome: 75000,
    expectedRetirementIncome: 40000,
    contributionAmount: 6000,
    investmentReturn: 7,
    yearsToRetirement: 30,
    currentMarginalTaxRate: 30,
    expectedRetirementTaxRate: 25,
    province: 'ON'
  });

  const [results, setResults] = useState<RRSPvsTFSAResults | null>(null);
  const [error, setError] = useState<string>('');

  const updateInput = (key: keyof RRSPvsTFSAInputs, value: string | number) => {
    let newInputs = { ...inputs, [key]: value };
    
    // Auto-calculate tax rates based on income and province
    if (key === 'currentIncome' || key === 'province') {
      newInputs.currentMarginalTaxRate = getMarginalTaxRate(newInputs.currentIncome, newInputs.province);
    }
    if (key === 'expectedRetirementIncome' || key === 'province') {
      newInputs.expectedRetirementTaxRate = getMarginalTaxRate(newInputs.expectedRetirementIncome, newInputs.province);
    }
    if (key === 'age') {
      newInputs.yearsToRetirement = Math.max(1, 65 - Number(value));
    }
    
    setInputs(newInputs);
  };

  const calculate = () => {
    setError('');
    try {
      // Validation
      if (inputs.age <= 0 || inputs.age > 100) {
        setError('Age must be between 1 and 100');
        return;
      }
      if (inputs.currentIncome <= 0) {
        setError('Current income must be greater than $0');
        return;
      }
      if (inputs.contributionAmount <= 0) {
        setError('Contribution amount must be greater than $0');
        return;
      }
      if (inputs.investmentReturn < 0 || inputs.investmentReturn > 20) {
        setError('Investment return must be between 0% and 20%');
        return;
      }
      if (inputs.yearsToRetirement <= 0) {
        setError('Years to retirement must be greater than 0');
        return;
      }

      const calculatedResults = calculateRRSPvsTFSA(inputs);
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

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'RRSP': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TFSA': return 'bg-green-100 text-green-800 border-green-200';
      case 'Split': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const resultsComponent = results ? (
    <div className="space-y-6">
      {/* Recommendation Banner */}
      <Card className={`border-2 ${getRecommendationColor(results.recommendation)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recommendation: {results.recommendation === 'Split' ? 'Split Strategy' : results.recommendation}
          </CardTitle>
          <CardDescription>
            {results.recommendation === 'RRSP' && 'RRSP provides better after-tax returns for your situation'}
            {results.recommendation === 'TFSA' && 'TFSA provides better tax-free growth for your situation'}
            {results.recommendation === 'Split' && 'A combination strategy balances tax benefits and flexibility'}
          </CardDescription>
        </CardHeader>
        {results.splitRecommendation && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <p className="text-lg font-bold text-blue-600">{formatCurrency(results.splitRecommendation.rrspAmount)}</p>
                <p className="text-sm text-muted-foreground">to RRSP</p>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <p className="text-lg font-bold text-green-600">{formatCurrency(results.splitRecommendation.tfsaAmount)}</p>
                <p className="text-sm text-muted-foreground">to TFSA</p>
              </div>
            </div>
            <p className="text-sm mt-2 text-center">{results.splitRecommendation.reasoning}</p>
          </CardContent>
        )}
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>RRSP vs TFSA Comparison</CardTitle>
          <CardDescription>
            Projected value of {formatCurrency(inputs.contributionAmount)} contribution after {inputs.yearsToRetirement} years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Account Type</th>
                  <th className="text-right p-3">Tax Benefit Now</th>
                  <th className="text-right p-3">Future Value</th>
                  <th className="text-right p-3">After-Tax Value</th>
                  <th className="text-right p-3">Total Return</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="font-medium">RRSP</span>
                    </div>
                  </td>
                  <td className="text-right p-3 text-green-600 font-medium">
                    {formatCurrency(results.rrspContribution.taxSavingsNow)}
                  </td>
                  <td className="text-right p-3">
                    {formatCurrency(results.rrspContribution.futureValue)}
                  </td>
                  <td className="text-right p-3 font-medium">
                    {formatCurrency(results.rrspContribution.afterTaxValue)}
                  </td>
                  <td className="text-right p-3 font-bold text-blue-600">
                    {formatCurrency(results.rrspContribution.totalReturn)}
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="font-medium">TFSA</span>
                    </div>
                  </td>
                  <td className="text-right p-3 text-muted-foreground">
                    $0
                  </td>
                  <td className="text-right p-3 font-medium">
                    {formatCurrency(results.tfsaContribution.futureValue)}
                  </td>
                  <td className="text-right p-3 font-medium">
                    {formatCurrency(results.tfsaContribution.taxFreeWithdrawal)}
                  </td>
                  <td className="text-right p-3 font-bold text-green-600">
                    {formatCurrency(results.tfsaContribution.totalReturn)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Tabs defaultValue="rrsp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rrsp">RRSP Details</TabsTrigger>
          <TabsTrigger value="tfsa">TFSA Details</TabsTrigger>
          <TabsTrigger value="limits">Contribution Limits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rrsp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">RRSP Analysis</CardTitle>
              <CardDescription>Registered Retirement Savings Plan benefits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Contribution Amount</span>
                      <span className="font-medium">{formatCurrency(inputs.contributionAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Savings This Year</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(results.rrspContribution.taxSavingsNow)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Cost</span>
                      <span className="font-medium">
                        {formatCurrency(inputs.contributionAmount - results.rrspContribution.taxSavingsNow)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Growth ({inputs.yearsToRetirement} years)</span>
                      <span className="font-medium">{formatCurrency(results.rrspContribution.futureValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax on Withdrawal</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(results.rrspContribution.futureValue - results.rrspContribution.afterTaxValue)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">After-Tax Value</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(results.rrspContribution.afterTaxValue)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>RRSP Benefits:</strong> Immediate tax deduction, tax-deferred growth, mandatory conversion to RRIF at 71.
                    Best when your current tax rate is higher than your expected retirement tax rate.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tfsa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">TFSA Analysis</CardTitle>
              <CardDescription>Tax-Free Savings Account benefits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Contribution Amount</span>
                      <span className="font-medium">{formatCurrency(inputs.contributionAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Deduction</span>
                      <span className="font-medium text-muted-foreground">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Out-of-Pocket Cost</span>
                      <span className="font-medium">{formatCurrency(inputs.contributionAmount)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Growth ({inputs.yearsToRetirement} years)</span>
                      <span className="font-medium">{formatCurrency(results.tfsaContribution.futureValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax on Withdrawal</span>
                      <span className="font-medium text-green-600">$0</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Tax-Free Value</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(results.tfsaContribution.taxFreeWithdrawal)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>TFSA Benefits:</strong> Tax-free growth and withdrawals, flexible access, contribution room returns after withdrawal.
                    Best when your current tax rate is lower than your expected retirement tax rate, or for emergency funds.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>2025 Contribution Limits</CardTitle>
              <CardDescription>Maximum amounts you can contribute this year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-600">RRSP Contribution Room</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Based on Income</span>
                      <span>{formatPercentage(18)} × {formatCurrency(inputs.currentIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum Limit (2025)</span>
                      <span>{formatCurrency(31560)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Your RRSP Limit</span>
                      <span className="font-bold text-blue-600">{formatCurrency(results.contributionLimits.rrspRoom)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-green-600">TFSA Contribution Room</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Annual Limit (2025)</span>
                      <span>{formatCurrency(7000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cumulative Since Age 18</span>
                      <span>{inputs.age >= 18 ? formatCurrency((inputs.age - 18 + 1) * 6500) : '$0'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Estimated TFSA Room</span>
                      <span className="font-bold text-green-600">{formatCurrency(results.contributionLimits.tfsaRoom)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Actual contribution room depends on your Notice of Assessment from CRA. 
                  These are estimates based on maximum possible room.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ) : null;

  return (
    <BaseCalculator
      title="RRSP vs TFSA Calculator"
      description="Compare tax advantages and growth potential of RRSPs and TFSAs based on your situation"
      calculatorType="rrsp_vs_tfsa"
      inputs={inputs}
      calculatedResults={results || {}}
      results={resultsComponent}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="age">Current Age</Label>
            <Input
              id="age"
              type="number"
              value={inputs.age}
              onChange={(e) => updateInput('age', Number(e.target.value))}
              placeholder="35"
            />
          </div>

          <div>
            <Label htmlFor="currentIncome">Current Annual Income</Label>
            <Input
              id="currentIncome"
              type="number"
              value={inputs.currentIncome}
              onChange={(e) => updateInput('currentIncome', Number(e.target.value))}
              placeholder="75000"
            />
          </div>

          <div>
            <Label htmlFor="expectedRetirementIncome">Expected Retirement Income</Label>
            <Input
              id="expectedRetirementIncome"
              type="number"
              value={inputs.expectedRetirementIncome}
              onChange={(e) => updateInput('expectedRetirementIncome', Number(e.target.value))}
              placeholder="40000"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Including CPP, OAS, and other retirement income
            </p>
          </div>

          <div>
            <Label htmlFor="contributionAmount">Annual Contribution</Label>
            <Input
              id="contributionAmount"
              type="number"
              value={inputs.contributionAmount}
              onChange={(e) => updateInput('contributionAmount', Number(e.target.value))}
              placeholder="6000"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="investmentReturn">Expected Annual Return (%)</Label>
            <Input
              id="investmentReturn"
              type="number"
              step="0.1"
              value={inputs.investmentReturn}
              onChange={(e) => updateInput('investmentReturn', Number(e.target.value))}
              placeholder="7"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Long-term average: 6-8% for balanced portfolios
            </p>
          </div>

          <div>
            <Label htmlFor="yearsToRetirement">Years to Retirement</Label>
            <Input
              id="yearsToRetirement"
              type="number"
              value={inputs.yearsToRetirement}
              onChange={(e) => updateInput('yearsToRetirement', Number(e.target.value))}
              placeholder="30"
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="currentMarginalTaxRate">Current Tax Rate (%)</Label>
              <Input
                id="currentMarginalTaxRate"
                type="number"
                step="0.1"
                value={inputs.currentMarginalTaxRate}
                onChange={(e) => updateInput('currentMarginalTaxRate', Number(e.target.value))}
                placeholder="30"
              />
            </div>
            <div>
              <Label htmlFor="expectedRetirementTaxRate">Retirement Tax Rate (%)</Label>
              <Input
                id="expectedRetirementTaxRate"
                type="number"
                step="0.1"
                value={inputs.expectedRetirementTaxRate}
                onChange={(e) => updateInput('expectedRetirementTaxRate', Number(e.target.value))}
                placeholder="25"
              />
            </div>
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
