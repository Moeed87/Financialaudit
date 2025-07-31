
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

// POST /api/ai-coach/chat - Chat with AI financial coach
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

    const body = await request.json()
    const { message, includeFinancialData = true } = body

    if (!message) {
      return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 })
    }

    // Gather complete financial picture if requested
    let financialContext = ''
    if (includeFinancialData) {
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

      financialContext = `

FINANCIAL CONTEXT FOR ANALYSIS:
=================================

User: ${user.name || user.email}

BUDGET SUMMARY:
- Monthly Net Income: $${monthlyIncome.toLocaleString()}
- Monthly Expenses: $${monthlyExpenses.toLocaleString()}
- Monthly Surplus/Deficit: $${(monthlyIncome - monthlyExpenses).toLocaleString()}
- Province: ${latestBudget?.province || 'Unknown'}

ASSETS (Total: $${totalAssets.toLocaleString()}):
${assets.map(asset => `- ${asset.name} (${asset.type}): $${asset.value.toLocaleString()}`).join('\n') || '- No assets recorded'}

LIABILITIES (Total: $${totalLiabilities.toLocaleString()}):
${liabilities.map(liability => {
  const rate = liability.interestRate ? ` at ${liability.interestRate}% APR` : ''
  const minPayment = liability.minimumPayment ? `, Min Payment: $${liability.minimumPayment}` : ''
  return `- ${liability.name} (${liability.type}): $${liability.balance.toLocaleString()}${rate}${minPayment}`
}).join('\n') || '- No liabilities recorded'}

NET WORTH: $${netWorth.toLocaleString()}

HIGH-INTEREST DEBTS (>15% APR):
${liabilities.filter(l => (l.interestRate || 0) > 15).map(l => `- ${l.name}: $${l.balance.toLocaleString()} at ${l.interestRate}%`).join('\n') || '- None detected'}

CREDIT CARD DEBT:
${liabilities.filter(l => l.type === 'credit_card').map(l => {
  const utilization = l.creditLimit ? ` (${((l.balance / l.creditLimit) * 100).toFixed(1)}% utilization)` : ''
  return `- ${l.name}: $${l.balance.toLocaleString()}${utilization}`
}).join('\n') || '- No credit card debt'}
`
    }

    // Construct Caleb Hammer-style system prompt
    const systemPrompt = `You are Caleb Hammer, a direct and no-nonsense financial coach. Your communication style is:

CORE TRAITS:
- Blunt and direct - never sugar-coat financial realities
- Mathematically focused - always use specific numbers and calculations
- Frustrated by poor financial decisions but genuinely want to help
- Use signature phrases like "You're not a credit card person", "This is insane", "What the hell is this?"
- Focus on long-term consequences, especially retirement and children's futures
- Challenge every excuse and justification immediately

RESPONSE APPROACH:
1. Express immediate reaction (shock/frustration at poor decisions)
2. Calculate exact costs, interest, and consequences 
3. Eliminate excuses with mathematical reality
4. Provide specific, actionable steps
5. Connect to long-term goals and consequences

KEY RULES:
- If they have credit card debt, immediately say "You're not a credit card person"
- Calculate interest costs and payoff timelines exactly
- Prioritize high-interest debt elimination above all else
- No luxury spending justifications when in debt
- Emergency fund only after credit card debt is gone
- Use Canadian context (RRSP, TFSA, provincial taxes)

Be direct but educational. Show genuine care through tough love.${financialContext}`

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]

    // Stream response from LLM API
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const stream = response.body?.getReader()
    if (!stream) {
      throw new Error('No response stream available')
    }

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await stream.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  controller.close()
                  return
                }
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({content})}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error in AI coach chat:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
