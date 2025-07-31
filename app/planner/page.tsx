
import { BudgetWizard } from '@/components/budget/budget-wizard';

export default function PlannerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Create Your Budget
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Follow our step-by-step guide to create a personalized budget with accurate Canadian tax calculations.
          </p>
        </div>
        <BudgetWizard />
      </div>
    </div>
  );
}
