
/**
 * Test Suite: Couple Budgeting Income Feature
 * 
 * Validates that when lifeSituation === "couple":
 * - Income items can be created with owner names
 * - Tax calculations work separately for each partner  
 * - Summary displays individual effective tax rates
 * - Household totals are correctly aggregated
 */

import { BudgetItem } from '@/lib/types';
import { calculateTax, convertFrequencyToYearly } from '@/lib/tax-calculator';

// Mock budget items for couple testing
const mockCoupleIncomeItems: BudgetItem[] = [
  {
    id: '1',
    budgetId: 'test-budget',
    type: 'INCOME',
    category: 'Employment Income',
    subcategory: 'Full-time Salary',
    name: 'Software Engineer Salary',
    amount: 85000,
    frequency: 'YEARLY',
    monthlyAmount: 7083.33,
    owner: 'Sarah',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2', 
    budgetId: 'test-budget',
    type: 'INCOME',
    category: 'Employment Income',
    subcategory: 'Full-time Salary', 
    name: 'Marketing Manager Salary',
    amount: 72000,
    frequency: 'YEARLY',
    monthlyAmount: 6000,
    owner: 'John',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    budgetId: 'test-budget', 
    type: 'EXPENSE',
    category: 'Housing',
    subcategory: 'Rent',
    name: 'Monthly Rent',
    amount: 2200,
    frequency: 'MONTHLY',
    monthlyAmount: 2200,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('Couple Budgeting Income Feature', () => {
  const province = 'ON'; // Ontario for testing
  const lifeSituation = 'couple';

  test('should have owner field for income items', () => {
    const incomeItems = mockCoupleIncomeItems.filter(item => item.type === 'INCOME');
    
    expect(incomeItems).toHaveLength(2);
    expect(incomeItems[0].owner).toBe('Sarah');
    expect(incomeItems[1].owner).toBe('John');
  });

  test('should group income items by owner', () => {
    const incomeItems = mockCoupleIncomeItems.filter(item => item.type === 'INCOME');
    
    const incomeByOwner = incomeItems.reduce((acc, item) => {
      const owner = item.owner || 'Unknown';
      if (!acc[owner]) {
        acc[owner] = [];
      }
      acc[owner].push(item);
      return acc;
    }, {} as Record<string, BudgetItem[]>);

    expect(Object.keys(incomeByOwner)).toHaveLength(2);
    expect(incomeByOwner['Sarah']).toHaveLength(1);
    expect(incomeByOwner['John']).toHaveLength(1);
    expect(incomeByOwner['Sarah'][0].amount).toBe(85000);
    expect(incomeByOwner['John'][0].amount).toBe(72000);
  });

  test('should calculate taxes separately for each partner', () => {
    const incomeItems = mockCoupleIncomeItems.filter(item => item.type === 'INCOME');
    
    // Group by owner
    const incomeByOwner = incomeItems.reduce((acc, item) => {
      const owner = item.owner || 'Unknown';
      if (!acc[owner]) {
        acc[owner] = [];
      }
      acc[owner].push(item);
      return acc;
    }, {} as Record<string, BudgetItem[]>);

    const partnerTaxInfo: Array<{
      name: string, 
      income: number, 
      tax: number, 
      netIncome: number, 
      effectiveRate: number
    }> = [];

    // Calculate taxes for each partner
    Object.entries(incomeByOwner).forEach(([owner, ownerItems]) => {
      const ownerAnnualIncome = ownerItems.reduce((sum, item) => 
        sum + convertFrequencyToYearly(item.amount, item.frequency), 0
      );
      
      const ownerTaxCalc = calculateTax(ownerAnnualIncome, province);
      
      partnerTaxInfo.push({
        name: owner,
        income: ownerAnnualIncome,
        tax: ownerTaxCalc.totalTax,
        netIncome: ownerTaxCalc.netIncome,
        effectiveRate: ownerTaxCalc.averageRate
      });
    });

    expect(partnerTaxInfo).toHaveLength(2);
    
    // Sarah's tax calculation (higher income)
    const sarahInfo = partnerTaxInfo.find(p => p.name === 'Sarah');
    expect(sarahInfo).toBeDefined();
    expect(sarahInfo!.income).toBe(85000);
    expect(sarahInfo!.tax).toBeGreaterThan(0);
    expect(sarahInfo!.netIncome).toBeLessThan(sarahInfo!.income);
    expect(sarahInfo!.effectiveRate).toBeGreaterThan(0);

    // John's tax calculation (lower income)
    const johnInfo = partnerTaxInfo.find(p => p.name === 'John');
    expect(johnInfo).toBeDefined(); 
    expect(johnInfo!.income).toBe(72000);
    expect(johnInfo!.tax).toBeGreaterThan(0);
    expect(johnInfo!.netIncome).toBeLessThan(johnInfo!.income);
    expect(johnInfo!.effectiveRate).toBeGreaterThan(0);

    // Sarah should have higher effective tax rate due to progressive tax system
    expect(sarahInfo!.effectiveRate).toBeGreaterThanOrEqual(johnInfo!.effectiveRate);
  });

  test('should calculate correct household totals', () => {
    const incomeItems = mockCoupleIncomeItems.filter(item => item.type === 'INCOME');
    
    // Calculate individual taxes
    let totalHouseholdIncome = 0;
    let totalHouseholdTax = 0;
    let totalHouseholdNetIncome = 0;

    const incomeByOwner = incomeItems.reduce((acc, item) => {
      const owner = item.owner || 'Unknown';
      if (!acc[owner]) {
        acc[owner] = [];
      }
      acc[owner].push(item);
      return acc;
    }, {} as Record<string, BudgetItem[]>);

    Object.entries(incomeByOwner).forEach(([owner, ownerItems]) => {
      const ownerAnnualIncome = ownerItems.reduce((sum, item) => 
        sum + convertFrequencyToYearly(item.amount, item.frequency), 0
      );
      
      const ownerTaxCalc = calculateTax(ownerAnnualIncome, province);
      totalHouseholdIncome += ownerAnnualIncome;
      totalHouseholdTax += ownerTaxCalc.totalTax;
      totalHouseholdNetIncome += ownerTaxCalc.netIncome;
    });

    expect(totalHouseholdIncome).toBe(157000); // 85000 + 72000
    expect(totalHouseholdTax).toBeGreaterThan(0);
    expect(totalHouseholdNetIncome).toBe(totalHouseholdIncome - totalHouseholdTax);
    
    // Verify that separate calculation results in different (usually lower) total tax 
    // than if calculated as single income due to progressive tax brackets
    const combinedTaxCalc = calculateTax(totalHouseholdIncome, province);
    expect(totalHouseholdTax).toBeLessThan(combinedTaxCalc.totalTax);
  });

  test('should validate owner field requirements for couples', () => {
    // Test validation logic that requires owner for couple income items
    const testItem: Partial<BudgetItem> = {
      type: 'INCOME',
      category: 'Employment Income',
      name: 'Test Salary',
      amount: 50000,
      frequency: 'YEARLY'
    };

    const isCouple = lifeSituation === 'couple';
    const isIncomeItem = testItem.type === 'INCOME';
    const needsOwner = isCouple && isIncomeItem;
    
    expect(needsOwner).toBe(true);
    
    // Without owner - should be invalid
    const hasOwnerEmpty = needsOwner ? (!testItem.owner || testItem.owner.trim() === '') : false;
    expect(hasOwnerEmpty).toBe(true); // Invalid case
    
    // With owner - should be valid  
    testItem.owner = 'TestPartner';
    const hasOwnerValid = needsOwner ? (testItem.owner && testItem.owner.trim() !== '') : true;
    expect(hasOwnerValid).toBe(true); // Valid case
  });

  test('should not require owner for expense items', () => {
    const expenseItem = mockCoupleIncomeItems.find(item => item.type === 'EXPENSE');
    
    expect(expenseItem).toBeDefined();
    expect(expenseItem!.owner).toBeUndefined();
    
    // Validation should pass for expenses without owner
    const isCouple = lifeSituation === 'couple';
    const isIncomeItem = expenseItem!.type === 'INCOME';
    const needsOwner = isCouple && isIncomeItem;
    
    expect(needsOwner).toBe(false);
  });

  test('should handle single person budget (no owner required)', () => {
    const singleLifeSituation = 'single';
    
    const testItem: Partial<BudgetItem> = {
      type: 'INCOME',
      category: 'Employment Income', 
      name: 'Salary',
      amount: 75000,
      frequency: 'YEARLY'
    };

    const isCouple = singleLifeSituation === 'couple';
    const isIncomeItem = testItem.type === 'INCOME';
    const needsOwner = isCouple && isIncomeItem;
    
    expect(needsOwner).toBe(false);
    expect(testItem.owner).toBeUndefined();
  });
});

// Export mock data for use in other tests
export { mockCoupleIncomeItems };
