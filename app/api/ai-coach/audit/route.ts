
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FormResponse, FinancialAudit, AuditSeverity } from '@/lib/types'

export const dynamic = "force-dynamic"

// POST /api/ai-coach/audit - Generate comprehensive financial audit
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Gather complete financial picture
    const [assets, liabilities, budgets] = await Promise.all([
      prisma.asset.findMany({ where: { userId: user.id } }),
      prisma.liability.findMany({ where: { userId: user.id } }),
      prisma.budget.findMany({ 
        where: { userId: user.id },
        include: { budgetItems: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      })
    ])

    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0)
    const netWorth = totalAssets - totalLiabilities

    const latestBudget = budgets[0]
    const monthlyIncome = latestBudget?.netIncome || 0
    const monthlyExpenses = latestBudget?.totalExpenses || 0
    const monthlySurplus = monthlyIncome - monthlyExpenses

    // Calculate Marcus Score (0-10 scale)
    let marcusScore = 5 // Start neutral
    let severity: AuditSeverity = 'good'

    // Score factors
    const creditCardDebt = liabilities.filter(l => l.type === 'credit_card').reduce((sum, l) => sum + l.balance, 0)
    const highInterestDebt = liabilities.filter(l => (l.interestRate || 0) > 15).reduce((sum, l) => sum + l.balance, 0)
    const emergencyFund = assets.filter(a => a.type === 'savings' || a.type === 'checking').reduce((sum, a) => sum + a.value, 0)
    const monthlyEmergencyNeeds = monthlyExpenses * 3 // 3 months minimum

    // Negative factors
    if (creditCardDebt > 0) marcusScore -= 2
    if (highInterestDebt > monthlyIncome * 3) marcusScore -= 2
    if (monthlySurplus < 0) marcusScore -= 3
    if (emergencyFund < monthlyEmergencyNeeds) marcusScore -= 1
    if (netWorth < 0) marcusScore -= 2

    // Positive factors
    if (netWorth > monthlyIncome * 12) marcusScore += 1
    if (monthlySurplus > monthlyIncome * 0.2) marcusScore += 1
    if (creditCardDebt === 0) marcusScore += 1
    if (emergencyFund >= monthlyEmergencyNeeds) marcusScore += 1

    // Determine severity
    marcusScore = Math.max(0, Math.min(10, marcusScore))
    if (marcusScore >= 8) severity = 'excellent'
    else if (marcusScore >= 6) severity = 'good'
    else if (marcusScore >= 4) severity = 'concerning'
    else if (marcusScore >= 2) severity = 'critical'
    else severity = 'disaster'

    // Prepare financial snapshot for AI analysis
    const financialSnapshot = {
      user: { name: user.name || '', email: user.email },
      summary: {
        totalAssets,
        totalLiabilities,
        netWorth,
        monthlyIncome,
        monthlyExpenses,
        monthlySurplus,
        creditCardDebt,
        highInterestDebt,
        emergencyFund
      },
      assets: assets.map(a => ({
        type: a.type,
        name: a.name,
        value: a.value
      })),
      liabilities: liabilities.map(l => ({
        type: l.type,
        name: l.name,
        balance: l.balance,
        interestRate: l.interestRate,
        minimumPayment: l.minimumPayment
      })),
      budget: latestBudget ? {
        province: latestBudget.province,
        netIncome: latestBudget.netIncome,
        totalExpenses: latestBudget.totalExpenses,
        items: latestBudget.budgetItems.map(item => ({
          type: item.type,
          category: item.category,
          name: item.name,
          monthlyAmount: item.monthlyAmount
        }))
      } : null
    }

    // Generate AI recommendations using Marcus style
    const auditPrompt = `You are Marcus conducting a comprehensive financial audit. Analyze this complete financial picture and provide a BRUTAL but helpful assessment.

FINANCIAL SNAPSHOT:
${JSON.stringify(financialSnapshot, null, 2)}

CURRENT MARCUS SCORE: ${marcusScore}/10 (${severity.toUpperCase()})

Provide a detailed audit with specific calculations and tough love. Be DIRECT, use your signature phrases like "You're not a credit card person", "This is insane", calculate exact numbers, and provide actionable steps.

RESPOND ONLY IN VALID JSON FORMAT - NO MARKDOWN, NO CODE BLOCKS:
{
  "overallAssessment": "Your brutal but honest overall assessment of their financial situation with specific numbers",
  "immediateReaction": "Your immediate gut reaction to seeing this financial picture - express shock, frustration, or concern", 
  "debtAnalysis": "Detailed debt breakdown with exact calculations, interest costs, and payoff timelines using their actual numbers",
  "actionPlan": [
    "Specific actionable step 1 with exact dollar amounts and deadlines",
    "Specific actionable step 2 with exact dollar amounts and deadlines",
    "Specific actionable step 3 with exact dollar amounts and deadlines"
  ],
  "marcusQuotes": [
    "A relevant signature Marcus phrase or reaction to their situation",
    "Another tough love quote that fits their specific financial problems"
  ]
}

Use Canadian financial context (RRSP, TFSA, provincial taxes). Be mathematically precise with calculations. Include exact dollar amounts from their data.`

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: "user", content: auditPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 3000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`LLM API error: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`LLM API error: ${response.status} - ${errorText}`)
    }

    const aiResponse = await response.json()
    
    // Validate AI response structure
    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      console.error('Invalid AI response structure:', aiResponse)
      throw new Error('Invalid response from AI service')
    }

    let recommendations
    try {
      recommendations = JSON.parse(aiResponse.choices[0].message.content)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse.choices[0].message.content)
      throw new Error('Invalid JSON response from AI service')
    }

    // Save audit to database
    const audit = await prisma.financialAudit.create({
      data: {
        userId: user.id,
        auditData: financialSnapshot,
        recommendations: recommendations,
        hammerScore: marcusScore,
        severity: severity,
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        completed: false
      }
    })

    const apiResponse: FormResponse<FinancialAudit> = {
      success: true,
      data: {
        ...audit,
        auditData: audit.auditData as any,
        recommendations: audit.recommendations as any
      } as FinancialAudit,
      message: 'Financial audit completed successfully'
    }

    return NextResponse.json(apiResponse, { status: 201 })

  } catch (error) {
    console.error('Error generating financial audit:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// GET /api/ai-coach/audit - Get user's financial audits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const audits = await prisma.financialAudit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    const response: FormResponse<FinancialAudit[]> = {
      success: true,
      data: audits.map(audit => ({
        ...audit,
        auditData: audit.auditData as any,
        recommendations: audit.recommendations as any
      })) as FinancialAudit[]
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching audits:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
