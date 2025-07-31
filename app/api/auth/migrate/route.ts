
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { 
  getGuestIdFromCookies, 
  getGuestSessionIdFromCookies, 
  clearGuestIdCookie, 
  clearGuestSessionCookie 
} from '@/lib/guest-utils';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/migrate
 * Check if there's guest data to migrate
 */
export async function GET(request: NextRequest) {
  try {
    const guestId = getGuestIdFromCookies();
    const guestSessionId = getGuestSessionIdFromCookies();

    if (!guestId && !guestSessionId) {
      return NextResponse.json({ 
        hasGuestData: false, 
        guestBudgets: [] 
      });
    }

    // Check for budgets associated with guest IDs
    const guestBudgets = await prisma.budget.findMany({
      where: {
        OR: [
          { guestId: guestId, userId: null },
          { guestSessionId: guestSessionId, userId: null }
        ]
      },
      include: {
        budgetItems: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      hasGuestData: guestBudgets.length > 0,
      guestBudgets: guestBudgets
    });
  } catch (error) {
    console.error('Error checking guest data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/auth/migrate
 * Migrate guest budgets to authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const guestId = getGuestIdFromCookies();
    const guestSessionId = getGuestSessionIdFromCookies();

    if (!guestId && !guestSessionId) {
      return NextResponse.json({ 
        success: true, 
        message: 'No guest data to migrate',
        migratedCount: 0
      });
    }

    // Find the authenticated user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Perform migration using transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update budgets from legacy guestId
      const legacyMigration = guestId ? await tx.budget.updateMany({
        where: { 
          guestId: guestId, 
          userId: null 
        },
        data: { 
          userId: user.id, 
          guestId: null 
        }
      }) : { count: 0 };

      // Update budgets from new guestSessionId
      const sessionMigration = guestSessionId ? await tx.budget.updateMany({
        where: { 
          guestSessionId: guestSessionId, 
          userId: null 
        },
        data: { 
          userId: user.id, 
          guestSessionId: null 
        }
      }) : { count: 0 };

      return {
        legacyCount: legacyMigration.count,
        sessionCount: sessionMigration.count,
        totalCount: legacyMigration.count + sessionMigration.count
      };
    });

    // Create response and clear guest cookies
    const response = NextResponse.json({
      success: true,
      message: `Successfully migrated ${result.totalCount} budget(s)`,
      migratedCount: result.totalCount,
      details: {
        legacyBudgets: result.legacyCount,
        sessionBudgets: result.sessionCount
      }
    });

    // Clear guest cookies after successful migration
    if (guestId) {
      clearGuestIdCookie(response);
    }
    if (guestSessionId) {
      clearGuestSessionCookie(response);
    }

    return response;
  } catch (error) {
    console.error('Error migrating guest data:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
