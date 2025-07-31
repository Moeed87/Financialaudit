
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navigation } from '@/components/layout/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartBudget Canada - Personal Budget Planner',
  description: 'Comprehensive budgeting tool for Canadians with provincial tax integration and real-time calculations.',
  keywords: 'budget, canada, tax calculator, personal finance, money management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main>{children}</main>
            <footer className="bg-white border-t border-gray-200 py-8 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center text-gray-600">
                  <p>&copy; 2025 SmartBudget Canada. Built for Canadians, by Canadians.</p>
                  <p className="text-sm mt-2">
                    Tax calculations based on 2025 Canadian federal and provincial tax rates.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
