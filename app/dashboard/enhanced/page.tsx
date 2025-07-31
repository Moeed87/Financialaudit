
'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialManagement } from '@/components/financial/financial-management'
import { AIChat } from '@/components/ai-coach/ai-chat'
import { FinancialAuditComponent } from '@/components/ai-coach/financial-audit'
import { BudgetCharts } from '@/components/budget/budget-charts'
import { BudgetSummary } from '@/components/budget/budget-summary'
import { FinancialRecommendations } from '@/components/budget/financial-recommendations'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  MessageCircle, 
  FileSearch, 
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Budget } from '@/lib/types'
import { generateFinancialRecommendations } from '@/lib/recommendation-engine'

export default function EnhancedDashboard() {
  const { data: session, status } = useSession()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchBudgets()
    }
  }, [status])

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets')
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
        if (data.length > 0) {
          setSelectedBudget(data[0]) // Select most recent budget
        }
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const budgetToPersonalizationData = (budget: Budget) => {
    return {
      name: budget.name || 'My Budget',
      province: budget.province || 'ON',
      lifeSituation: budget.lifeSituation || 'single',
      ageRange: budget.ageRange || '25-34',
      workStatus: budget.workStatus || 'employed',
      housingSituation: budget.housingSituation || 'rent',
      primaryGoal: budget.primaryGoal || 'save_money'
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Financial Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Complete financial management with AI-powered insights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Enhanced
              </Badge>
              {budgets.length === 0 && (
                <Link href="/planner">
                  <Button className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Create Budget
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {budgets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Budget Created Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first budget to unlock AI-powered financial coaching and comprehensive tracking
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/planner">
                  <Button size="lg" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Create Your First Budget
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="networth" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Net Worth
              </TabsTrigger>
              <TabsTrigger value="aicoach" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                AI Coach
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <FileSearch className="w-4 h-4" />
                Audit
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Advice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Budget Summary */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Budget Overview
                      </CardTitle>
                      <CardDescription>
                        Your current budget breakdown and financial health
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedBudget && (
                        <>
                          <BudgetSummary 
                            items={selectedBudget.budgetItems || []}
                            province={selectedBudget.province}
                          />
                          <div className="mt-6">
                            <BudgetCharts items={selectedBudget.budgetItems || []} />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>
                        Get started with financial management
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href="/planner">
                        <Button className="w-full justify-start" variant="outline">
                          <Target className="w-4 h-4 mr-2" />
                          Create New Budget
                        </Button>
                      </Link>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => {
                          const tabs = document.querySelector('[value="networth"]') as HTMLElement
                          tabs?.click()
                        }}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Add Assets & Debts
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => {
                          const tabs = document.querySelector('[value="aicoach"]') as HTMLElement
                          tabs?.click()
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat with AI Coach
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => {
                          const tabs = document.querySelector('[value="audit"]') as HTMLElement
                          tabs?.click()
                        }}
                      >
                        <FileSearch className="w-4 h-4 mr-2" />
                        Financial Audit
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Financial Health Status */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Financial Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedBudget && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Budget Balance</span>
                            <Badge 
                              variant={selectedBudget.disposableIncome >= 0 ? "default" : "destructive"}
                            >
                              {selectedBudget.disposableIncome >= 0 ? 'Positive' : 'Negative'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Monthly Surplus</span>
                            <span className={`font-medium ${
                              selectedBudget.disposableIncome >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${selectedBudget.disposableIncome.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selectedBudget.disposableIncome >= 0 ? 
                              'You have money left over each month. Consider investing or building emergency fund.' :
                              'You are spending more than you earn. Time for a serious budget review with the AI coach.'
                            }
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="networth">
              <FinancialManagement />
            </TabsContent>

            <TabsContent value="aicoach">
              <div className="h-[800px]">
                <AIChat />
              </div>
            </TabsContent>

            <TabsContent value="audit">
              <FinancialAuditComponent />
            </TabsContent>

            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Financial Recommendations
                  </CardTitle>
                  <CardDescription>
                    Personalized advice based on your current budget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedBudget ? (
                    <FinancialRecommendations 
                      recommendations={generateFinancialRecommendations(
                        selectedBudget.budgetItems || [], 
                        budgetToPersonalizationData(selectedBudget)
                      )}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Budget Available</h3>
                      <p className="text-muted-foreground">
                        Create a budget first to receive personalized recommendations
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
