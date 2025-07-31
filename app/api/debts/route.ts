

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { DebtFormData, FormResponse, Debt, Liability } from '@/lib/types';
import { 
  calculateMinimumPayment, 
  debtToLiability, 
  liabilityToDebt,
  requiresCreditLimit,
  requiresLoanTerm
} from '@/lib/debt-calculator';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// GET /api/debts - Fetch user's debts (from liabilities)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const liabilities = await prisma.liability.findMany({
      where: { 
        userId: user.id
      },
      orderBy: { createdAt: 'desc' }
    });

    // Convert liabilities to debts
    const debts = liabilities
      .map(liability => liabilityToDebt(liability as Liability))
      .filter((debt): debt is Debt => debt !== null);

    const response: FormResponse<Debt[]> = {
      success: true,
      data: debts
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST /api/debts - Create new debt
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const body: DebtFormData = await request.json();
    
    // Enhanced debt-specific validation
    const validationErrors: string[] = [];
    
    if (!body.kind) {
      validationErrors.push('Debt type is required');
    }
    
    if (!body.name.trim()) {
      validationErrors.push('Debt name is required');
    }
    
    if (body.balance <= 0) {
      validationErrors.push('Balance must be greater than 0');
    }
    
    if (body.interestRate < 0) {
      validationErrors.push('Interest rate cannot be negative');
    }
    
    if (requiresCreditLimit(body.kind) && (!body.limit || body.limit <= 0)) {
      validationErrors.push('Credit limit is required for this debt type');
    }
    
    if (requiresCreditLimit(body.kind) && body.limit && body.balance > body.limit) {
      validationErrors.push('Balance cannot exceed credit limit');
    }
    
    if (requiresLoanTerm(body.kind) && (!body.term || body.term <= 0)) {
      validationErrors.push('Loan term is required for this debt type');
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        errors: validationErrors.map(message => ({ field: 'general', message }))
      }, { status: 400 });
    }

    // Calculate minimum payment
    const minPayment = calculateMinimumPayment(
      body.kind,
      body.balance,
      body.interestRate,
      body.term,
      body.limit
    );

    // Validate custom payment if provided
    if (body.userPayment && body.userPayment < minPayment) {
      return NextResponse.json({
        success: false,
        message: 'Custom payment cannot be less than minimum payment'
      }, { status: 400 });
    }

    // Create debt object
    const debt = {
      kind: body.kind,
      name: body.name,
      balance: body.balance,
      limit: body.limit,
      interestRate: body.interestRate,
      minPayment,
      userPayment: body.userPayment,
      term: body.term,
      description: body.description
    };

    // Convert to liability format for persistence
    const liabilityData = debtToLiability(debt);

    const liability = await prisma.liability.create({
      data: {
        userId: user.id,
        ...liabilityData
      }
    });

    // Convert back to debt format for response
    const createdDebt = liabilityToDebt(liability as Liability);

    const response: FormResponse<Debt> = {
      success: true,
      data: createdDebt!,
      message: 'Debt created successfully'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating debt:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
