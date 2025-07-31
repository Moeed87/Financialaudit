
'use client';

import { DebtManagement } from '@/components/debt/debt-management';
import { useDebts } from '@/hooks/use-debts';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export function DebtManagementPage() {
  const { liabilities, saveDebt, deleteDebt, isLoading, error } = useDebts();

  if (isLoading && liabilities.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Loading debt information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <DebtManagement
        liabilities={liabilities}
        onSave={saveDebt}
        onDelete={deleteDebt}
        isLoading={isLoading}
      />
    </div>
  );
}
