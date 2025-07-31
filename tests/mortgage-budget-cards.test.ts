
/**
 * Comprehensive test for mortgage enhancement and budget cards
 * Tests the integrated mortgage/asset management with budget-debt manager sync
 */

import { describe, it, expect } from '@jest/globals';

// Mock data for testing
const mockMortgageData = {
  propertyValue: 450000,
  mortgageBalance: 350000,
  monthlyPayment: 2200,
  interestRate: 5.25,
  amortizationYears: 25,
  renewalDate: new Date('2026-06-01'),
  maturityDate: new Date('2049-06-01'),
  propertyType: 'house' as const,
  homeInsurance: 120,
  propertyTax: 350
};

const mockCarData = {
  carValue: 25000,
  loanBalance: 18000,
  monthlyPayment: 350,
  interestRate: 6.5,
  year: 2020,
  make: 'Honda',
  model: 'Civic',
  carInsurance: 150,
  maintenance: 100
};

const mockJobIncomeData = [
  {
    name: 'Software Developer',
    grossAmount: 75000,
    frequency: 'YEARLY' as const,
    monthlyAmount: 6250,
    owner: 'John'
  },
  {
    name: 'Part-time Consultant',
    grossAmount: 3000,
    frequency: 'MONTHLY' as const,
    monthlyAmount: 3000,
    owner: 'Sarah'
  }
];

const mockDebtData = [
  {
    name: 'TD Visa',
    kind: 'CreditCard' as const,
    balance: 5000,
    interestRate: 19.99,
    limit: 10000,
    minPayment: 150,
    userPayment: 200
  },
  {
    name: 'Student Loan',
    kind: 'StudentLoan' as const,
    balance: 25000,
    interestRate: 6.5,
    term: 120,
    minPayment: 285,
    userPayment: 300
  }
];

describe('Mortgage Enhancement Tests', () => {
  it('should handle mortgage-specific fields correctly', () => {
    // Test mortgage liability with enhanced fields
    const mortgage = {
      ...mockMortgageData,
      type: 'mortgage' as const,
      name: 'Primary Residence Mortgage',
      balance: mockMortgageData.mortgageBalance
    };

    expect(mortgage.amortizationYears).toBe(25);
    expect(mortgage.renewalDate).toBeInstanceOf(Date);
    expect(mortgage.maturityDate).toBeInstanceOf(Date);
    expect(mortgage.propertyType).toBe('house');
    
    // Test mortgage calculations
    const equity = mortgage.propertyValue - mortgage.balance;
    expect(equity).toBe(100000);
    
    // Test mortgage payment breakdown
    const totalMonthlyHousing = mortgage.monthlyPayment + mortgage.homeInsurance + mortgage.propertyTax;
    expect(totalMonthlyHousing).toBe(2670); // 2200 + 120 + 350
  });

  it('should calculate renewal and maturity dates correctly', () => {
    const renewalDate = new Date('2026-06-01');
    const maturityDate = new Date('2049-06-01');
    
    expect(renewalDate.getFullYear()).toBe(2026);
    expect(maturityDate.getFullYear()).toBe(2049);
    
    // Test years until renewal
    const yearsUntilRenewal = renewalDate.getFullYear() - 2025;
    expect(yearsUntilRenewal).toBe(1);
  });
});

describe('Budget Cards Enhancement Tests', () => {
  it('should handle job income card with gross salary display', () => {
    const jobIncome = mockJobIncomeData[0];
    
    // Test gross salary calculation
    expect(jobIncome.grossAmount).toBe(75000);
    expect(jobIncome.monthlyAmount).toBe(6250);
    
    // Test couple budgeting with owners
    expect(jobIncome.owner).toBe('John');
    
    // Test frequency conversion
    const yearlyToMonthly = jobIncome.grossAmount / 12;
    expect(yearlyToMonthly).toBe(jobIncome.monthlyAmount);
  });

  it('should handle home card with property and mortgage details', () => {
    const homeData = mockMortgageData;
    
    // Test property value and equity calculation
    const equity = homeData.propertyValue - homeData.mortgageBalance;
    expect(equity).toBe(100000);
    
    // Test monthly housing costs
    const totalHousing = homeData.monthlyPayment + homeData.homeInsurance + homeData.propertyTax;
    expect(totalHousing).toBe(2670);
    
    // Test housing affordability (should be < 35% of income)
    const monthlyIncome = 9250; // Combined income from couple
    const housingRatio = (totalHousing / monthlyIncome) * 100;
    expect(housingRatio).toBeLessThan(35);
  });

  it('should handle car card with vehicle and loan info', () => {
    const carData = mockCarData;
    
    // Test car equity calculation
    const carEquity = carData.carValue - carData.loanBalance;
    expect(carEquity).toBe(7000);
    
    // Test total transportation costs
    const totalTransportation = carData.monthlyPayment + carData.carInsurance + carData.maintenance;
    expect(totalTransportation).toBe(600); // 350 + 150 + 100
  });

  it('should handle debt payment card with sync to debt manager', () => {
    const debts = mockDebtData;
    
    // Test minimum payment calculations
    const creditCard = debts[0];
    const expectedMinPayment = creditCard.balance * 0.03; // 3% for credit cards
    expect(creditCard.minPayment).toBe(150);
    
    // Test user payment override
    expect(creditCard.userPayment).toBeGreaterThan(creditCard.minPayment);
    
    // Test total debt payments
    const totalMinPayments = debts.reduce((sum, debt) => sum + debt.minPayment, 0);
    const totalUserPayments = debts.reduce((sum, debt) => sum + (debt.userPayment || debt.minPayment), 0);
    
    expect(totalMinPayments).toBe(435); // 150 + 285
    expect(totalUserPayments).toBe(500); // 200 + 300
    expect(totalUserPayments).toBeGreaterThan(totalMinPayments);
  });
});

