
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Download, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface BaseCalculatorProps {
  title: string;
  description: string;
  children: React.ReactNode;
  results?: React.ReactNode;
  calculatorType: string;
  inputs: Record<string, any>;
  calculatedResults: Record<string, any>;
  onSave?: () => void;
  onExport?: () => void;
  showSaveButton?: boolean;
  showExportButton?: boolean;
}

export function BaseCalculator({
  title,
  description,
  children,
  results,
  calculatorType,
  inputs,
  calculatedResults,
  onSave,
  onExport,
  showSaveButton = true,
  showExportButton = true
}: BaseCalculatorProps) {
  const { data: session } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(!!session?.user);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveNotes, setSaveNotes] = useState('');

  // Update authentication state when session changes
  React.useEffect(() => {
    setIsAuthenticated(!!session?.user);
  }, [session]);

  const handleSaveResult = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save calculator results');
      return;
    }

    if (!saveTitle.trim()) {
      toast.error('Please enter a title for your calculation');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/calculator-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          calculatorType,
          title: saveTitle.trim(),
          inputs,
          results: calculatedResults,
          notes: saveNotes.trim() || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Calculator result saved successfully!');
        setSaveDialogOpen(false);
        setSaveTitle('');
        setSaveNotes('');
        onSave?.();
      } else {
        toast.error(data.message || 'Failed to save calculator result');
      }
    } catch (error) {
      console.error('Error saving calculator result:', error);
      toast.error('Failed to save calculator result');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    try {
      // Create a temporary calculation result for export
      const exportData = {
        calculatorType,
        title: saveTitle || `${title} - ${new Date().toLocaleDateString()}`,
        inputs,
        results: calculatedResults,
        notes: saveNotes,
        createdAt: new Date()
      };

      // For now, create a simple CSV export client-side
      const lines = [];
      lines.push('SmartBudget Canada - Calculator Export');
      lines.push(`Calculator Type,${calculatorType}`);
      lines.push(`Title,${exportData.title}`);
      lines.push(`Date,${new Date().toLocaleDateString()}`);
      lines.push('');
      
      lines.push('INPUTS');
      Object.entries(inputs).forEach(([key, value]) => {
        lines.push(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())},${value}`);
      });
      lines.push('');
      
      lines.push('RESULTS');
      Object.entries(calculatedResults).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          lines.push(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())},${JSON.stringify(value)}`);
        } else {
          lines.push(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())},${value}`);
        }
      });
      
      if (saveNotes) {
        lines.push('');
        lines.push('NOTES');
        lines.push(saveNotes);
      }
      
      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${calculatorType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Calculation exported successfully!');
      onExport?.();
    } catch (error) {
      console.error('Error exporting calculator result:', error);
      toast.error('Failed to export calculator result');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          
          {results && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Results</h3>
              {results}
            </div>
          )}

          {(showSaveButton || showExportButton) && Object.keys(calculatedResults).length > 0 && (
            <div className="border-t pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {showSaveButton && (
                  <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" className="flex items-center gap-2 w-full sm:w-auto">
                        <Save className="h-4 w-4" />
                        {isAuthenticated ? 'Save Results' : 'Sign In to Save'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md mx-4 sm:mx-auto">
                      <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">Save Calculator Results</DialogTitle>
                        <DialogDescription className="text-sm">
                          Save this calculation to view and compare later.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="save-title" className="text-sm font-medium">Calculation Title *</Label>
                          <Input
                            id="save-title"
                            value={saveTitle}
                            onChange={(e) => setSaveTitle(e.target.value)}
                            placeholder={`${title} - ${new Date().toLocaleDateString()}`}
                            className="text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="save-notes" className="text-sm font-medium">Notes (optional)</Label>
                          <Textarea
                            id="save-notes"
                            value={saveNotes}
                            onChange={(e) => setSaveNotes(e.target.value)}
                            placeholder="Add any notes about this calculation..."
                            rows={3}
                            className="text-base resize-none"
                          />
                        </div>
                        {!isAuthenticated && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              You need to sign in to save calculator results. Your calculations will be available in your dashboard.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button
                          variant="outline"
                          onClick={() => setSaveDialogOpen(false)}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveResult}
                          disabled={isSaving || !isAuthenticated}
                          className="w-full sm:w-auto"
                        >
                          {isSaving ? 'Saving...' : 'Save Results'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {showExportButton && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </div>

              {!isAuthenticated && showSaveButton && (
                <Alert className="mt-3 sm:mt-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Want to save your calculations?</strong> Sign up for a free account to save results, track your progress, and access premium features.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
