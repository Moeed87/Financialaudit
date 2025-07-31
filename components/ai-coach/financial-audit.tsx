
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { FinancialAudit, FormResponse, AuditSeverity } from '@/lib/types'
import { 
  FileSearch, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Target, 
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

export function FinancialAuditComponent() {
  const [audits, setAudits] = useState<FinancialAudit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchAudits()
  }, [])

  const fetchAudits = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-coach/audit')
      const result: FormResponse<FinancialAudit[]> = await response.json()

      if (result.success && result.data) {
        setAudits(result.data)
      } else {
        toast.error('Failed to load audits')
      }
    } catch (error) {
      console.error('Error fetching audits:', error)
      toast.error('Failed to load audits')
    } finally {
      setIsLoading(false)
    }
  }

  const generateAudit = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai-coach/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result: FormResponse<FinancialAudit> = await response.json()

      if (result.success && result.data) {
        setAudits(prev => [result.data!, ...prev])
        toast.success('Financial audit completed!')
      } else {
        toast.error(result.message || 'Failed to generate audit')
      }
    } catch (error) {
      console.error('Error generating audit:', error)
      toast.error('Failed to generate audit')
    } finally {
      setIsGenerating(false)
    }
  }

  const getSeverityColor = (severity: AuditSeverity) => {
    switch (severity) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'concerning': return 'bg-yellow-500'
      case 'critical': return 'bg-orange-500'
      case 'disaster': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />
      case 'good': return <TrendingUp className="w-4 h-4" />
      case 'concerning': return <AlertTriangle className="w-4 h-4" />
      case 'critical': return <TrendingDown className="w-4 h-4" />
      case 'disaster': return <XCircle className="w-4 h-4" />
      default: return <FileSearch className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  const renderAuditCard = (audit: FinancialAudit) => {
    const recommendations = audit.recommendations as any

    return (
      <Card key={audit.id} className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getSeverityColor(audit.severity)} text-white`}>
                {getSeverityIcon(audit.severity)}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Financial Audit Report
                  <Badge variant="outline" className="ml-2">
                    Marcus Score: {audit.hammerScore?.toFixed(1) || 'N/A'}/10
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(audit.createdAt).toLocaleDateString('en-CA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  <Badge 
                    variant={audit.severity === 'excellent' || audit.severity === 'good' ? 'default' : 'destructive'}
                    className="ml-2 capitalize"
                  >
                    {audit.severity}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Hammer Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Marcus Financial Score</span>
              <span className="text-sm font-bold">
                {audit.hammerScore?.toFixed(1) || 'N/A'}/10
              </span>
            </div>
            <Progress 
              value={(audit.hammerScore || 0) * 10} 
              className="h-3"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Based on debt levels, savings, spending habits, and financial behaviors
            </div>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financial Snapshot
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Net Worth</div>
                <div className={`font-bold ${
                  (audit.auditData as any).summary?.netWorth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency((audit.auditData as any).summary?.netWorth || 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Monthly Income</div>
                <div className="font-bold text-green-600">
                  {formatCurrency(audit.auditData.budget?.netIncome || 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Monthly Expenses</div>
                <div className="font-bold text-red-600">
                  {formatCurrency(audit.auditData.budget?.totalExpenses || 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Debt</div>
                <div className="font-bold text-red-600">
                  {formatCurrency((audit.auditData as any).summary?.totalLiabilities || 0)}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* AI Recommendations */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Marcus's Assessment
            </h4>
            
            {recommendations.immediateReaction && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-red-800 mb-2">Immediate Reaction:</h5>
                <p className="text-red-700 text-sm italic">"{recommendations.immediateReaction}"</p>
              </div>
            )}

            {recommendations.overallAssessment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-blue-800 mb-2">Overall Assessment:</h5>
                <p className="text-blue-700 text-sm">{recommendations.overallAssessment}</p>
              </div>
            )}

            {recommendations.debtAnalysis && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-orange-800 mb-2">Debt Analysis:</h5>
                <p className="text-orange-700 text-sm">{recommendations.debtAnalysis}</p>
              </div>
            )}

            {recommendations.actionPlan && Array.isArray(recommendations.actionPlan) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-green-800 mb-2">Action Plan:</h5>
                <ul className="text-green-700 text-sm space-y-1">
                  {recommendations.actionPlan.map((step: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="font-bold">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.marcusQuotes && Array.isArray(recommendations.marcusQuotes) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 mb-2">Marcus Quotes:</h5>
                <div className="space-y-2">
                  {recommendations.marcusQuotes.map((quote: string, index: number) => (
                    <blockquote key={index} className="text-gray-700 text-sm italic border-l-4 border-gray-400 pl-3">
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Follow-up */}
          {audit.followUpDate && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-semibold text-yellow-800 mb-1">Follow-up Scheduled:</h5>
              <p className="text-yellow-700 text-sm">
                Check progress on {new Date(audit.followUpDate).toLocaleDateString('en-CA')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileSearch className="w-6 h-6" />
            Financial Audit Reports
          </h2>
          <p className="text-muted-foreground">
            Get a comprehensive analysis of your complete financial picture
          </p>
        </div>
        <Button 
          onClick={generateAudit}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileSearch className="w-4 h-4" />
              New Audit
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : audits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSearch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Audits Yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first financial audit to get personalized recommendations
            </p>
            <Button onClick={generateAudit} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate First Audit'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          {audits.map(renderAuditCard)}
        </div>
      )}
    </div>
  )
}
