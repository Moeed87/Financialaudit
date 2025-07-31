

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

// GET /api/debts/[id] - Get specific debt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const liability = await prisma.liability.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    });

    if (!liability) {
      return NextResponse.json({ success: false, message: 'Debt not found' }, { status: 404 });
    }

    const debt = liabilityToDebt(liability as Liability);

    if (!debt) {
      return NextResponse.json({ success: false, message: 'Not a valid debt record' }, { status: 400 });
    }

    const response: FormResponse<Debt> = {
      success: true,
      data: debt
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching debt:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT /api/debts/[id] - Update debt
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updatedLiability = await prisma.liability.updateMany({
      where: { 
        id: params.id,
        userId: user.id 
      },
      data: liabilityData
    });

    if (updatedLiability.count === 0) {
      return NextResponse.json({ success: false, message: 'Debt not found' }, { status: 404 });
    }

    // Get the updated record
    const liability = await prisma.liability.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    });

    const updatedDebt = liabilityToDebt(liability! as Liability);

    const response: FormResponse<Debt> = {
      success: true,
      data: updatedDebt!,
      message: 'Debt updated successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating debt:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/debts/[id] - Delete debt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const deletedLiability = await prisma.liability.deleteMany({
      where: { 
        id: params.id,
        userId: user.id 
      }
    });

    if (deletedLiability.count === 0) {
      return NextResponse.json({ success: false, message: 'Debt not found' }, { status: 404 });
    }

    const response: FormResponse = {
      success: true,
      message: 'Debt deleted successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
