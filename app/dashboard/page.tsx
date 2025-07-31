
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetCharts } from '@/components/budget/budget-charts';
import { BudgetSummary } from '@/components/budget/budget-summary';
import { BudgetItemsManager } from '@/components/budget/budget-items-manager';
import { FinancialRecommendations } from '@/components/budget/financial-recommendations';
import { FinancialManagement } from '@/components/financial/financial-management';
import { AIChat } from '@/components/ai-coach/ai-chat';
import { FinancialAuditComponent } from '@/components/ai-coach/financial-audit';
import { generateFinancialRecommendations } from '@/lib/recommendation-engine';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Target,
  DollarSign,
  MessageCircle,
  FileSearch,
  TrendingUp,
  PieChart,
  Sparkles
} from 'lucide-react';

interface Budget {
  id: string;
  name: string;
  province: string;
  lifeSituation?: string;
  ageRange?: string;
  workStatus?: string;
  housingSituation?: string;
  primaryGoal?: string;
  grossIncome: number;
  netIncome: number;
  totalExpenses: number;
  disposableIncome: number;
  totalTax: number;
  createdAt: string;
  updatedAt: string;
  budgetItems: any[];
}

// Helper function to convert Budget to PersonalizationData
function budgetToPersonalizationData(budget: Budget) {
  return {
    name: budget.name,
    province: budget.province,
    lifeSituation: budget.lifeSituation || 'single',
    ageRange: budget.ageRange || '25-34',
    workStatus: budget.workStatus || 'employed',
    housingSituation: budget.housingSituation || 'rent',
    primaryGoal: budget.primaryGoal || 'save-money'
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchBudgets();
  }, [session, status, router]);

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets || []);
        if (data.budgets?.length > 0) {
          setSelectedBudget(data.budgets[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBudgets(prev => prev.filter(b => b.id !== budgetId));
        if (selectedBudget?.id === budgetId) {
          const remainingBudgets = budgets.filter(b => b.id !== budgetId);
          setSelectedBudget(remainingBudgets.length > 0 ? remainingBudgets[0] : null);
        }
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            Welcome back, {session?.user?.name || 'there'}!
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Enhanced
            </Badge>
          </h1>
          <p className="text-gray-600">
            Complete financial management with AI-powered coaching and comprehensive tracking.
          </p>
        </div>

        {budgets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mb-6">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No budgets yet</h2>
                <p className="text-gray-600 mb-6">
                  Create your first budget to unlock AI-powered financial coaching and comprehensive tracking.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/planner">
                    <Button size="lg">
                      <Target className="mr-2 h-4 w-4" />
                      Create Your First Budget
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="budgets" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
              <TabsTrigger value="budgets" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <PieChart className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Budgets</span>
              </TabsTrigger>
              <TabsTrigger value="networth" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Net Worth</span>
              </TabsTrigger>
              <TabsTrigger value="aicoach" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs sm:text-sm">AI Coach</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <FileSearch className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Audit</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Advice</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="budgets" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Budget List Sidebar */}
                <div className="xl:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        Your Budgets
                        <Link href="/planner">
                          <Button size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2">
                            <Plus className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">New</span>
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3" data-testid="budget-list">
                      {budgets.map((budget) => (
                        <div
                          key={budget.id}
                          className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedBudget?.id === budget.id
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedBudget(budget)}
                          data-testid="budget-item"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-sm sm:text-base truncate pr-2">{budget.name}</h3>
                            <div className="flex space-x-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/planner?edit=${budget.id}`);
                                }}
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 sm:h-8 sm:w-8 text-red-600 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBudget(budget.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {budget.province?.charAt(0)?.toUpperCase() + budget.province?.slice(1)?.replace('_', ' ')}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(budget.updatedAt)}
                            </div>
                            <div className="font-medium text-green-600">
                              {formatCurrency(budget.disposableIncome)}/month
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Budget Details */}
                <div className="xl:col-span-3">
                  {selectedBudget ? (
                    <div className="space-y-4 sm:space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="text-lg sm:text-xl">{selectedBudget.name}</span>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                              {selectedBudget.primaryGoal && (
                                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                  <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="truncate">
                                    {selectedBudget.primaryGoal?.replace('-', ' ')?.replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                </div>
                              )}
                              <Button
                                size="sm"
                                onClick={() => router.push(`/planner?edit=${selectedBudget.id}`)}
                                className="self-start sm:self-auto"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                                <span className="sm:hidden">Edit Budget</span>
                              </Button>
                            </div>
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Last updated on {formatDate(selectedBudget.updatedAt)}
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      <BudgetSummary
                        items={selectedBudget.budgetItems || []}
                        province={selectedBudget.province}
                      />

                      <BudgetCharts items={selectedBudget.budgetItems || []} />

                      <BudgetItemsManager 
                        budgetId={selectedBudget.id}
                        items={selectedBudget.budgetItems || []}
                        onItemsUpdated={fetchBudgets}
                      />

                      <FinancialRecommendations 
                        recommendations={generateFinancialRecommendations(
                          selectedBudget.budgetItems || [], 
                          budgetToPersonalizationData(selectedBudget)
                        )} 
                      />
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <p className="text-gray-600">Select a budget to view details</p>
                      </CardContent>
                    </Card>
                  )}
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
              <div className="space-y-6">
                {budgets.map((budget) => (
                  <Card key={budget.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Financial Recommendations for {budget.name}
                      </CardTitle>
                      <CardDescription>
                        Personalized advice based on your budget and financial situation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FinancialRecommendations 
                        recommendations={generateFinancialRecommendations(
                          budget.budgetItems || [], 
                          budgetToPersonalizationData(budget)
                        )} 
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