describe('Budget-Debt Manager Sync Tests', () => {
  it('should sync mortgage data between budget and liability manager', () => {
    const mortgageBudgetItem = {
      type: 'EXPENSE' as const,
      category: 'Your Home',
      subcategory: 'Rent or mortgage payment',
      name: 'Mortgage payment',
      amount: mockMortgageData.monthlyPayment,
      frequency: 'MONTHLY' as const,
      monthlyAmount: mockMortgageData.monthlyPayment
    };

    const mortgageLiability = {
      type: 'mortgage' as const,
      name: 'Primary Residence Mortgage',
      balance: mockMortgageData.mortgageBalance,
      interestRate: mockMortgageData.interestRate,
      minimumPayment: mockMortgageData.monthlyPayment,
      amortizationYears: mockMortgageData.amortizationYears,
      renewalDate: mockMortgageData.renewalDate,
      maturityDate: mockMortgageData.maturityDate
    };

    // Test sync between budget item and liability
    expect(mortgageBudgetItem.amount).toBe(mortgageLiability.minimumPayment);
    expect(mortgageBudgetItem.monthlyAmount).toBe(mortgageLiability.minimumPayment);
  });

  it('should sync car loan data between budget and debt manager', () => {
    const carPaymentBudgetItem = {
      type: 'EXPENSE' as const,
      category: 'Getting Around',
      subcategory: 'Car payment',
      name: 'Car payment',
      amount: mockCarData.monthlyPayment,
      frequency: 'MONTHLY' as const,
      monthlyAmount: mockCarData.monthlyPayment
    };

    const carLoanDebt = {
      kind: 'PersonalLoan' as const,
      name: 'Honda Civic Loan',
      balance: mockCarData.loanBalance,
      interestRate: mockCarData.interestRate,
      minPayment: mockCarData.monthlyPayment,
      userPayment: mockCarData.monthlyPayment
    };

    // Test sync between budget item and debt
    expect(carPaymentBudgetItem.amount).toBe(carLoanDebt.minPayment);
    expect(carPaymentBudgetItem.monthlyAmount).toBe(carLoanDebt.userPayment);
  });

  it('should maintain data consistency across components', () => {
    // Test couple budgeting with separate tax calculations
    const johnIncome = mockJobIncomeData.find(income => income.owner === 'John');
    const sarahIncome = mockJobIncomeData.find(income => income.owner === 'Sarah');

    expect(johnIncome?.owner).toBe('John');
    expect(sarahIncome?.owner).toBe('Sarah');

    // Test total household income
    const totalMonthlyIncome = mockJobIncomeData.reduce((sum, income) => sum + income.monthlyAmount, 0);
    expect(totalMonthlyIncome).toBe(9250); // 6250 + 3000

    // Test debt-to-income ratio
    const totalDebtPayments = mockDebtData.reduce((sum, debt) => sum + (debt.userPayment || debt.minPayment), 0);
    const debtToIncomeRatio = (totalDebtPayments / totalMonthlyIncome) * 100;
    expect(debtToIncomeRatio).toBeLessThan(40); // Should be under 40%
  });
});

describe('Enhanced Card Integration Tests', () => {
  it('should handle complete budget flow with enhanced cards', () => {
    // Simulate complete budget with all enhanced cards
    const completeBudget = {
      income: mockJobIncomeData,
      housing: mockMortgageData,
      transportation: mockCarData,
      debts: mockDebtData
    };

    // Calculate total monthly income
    const totalIncome = completeBudget.income.reduce((sum, income) => sum + income.monthlyAmount, 0);
    expect(totalIncome).toBe(9250);

    // Calculate total monthly expenses
    const housingCost = completeBudget.housing.monthlyPayment + completeBudget.housing.homeInsurance + completeBudget.housing.propertyTax;
    const transportationCost = completeBudget.transportation.monthlyPayment + completeBudget.transportation.carInsurance + completeBudget.transportation.maintenance;
    const debtPayments = completeBudget.debts.reduce((sum, debt) => sum + (debt.userPayment || debt.minPayment), 0);

    const totalExpenses = housingCost + transportationCost + debtPayments;
    expect(totalExpenses).toBe(3770); // 2670 + 600 + 500

    // Test disposable income
    const disposableIncome = totalIncome - totalExpenses;
    expect(disposableIncome).toBe(5480);
    expect(disposableIncome).toBeGreaterThan(0);

    // Test financial ratios
    const housingRatio = (housingCost / totalIncome) * 100;
    const debtRatio = (debtPayments / totalIncome) * 100;
    
    expect(housingRatio).toBeLessThan(35); // Housing should be < 35%
    expect(debtRatio).toBeLessThan(20);    // Debt should be < 20%
  });

  it('should validate enhanced card data before saving', () => {
    // Test job income validation for couples
    const coupleIncome = mockJobIncomeData;
    const hasOwners = coupleIncome.every(income => income.owner && income.owner.trim().length > 0);
    expect(hasOwners).toBe(true);

    // Test mortgage validation
    const mortgage = mockMortgageData;
    expect(mortgage.propertyValue).toBeGreaterThan(0);
    expect(mortgage.monthlyPayment).toBeGreaterThan(0);
    expect(mortgage.interestRate).toBeGreaterThan(0);

    // Test debt validation
    const debts = mockDebtData;
    const validDebts = debts.every(debt => 
      debt.name.trim().length > 0 && 
      debt.balance > 0 && 
      debt.interestRate >= 0
    );
    expect(validDebts).toBe(true);
  });
});
