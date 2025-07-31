
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateBuyVsRent, BuyVsRentInputs, BuyVsRentResults } from '@/lib/calculator-utilities';
import { AlertTriangle, Home, DollarSign, TrendingUp, Calculator, Building2, PiggyBank, Target } from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';

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

export function BuyVsRentCalculator() {
  const [inputs, setInputs] = useState<BuyVsRentInputs>({
    // Home Purchase Details
    homePrice: 650000,
    downPayment: 130000,
    mortgageRate: 5.5,
    amortizationPeriod: 25,
    
    // Rental Details
    monthlyRent: 2500,
    rentIncrease: 3.0,
    
    // Additional Costs
    propertyTax: 8000,
    homeInsurance: 1200,
    maintenance: 6500,
    utilities: 2400,
    condoFees: 0,
    
    // Investment & Financial
    investmentReturn: 7.0,
    inflationRate: 2.5,
    marginalTaxRate: 35.0,
    
    // Analysis Period
    yearsAnalyzed: 10,
    province: 'ON'
  });

  const [results, setResults] = useState<BuyVsRentResults | null>(null);
  const [error, setError] = useState<string>('');

  const updateInput = (key: keyof BuyVsRentInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const calculate = () => {
    setError('');
    try {
      // Validation
      if (inputs.homePrice <= 0) {
        setError('Home price must be greater than $0');
        return;
      }
      if (inputs.downPayment < 0) {
        setError('Down payment cannot be negative');
        return;
      }
      if (inputs.downPayment >= inputs.homePrice) {
        setError('Down payment must be less than home price');
        return;
      }
      if (inputs.monthlyRent <= 0) {
        setError('Monthly rent must be greater than $0');
        return;
      }
      if (inputs.mortgageRate <= 0 || inputs.mortgageRate > 50) {
        setError('Mortgage rate must be between 0.1% and 50%');
        return;
      }
      if (inputs.yearsAnalyzed <= 0 || inputs.yearsAnalyzed > 50) {
        setError('Analysis period must be between 1 and 50 years');
        return;
      }

      const calculatedResults = calculateBuyVsRent(inputs);
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

  const downPaymentPercentage = (inputs.downPayment / inputs.homePrice) * 100;

  const resultsComponent = results ? (
    <div className="space-y-6">
      {/* Key Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={results.recommendation === 'buy' ? 'ring-2 ring-green-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cost (Buying)</p>
                <p className="text-xl font-bold">{formatCurrency(results.buyingCosts.totalCost)}</p>
                <p className="text-xs text-muted-foreground">{inputs.yearsAnalyzed} years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={results.recommendation === 'rent' ? 'ring-2 ring-green-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cost (Renting)</p>
                <p className="text-xl font-bold">{formatCurrency(results.rentingCosts.totalCost)}</p>
                <p className="text-xs text-muted-foreground">+ investments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Net Difference</p>
                <p className={`text-xl font-bold ${results.netDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.netDifference >= 0 ? '+' : ''}{formatCurrency(results.netDifference)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {results.recommendation === 'buy' ? 'Buying advantage' : 'Renting advantage'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Break-even Point</p>
                <p className="text-xl font-bold">
                  {results.breakEvenPoint ? `${results.breakEvenPoint} years` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>Recommendation:</strong> Based on your inputs, {results.recommendation === 'buy' ? 'buying' : 'renting'} is 
          financially better by {formatCurrency(Math.abs(results.netDifference))} over {inputs.yearsAnalyzed} years.
          {results.breakEvenPoint && ` Buying becomes profitable after ${results.breakEvenPoint} years.`}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Cost Comparison</TabsTrigger>
          <TabsTrigger value="buying">Buying Details</TabsTrigger>
          <TabsTrigger value="renting">Renting Details</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          {/* Financial Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Comparison After {inputs.yearsAnalyzed} Years</CardTitle>
              <CardDescription>Total costs and net worth comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-blue-600">Buying Scenario</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Home Value</span>
                      <span className="font-medium">{formatCurrency(results.buyingCosts.finalHomeValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Mortgage</span>
                      <span className="font-medium text-red-600">-{formatCurrency(results.buyingCosts.remainingMortgage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Payments Made</span>
                      <span className="font-medium text-red-600">-{formatCurrency(results.buyingCosts.totalPayments)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Net Position</span>
                        <span className={results.buyingCosts.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(results.buyingCosts.netPosition)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-orange-600">Renting Scenario</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Rent Paid</span>
                      <span className="font-medium text-red-600">-{formatCurrency(results.rentingCosts.totalRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Investment Value</span>
                      <span className="font-medium text-green-600">+{formatCurrency(results.rentingCosts.investmentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Costs</span>
                      <span className="font-medium text-red-600">-{formatCurrency(results.rentingCosts.otherCosts)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Net Position</span>
                        <span className={results.rentingCosts.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(results.rentingCosts.netPosition)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Year-by-Year Analysis Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Year-by-Year Analysis (First 5 Years)</CardTitle>
              <CardDescription>Cumulative net position comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Year</th>
                      <th className="text-right p-2">Buying Net</th>
                      <th className="text-right p-2">Renting Net</th>
                      <th className="text-right p-2">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.yearByYearAnalysis.slice(0, 5).map((year, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{year.year}</td>
                        <td className="text-right p-2">{formatCurrency(year.buyingNet)}</td>
                        <td className="text-right p-2">{formatCurrency(year.rentingNet)}</td>
                        <td className={`text-right p-2 font-medium ${year.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {year.difference >= 0 ? '+' : ''}{formatCurrency(year.difference)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buying" className="space-y-6">
          {/* Buying Costs Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Buying Costs Breakdown</CardTitle>
              <CardDescription>All costs associated with purchasing and owning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Upfront Costs</h4>
                  <div className="flex justify-between">
                    <span>Down Payment</span>
                    <span className="font-medium">{formatCurrency(inputs.downPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Land Transfer Tax</span>
                    <span className="font-medium">{formatCurrency(results.buyingCosts.landTransferTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Legal & Closing</span>
                    <span className="font-medium">{formatCurrency(results.buyingCosts.closingCosts)}</span>
                  </div>
                  {results.buyingCosts.cmhcInsurance > 0 && (
                    <div className="flex justify-between">
                      <span>CMHC Insurance</span>
                      <span className="font-medium">{formatCurrency(results.buyingCosts.cmhcInsurance)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total Upfront</span>
                      <span>{formatCurrency(results.buyingCosts.upfrontCosts)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Ongoing Costs (Annual)</h4>
                  <div className="flex justify-between">
                    <span>Mortgage Payments</span>
                    <span className="font-medium">{formatCurrency(results.buyingCosts.annualMortgage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Property Tax</span>
                    <span className="font-medium">{formatCurrency(inputs.propertyTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Home Insurance</span>
                    <span className="font-medium">{formatCurrency(inputs.homeInsurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maintenance</span>
                    <span className="font-medium">{formatCurrency(inputs.maintenance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilities</span>
                    <span className="font-medium">{formatCurrency(inputs.utilities)}</span>
                  </div>
                  {inputs.condoFees > 0 && (
                    <div className="flex justify-between">
                      <span>Condo Fees</span>
                      <span className="font-medium">{formatCurrency(inputs.condoFees)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mortgage Details */}
          <Card>
            <CardHeader>
              <CardTitle>Mortgage Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(results.buyingCosts.monthlyMortgage)}
                  </p>
                  <p className="text-sm text-muted-foreground">Monthly Payment</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPercentage(downPaymentPercentage)}
                  </p>
                  <p className="text-sm text-muted-foreground">Down Payment</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(results.buyingCosts.finalHomeValue)}
                  </p>
                  <p className="text-sm text-muted-foreground">Est. Home Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renting" className="space-y-6">
          {/* Renting Costs & Investment */}
          <Card>
            <CardHeader>
              <CardTitle>Renting + Investment Strategy</CardTitle>
              <CardDescription>Total rental costs and investment of down payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Rental Costs</h4>
                  <div className="flex justify-between">
                    <span>Starting Monthly Rent</span>
                    <span className="font-medium">{formatCurrency(inputs.monthlyRent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Final Monthly Rent</span>
                    <span className="font-medium">{formatCurrency(results.rentingCosts.finalRent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Rent Increase</span>
                    <span className="font-medium">{formatPercentage(inputs.rentIncrease)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Rent Paid</span>
                    <span className="font-medium text-red-600">{formatCurrency(results.rentingCosts.totalRent)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Investment Analysis</h4>
                  <div className="flex justify-between">
                    <span>Initial Investment</span>
                    <span className="font-medium">{formatCurrency(inputs.downPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Savings Invested</span>
                    <span className="font-medium">{formatCurrency(results.rentingCosts.monthlySavings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Return</span>
                    <span className="font-medium">{formatPercentage(inputs.investmentReturn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Final Investment Value</span>
                    <span className="font-medium text-green-600">{formatCurrency(results.rentingCosts.investmentValue)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(results.rentingCosts.totalContributions)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(results.rentingCosts.investmentGrowth)}
                  </p>
                  <p className="text-sm text-muted-foreground">Investment Growth</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPercentage((results.rentingCosts.investmentValue / results.rentingCosts.totalContributions - 1) * 100)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Return</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ) : null;

  return (
    <BaseCalculator
      title="Buy vs Rent Calculator"
      description="Compare the financial impact of buying a home versus renting and investing the difference in Canada"
      calculatorType="buy_vs_rent"
      inputs={inputs}
      calculatedResults={results || {}}
      results={resultsComponent}
    >
      <div className="space-y-6">
        {/* Home Purchase Details */}
        <Card>
          <CardHeader>
            <CardTitle>Home Purchase Details</CardTitle>
            <CardDescription>Enter the details of the home you're considering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="homePrice">Home Price</Label>
                <Input
                  id="homePrice"
                  type="number"
                  value={inputs.homePrice}
                  onChange={(e) => updateInput('homePrice', Number(e.target.value))}
                  placeholder="650000"
                />
              </div>

              <div>
                <Label htmlFor="downPayment">Down Payment</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={inputs.downPayment}
                  onChange={(e) => updateInput('downPayment', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Current: {formatPercentage(downPaymentPercentage)} of home price
                </p>
              </div>

              <div>
                <Label htmlFor="mortgageRate">Mortgage Interest Rate (%)</Label>
                <Input
                  id="mortgageRate"
                  type="number"
                  step="0.01"
                  value={inputs.mortgageRate}
                  onChange={(e) => updateInput('mortgageRate', Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="amortizationPeriod">Amortization (years)</Label>
                <Input
                  id="amortizationPeriod"
                  type="number"
                  value={inputs.amortizationPeriod}
                  onChange={(e) => updateInput('amortizationPeriod', Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental Details */}
        <Card>
          <CardHeader>
            <CardTitle>Rental Details</CardTitle>
            <CardDescription>Enter current rental costs and expected increases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyRent">Monthly Rent</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={inputs.monthlyRent}
                  onChange={(e) => updateInput('monthlyRent', Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="rentIncrease">Annual Rent Increase (%)</Label>
                <Input
                  id="rentIncrease"
                  type="number"
                  step="0.1"
                  value={inputs.rentIncrease}
                  onChange={(e) => updateInput('rentIncrease', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Typical range: 1-5% annually
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Homeownership Costs */}
        <Card>
          <CardHeader>
            <CardTitle>Homeownership Costs</CardTitle>
            <CardDescription>Annual costs of owning the home</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyTax">Property Tax (Annual)</Label>
                <Input
                  id="propertyTax"
                  type="number"
                  value={inputs.propertyTax}
                  onChange={(e) => updateInput('propertyTax', Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="homeInsurance">Home Insurance (Annual)</Label>
                <Input
                  id="homeInsurance"
                  type="number"
                  value={inputs.homeInsurance}
                  onChange={(e) => updateInput('homeInsurance', Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="maintenance">Maintenance & Repairs (Annual)</Label>
                <Input
                  id="maintenance"
                  type="number"
                  value={inputs.maintenance}
                  onChange={(e) => updateInput('maintenance', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Typically 1-3% of home value
                </p>
              </div>

              <div>
                <Label htmlFor="utilities">Utilities (Annual)</Label>
                <Input
                  id="utilities"
                  type="number"
                  value={inputs.utilities}
                  onChange={(e) => updateInput('utilities', Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="condoFees">Condo Fees (Annual)</Label>
                <Input
                  id="condoFees"
                  type="number"
                  value={inputs.condoFees}
                  onChange={(e) => updateInput('condoFees', Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Assumptions */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Assumptions</CardTitle>
            <CardDescription>Investment returns and economic factors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="investmentReturn">Investment Return (%)</Label>
                <Input
                  id="investmentReturn"
                  type="number"
                  step="0.1"
                  value={inputs.investmentReturn}
                  onChange={(e) => updateInput('investmentReturn', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Expected annual return on invested down payment
                </p>
              </div>

              <div>
                <Label htmlFor="inflationRate">Inflation Rate (%)</Label>
                <Input
                  id="inflationRate"
                  type="number"
                  step="0.1"
                  value={inputs.inflationRate}
                  onChange={(e) => updateInput('inflationRate', Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="marginalTaxRate">Marginal Tax Rate (%)</Label>
                <Input
                  id="marginalTaxRate"
                  type="number"
                  step="0.1"
                  value={inputs.marginalTaxRate}
                  onChange={(e) => updateInput('marginalTaxRate', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  For investment income calculations
                </p>
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
            </div>
          </CardContent>
        </Card>

        {/* Analysis Period */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Period</CardTitle>
            <CardDescription>How long do you plan to stay?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yearsAnalyzed">Years to Analyze</Label>
                <Input
                  id="yearsAnalyzed"
                  type="number"
                  value={inputs.yearsAnalyzed}
                  onChange={(e) => updateInput('yearsAnalyzed', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Typical range: 5-20 years
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
