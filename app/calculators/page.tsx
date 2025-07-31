
import { MortgageCalculator } from '@/components/calculators/mortgage-calculator';
import { HomeAffordabilityCalculator } from '@/components/calculators/home-affordability-calculator';
import { LoanPaymentCalculator } from '@/components/calculators/loan-payment-calculator';
import { CreditCardPayoffCalculator } from '@/components/calculators/credit-card-payoff-calculator';
import { RRSPvsTFSACalculator } from '@/components/calculators/rrsp-tfsa-calculator';
import { BuyVsRentCalculator } from '@/components/calculators/buy-vs-rent-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Home, 
  DollarSign, 
  Car, 
  CreditCard, 
  TrendingUp, 
  Building2,
  Users,
  Shield,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Financial Calculators
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Free Canadian financial calculators to help you make informed decisions about mortgages, loans, 
              debt payoff, and retirement planning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  <Users className="mr-2 h-5 w-5" />
                  Sign Up to Save Results
                </Button>
              </Link>
              <Badge variant="secondary" className="self-center">
                <Shield className="mr-1 h-4 w-4" />
                100% Free • No Registration Required
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Calculators */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="mortgage" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8 h-auto gap-2 sm:gap-0">
              <TabsTrigger value="mortgage" className="text-xs sm:text-sm p-3 lg:p-4 flex-col sm:flex-row">
                <Home className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
                <span className="text-center">Mortgage</span>
              </TabsTrigger>
              <TabsTrigger value="affordability" className="text-xs sm:text-sm p-3 lg:p-4 flex-col sm:flex-row">
                <DollarSign className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
                <span className="text-center">Home Affordability</span>
              </TabsTrigger>
              <TabsTrigger value="buy-vs-rent" className="text-xs sm:text-sm p-3 lg:p-4 flex-col sm:flex-row">
                <Building2 className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
                <span className="text-center">Buy vs Rent</span>
              </TabsTrigger>
              <TabsTrigger value="loan" className="text-xs sm:text-sm p-3 lg:p-4 flex-col sm:flex-row">
                <Car className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
                <span className="text-center">Loan Payment</span>
              </TabsTrigger>
              <TabsTrigger value="credit-card" className="text-xs sm:text-sm p-3 lg:p-4 flex-col sm:flex-row">
                <CreditCard className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
                <span className="text-center">Credit Card Payoff</span>
              </TabsTrigger>
              <TabsTrigger value="rrsp-tfsa" className="text-xs sm:text-sm p-3 lg:p-4 flex-col sm:flex-row">
                <TrendingUp className="h-4 w-4 sm:mr-2 mb-1 sm:mb-0" />
                <span className="text-center">RRSP vs TFSA</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mortgage" id="mortgage">
              <MortgageCalculator />
            </TabsContent>

            <TabsContent value="affordability" id="affordability">
              <HomeAffordabilityCalculator />
            </TabsContent>

            <TabsContent value="buy-vs-rent" id="buy-vs-rent">
              <BuyVsRentCalculator />
            </TabsContent>

            <TabsContent value="loan" id="loan">
              <LoanPaymentCalculator />
            </TabsContent>

            <TabsContent value="credit-card" id="credit-card">
              <CreditCardPayoffCalculator />
            </TabsContent>

            <TabsContent value="rrsp-tfsa" id="rrsp-tfsa">
              <RRSPvsTFSACalculator />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Use Our Calculators?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for Canadians with accurate rates, rules, and regulations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Canadian-Specific</CardTitle>
                <CardDescription>
                  Built for Canadian financial rules including CMHC insurance, stress tests, 
                  provincial tax rates, and lending guidelines.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calculator className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Always Free</CardTitle>
                <CardDescription>
                  Use all calculators for free with no registration required. 
                  Sign up optionally to save and compare results.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>Export Results</CardTitle>
                <CardDescription>
                  Download your calculations as CSV files for your records, 
                  financial planning, or sharing with advisors.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready for Comprehensive Financial Planning?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Use our full budget planner with AI-powered recommendations and detailed financial tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/planner">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Calculator className="mr-2 h-5 w-5" />
                Try Budget Planner
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
