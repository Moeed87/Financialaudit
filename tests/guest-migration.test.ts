
/**
 * Test Suite: Guest-to-User Migration System
 * 
 * Validates the comprehensive guest-to-user budget migration system:
 * - Guest budget creation returns guestSessionId
 * - Migration attaches budgets on sign-up
 * - Authenticated budget POST writes userId
 * - Error handling and edge cases
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { POST as createBudget, GET as getBudgets } from '@/app/api/budgets/route';
import { POST as migrateBudgets, GET as checkMigration } from '@/app/api/auth/migrate/route';
import { generateGuestSessionId } from '@/lib/guest-utils';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock Prisma
jest.mock('@prisma/client');

// Mock guest utils
jest.mock('@/lib/guest-utils', () => ({
  ...jest.requireActual('@/lib/guest-utils'),
  getGuestSessionIdFromCookies: jest.fn(),
  getGuestIdFromCookies: jest.fn(),
  getOrCreateGuestSessionId: jest.fn(),
  getOrCreateGuestId: jest.fn(),
  setGuestSessionCookie: jest.fn(),
  setGuestIdCookie: jest.fn(),
  clearGuestSessionCookie: jest.fn(),
  clearGuestIdCookie: jest.fn(),
  generateGuestSessionId: jest.fn(),
}));

const mockPrisma = {
  budget: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

const { getServerSession } = require('next-auth');
const guestUtils = require('@/lib/guest-utils');

describe('Guest-to-User Migration System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
  });

  describe('Test 1: Guest budget creation returns guestSessionId', () => {
    test('should create guest budget with guestSessionId when user is not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValue(null);
      
      // Mock guest session ID generation
      const mockGuestSessionId = 'test-guest-session-123';
      guestUtils.getOrCreateGuestSessionId.mockReturnValue({
        guestSessionId: mockGuestSessionId,
        isNew: true
      });
      guestUtils.getOrCreateGuestId.mockReturnValue({
        guestId: 'guest_legacy_123',
        isNew: true
      });

      // Mock budget creation
      const mockBudget = {
        id: 'budget-123',
        guestSessionId: mockGuestSessionId,
        guestId: 'guest_legacy_123',
        userId: null,
        name: 'Test Budget',
        province: 'ON'
      };
      mockPrisma.budget.create.mockResolvedValue(mockBudget);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Budget',
          province: 'ON',
          lifeSituation: 'single',
          budgetItems: []
        }),
      });

      // Call API
      const response = await createBudget(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.budget.guestSessionId).toBe(mockGuestSessionId);
      expect(responseData.budget.userId).toBeNull();
      expect(mockPrisma.budget.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            guestSessionId: mockGuestSessionId,
            guestId: 'guest_legacy_123',
            userId: undefined
          })
        })
      );
    });
  });

  describe('Test 2: Migration attaches budgets on sign-up', () => {
    test('should migrate guest budgets to authenticated user', async () => {
      // Mock authenticated session
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      getServerSession.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Mock guest session data
      const mockGuestSessionId = 'guest-session-456';
      const mockGuestId = 'guest_legacy_456';
      guestUtils.getGuestSessionIdFromCookies.mockReturnValue(mockGuestSessionId);
      guestUtils.getGuestIdFromCookies.mockReturnValue(mockGuestId);

      // Mock transaction for migration
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          budget: {
            updateMany: jest.fn()
              .mockResolvedValueOnce({ count: 1 }) // Legacy migration
              .mockResolvedValueOnce({ count: 2 }) // Session migration
          }
        };
        
        return await callback(mockTx);
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/auth/migrate', {
        method: 'POST',
      });

      // Call migration API
      const response = await migrateBudgets(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.migratedCount).toBe(3);
      expect(responseData.details.legacyBudgets).toBe(1);
      expect(responseData.details.sessionBudgets).toBe(2);
    });
  });

  describe('Test 3: Authenticated budget POST writes userId', () => {
    test('should create budget with userId when user is authenticated', async () => {
      // Mock authenticated session
      const mockUser = { id: 'user-789', email: 'auth@example.com' };
      getServerSession.mockResolvedValue({ user: { email: 'auth@example.com' } });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Mock budget creation
      const mockBudget = {
        id: 'budget-789',
        userId: 'user-789',
        guestSessionId: null,
        guestId: null,
        name: 'Authenticated Budget',
        province: 'BC'
      };
      mockPrisma.budget.create.mockResolvedValue(mockBudget);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Authenticated Budget',
          province: 'BC',
          lifeSituation: 'couple',
          budgetItems: []
        }),
      });

      // Call API
      const response = await createBudget(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.budget.userId).toBe('user-789');
      expect(responseData.budget.guestSessionId).toBeNull();
      expect(mockPrisma.budget.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-789'
          })
        })
      );
    });
  });

  describe('Test 4: Guest data detection and retrieval', () => {
    test('should correctly detect and return guest data for migration', async () => {
      // Mock guest session data
      const mockGuestSessionId = 'guest-session-check';
      const mockGuestId = 'guest_legacy_check';
      guestUtils.getGuestSessionIdFromCookies.mockReturnValue(mockGuestSessionId);
      guestUtils.getGuestIdFromCookies.mockReturnValue(mockGuestId);

      // Mock guest budgets
      const mockGuestBudgets = [
        {
          id: 'budget-1',
          guestSessionId: mockGuestSessionId,
          userId: null,
          name: 'Guest Budget 1',
          budgetItems: []
        },
        {
          id: 'budget-2',
          guestId: mockGuestId,
          userId: null,
          name: 'Guest Budget 2',
          budgetItems: []
        }
      ];
      mockPrisma.budget.findMany.mockResolvedValue(mockGuestBudgets);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/auth/migrate', {
        method: 'GET',
      });

      // Call check migration API
      const response = await checkMigration(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.hasGuestData).toBe(true);
      expect(responseData.guestBudgets).toHaveLength(2);
      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { guestId: mockGuestId, userId: null },
              { guestSessionId: mockGuestSessionId, userId: null }
            ]
          }
        })
      );
    });
  });

  describe('Test 5: Error handling and edge cases', () => {
    test('should handle migration when no guest data exists', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

      // Mock no guest data
      guestUtils.getGuestSessionIdFromCookies.mockReturnValue(null);
      guestUtils.getGuestIdFromCookies.mockReturnValue(null);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/auth/migrate', {
        method: 'POST',
      });

      // Call migration API
      const response = await migrateBudgets(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.migratedCount).toBe(0);
      expect(responseData.message).toBe('No guest data to migrate');
    });

    test('should handle budget creation errors gracefully', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValue(null);
      
      // Mock guest session ID generation
      guestUtils.getOrCreateGuestSessionId.mockReturnValue({
        guestSessionId: 'test-session',
        isNew: true
      });
      guestUtils.getOrCreateGuestId.mockReturnValue({
        guestId: 'test-guest',
        isNew: true
      });

      // Mock database error
      mockPrisma.budget.create.mockRejectedValue(new Error('Database connection failed'));

      // Create request
      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Budget',
          province: 'ON',
          budgetItems: []
        }),
      });

      // Call API
      const response = await createBudget(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Could not save budget – please try again.');
    });
  });

  describe('Test 6: Comprehensive budget retrieval with mixed guest data', () => {
    test('should retrieve both legacy and new guest budgets correctly', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValue(null);

      // Mock mixed guest data
      const mockGuestSessionId = 'session-mixed';
      const mockGuestId = 'guest_legacy_mixed';
      guestUtils.getGuestSessionIdFromCookies.mockReturnValue(mockGuestSessionId);
      guestUtils.getGuestIdFromCookies.mockReturnValue(mockGuestId);

      // Mock mixed guest budgets
      const mockBudgets = [
        {
          id: 'budget-legacy',
          guestId: mockGuestId,
          guestSessionId: null,
          userId: null,
          name: 'Legacy Guest Budget'
        },
        {
          id: 'budget-session',
          guestId: null,
          guestSessionId: mockGuestSessionId,
          userId: null,
          name: 'Session Guest Budget'
        }
      ];
      mockPrisma.budget.findMany.mockResolvedValue(mockBudgets);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'GET',
      });

      // Call API
      const response = await getBudgets(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.budgets).toHaveLength(2);
      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { guestId: mockGuestId, userId: null },
              { guestSessionId: mockGuestSessionId, userId: null }
            ]
          }
        })
      );
    });
  });
});
