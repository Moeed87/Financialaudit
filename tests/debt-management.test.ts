
import { 
  calculateMinimumPayment, 
  debtToLiability, 
  liabilityToDebt, 
  requiresCreditLimit, 
  requiresLoanTerm,
  getDebtKindDisplayName 
} from '../app/lib/debt-calculator';
import { DebtKind, Debt, Liability } from '../app/lib/types';

describe('Debt Management System', () => {
  
  // Test minimum payment calculations
  describe('calculateMinimumPayment', () => {
    
    test('LOC: Interest-only payment calculation', () => {
      // Test case: LOC $20k limit, $5k balance, 8% interest should return $33.33
      const minPayment = calculateMinimumPayment('LOC', 5000, 8);
      expect(minPayment).toBeCloseTo(33.33, 2);
    });

    test('LOC: Various scenarios', () => {
      // Zero balance
      expect(calculateMinimumPayment('LOC', 0, 8)).toBe(0);
      
      // Different rates and balances
      expect(calculateMinimumPayment('LOC', 10000, 6)).toBeCloseTo(50, 2);
      expect(calculateMinimumPayment('LOC', 15000, 12)).toBeCloseTo(150, 2);
    });

    test('Credit Card: 3% of balance calculation', () => {
      // Various credit card scenarios
      expect(calculateMinimumPayment('CreditCard', 1000, 19.99)).toBeCloseTo(30, 2);
      expect(calculateMinimumPayment('CreditCard', 5000, 24.99)).toBeCloseTo(150, 2);
      expect(calculateMinimumPayment('CreditCard', 0, 20)).toBe(0);
    });

    test('Personal Loan: Amortized payment calculation', () => {
      // Personal loan with 36 month term at 8% interest
      const payment = calculateMinimumPayment('PersonalLoan', 10000, 8, 36);
      expect(payment).toBeGreaterThan(300); // Should be around $313
      expect(payment).toBeLessThan(350);
    });

    test('Personal Loan: Fallback to 2% when no term', () => {
      // When no term provided, should fallback to 2%
      const payment = calculateMinimumPayment('PersonalLoan', 10000, 8);
      expect(payment).toBeCloseTo(200, 2); // 2% of 10000 = 200
    });

    test('Student Loan: Amortized payment calculation', () => {
      // Student loan with 120 month term (10 years)
      const payment = calculateMinimumPayment('StudentLoan', 25000, 6, 120);
      expect(payment).toBeGreaterThan(275);
      expect(payment).toBeLessThan(300);
    });

    test('Other Loan: Various scenarios', () => {
      // With term
      const paymentWithTerm = calculateMinimumPayment('OtherLoan', 15000, 10, 60);
      expect(paymentWithTerm).toBeGreaterThan(300);
      
      // Without term (fallback to 2%)
      const paymentWithoutTerm = calculateMinimumPayment('OtherLoan', 15000, 10);
      expect(paymentWithoutTerm).toBeCloseTo(300, 2);
    });
  });

  // Test debt conversion functions
  describe('debtToLiability and liabilityToDebt', () => {
    
    test('Credit Card debt conversion', () => {
      const debt: Omit<Debt, 'id'> = {
        kind: 'CreditCard',
        name: 'Chase Sapphire',
        balance: 3500,
        limit: 10000,
        interestRate: 22.99,
        minPayment: 105, // 3% of 3500
        userPayment: 150,
        description: 'Travel rewards card'
      };

      const liability = debtToLiability(debt);
      
      expect(liability.type).toBe('credit_card');
      expect(liability.name).toBe('Chase Sapphire');
      expect(liability.balance).toBe(3500);
      expect(liability.creditLimit).toBe(10000);
      expect(liability.interestRate).toBe(22.99);
      expect(liability.minimumPayment).toBe(150); // Uses userPayment
      expect(liability.details?.debtKind).toBe('CreditCard');
      expect(liability.details?.calculatedMinPayment).toBe(105);
      expect(liability.details?.userPayment).toBe(150);
    });

    test('LOC debt conversion and back', () => {
      const originalDebt: Omit<Debt, 'id'> = {
        kind: 'LOC',
        name: 'TD Line of Credit',
        balance: 5000,
        limit: 20000,
        interestRate: 8,
        minPayment: 33.33,
        userPayment: 100, // User override
        description: 'Home equity LOC'
      };

      const liability = debtToLiability(originalDebt);
      
      // Add id for conversion back
      const liabilityWithId: Liability = {
        id: 'test-123',
        userId: 'user-123',
        ...liability,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const convertedDebt = liabilityToDebt(liabilityWithId);
      
      expect(convertedDebt).not.toBeNull();
      expect(convertedDebt!.kind).toBe('LOC');
      expect(convertedDebt!.name).toBe('TD Line of Credit');
      expect(convertedDebt!.balance).toBe(5000);
      expect(convertedDebt!.limit).toBe(20000);
      expect(convertedDebt!.interestRate).toBe(8);
      expect(convertedDebt!.minPayment).toBe(33.33);
      expect(convertedDebt!.userPayment).toBe(100);
    });

    test('Student Loan conversion', () => {
      const debt: Omit<Debt, 'id'> = {
        kind: 'StudentLoan',
        name: 'Federal Student Loan',
        balance: 25000,
        interestRate: 5.5,
        minPayment: 250,
        term: 120,
        description: 'Government student loan'
      };

      const liability = debtToLiability(debt);
      
      expect(liability.type).toBe('student_loan');
      expect(liability.details?.term).toBe(120);
    });
  });

  // Test debt type validation functions
  describe('Debt type validation', () => {
    
    test('requiresCreditLimit', () => {
      expect(requiresCreditLimit('LOC')).toBe(true);
      expect(requiresCreditLimit('CreditCard')).toBe(true);
      expect(requiresCreditLimit('PersonalLoan')).toBe(false);
      expect(requiresCreditLimit('StudentLoan')).toBe(false);
      expect(requiresCreditLimit('OtherLoan')).toBe(false);
    });

    test('requiresLoanTerm', () => {
      expect(requiresLoanTerm('PersonalLoan')).toBe(true);
      expect(requiresLoanTerm('StudentLoan')).toBe(true);
      expect(requiresLoanTerm('OtherLoan')).toBe(true);
      expect(requiresLoanTerm('LOC')).toBe(false);
      expect(requiresLoanTerm('CreditCard')).toBe(false);
    });

    test('getDebtKindDisplayName', () => {
      expect(getDebtKindDisplayName('LOC')).toBe('Line of Credit');
      expect(getDebtKindDisplayName('CreditCard')).toBe('Credit Card');
      expect(getDebtKindDisplayName('PersonalLoan')).toBe('Personal Loan');
      expect(getDebtKindDisplayName('StudentLoan')).toBe('Student Loan');
      expect(getDebtKindDisplayName('OtherLoan')).toBe('Other Loan');
    });
  });

  // Test comprehensive debt management scenarios
  describe('Comprehensive debt scenarios', () => {
    
    test('Multiple debt types with user overrides', () => {
      const debts: Array<Omit<Debt, 'id'>> = [
        {
          kind: 'LOC',
          name: 'Home Equity LOC',
          balance: 5000,
          limit: 20000,
          interestRate: 8,
          minPayment: 33.33,
          userPayment: 100 // User paying more than minimum
        },
        {
          kind: 'CreditCard',
          name: 'Visa Card',
          balance: 2000,
          limit: 5000,
          interestRate: 19.99,
          minPayment: 60,
          // No user override, using minimum
        },
        {
          kind: 'PersonalLoan',
          name: 'Car Loan',
          balance: 15000,
          interestRate: 7.5,
          term: 60,
          minPayment: 301.5,
          userPayment: 350 // Extra payment toward principal
        }
      ];

      let totalMinPayments = 0;
      let totalUserPayments = 0;

      debts.forEach(debt => {
        totalMinPayments += debt.minPayment;
        totalUserPayments += debt.userPayment || debt.minPayment;
      });

      expect(totalMinPayments).toBeCloseTo(394.83, 2);
      expect(totalUserPayments).toBeCloseTo(510, 2);
      expect(totalUserPayments).toBeGreaterThan(totalMinPayments);
    });

    test('Edge cases and error handling', () => {
      // Zero balance should return 0 payment
      expect(calculateMinimumPayment('CreditCard', 0, 20)).toBe(0);
      
      // Very high interest rate
      const highRatePayment = calculateMinimumPayment('LOC', 1000, 50);
      expect(highRatePayment).toBeCloseTo(41.67, 2);
      
      // Very short loan term
      const shortTermPayment = calculateMinimumPayment('PersonalLoan', 12000, 8, 12);
      expect(shortTermPayment).toBeGreaterThan(1000);
    });

    test('Cash flow integration scenario', () => {
      // Simulate budget with debt payments
      const monthlyIncome = 5000;
      const monthlyExpenses = 2500;
      
      const debts: Array<{ minPayment: number; userPayment?: number }> = [
        { minPayment: 33.33, userPayment: 100 }, // LOC
        { minPayment: 60 }, // Credit Card
        { minPayment: 301.5, userPayment: 350 } // Personal Loan
      ];

      const totalMinPayments = debts.reduce((sum, debt) => sum + debt.minPayment, 0);
      const totalActualPayments = debts.reduce((sum, debt) => sum + (debt.userPayment || debt.minPayment), 0);
      
      const disposableIncomeWithMin = monthlyIncome - monthlyExpenses - totalMinPayments;
      const disposableIncomeWithUser = monthlyIncome - monthlyExpenses - totalActualPayments;
      
      expect(totalMinPayments).toBeCloseTo(394.83, 2);
      expect(totalActualPayments).toBe(510);
      expect(disposableIncomeWithMin).toBeCloseTo(2105.17, 2);
      expect(disposableIncomeWithUser).toBe(1990);
      expect(disposableIncomeWithUser).toBeLessThan(disposableIncomeWithMin);
    });
  });

  // Test specific requirement: LOC $20k limit/$5k balance @8% returns $33.33 min, user override $100 works
  describe('Specific requirement tests', () => {
    
    test('LOC requirement: $20k limit, $5k balance, 8% interest = $33.33 minimum', () => {
      const minPayment = calculateMinimumPayment('LOC', 5000, 8, undefined, 20000);
      expect(minPayment).toBeCloseTo(33.33, 2);
    });

    test('User override $100 works for LOC', () => {
      const debt: Omit<Debt, 'id'> = {
        kind: 'LOC',
        name: 'Test LOC',
        balance: 5000,
        limit: 20000,
        interestRate: 8,
        minPayment: 33.33,
        userPayment: 100
      };

      const liability = debtToLiability(debt);
      expect(liability.minimumPayment).toBe(100); // Should use user payment
      expect(liability.details?.calculatedMinPayment).toBe(33.33);
      expect(liability.details?.userPayment).toBe(100);
    });
  });
});
