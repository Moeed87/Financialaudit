
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  BarChart3, 
  Calculator, 
  ChevronDown, 
  CreditCard, 
  Home, 
  LogOut, 
  Menu, 
  PlusCircle, 
  User, 
  X 
} from 'lucide-react';

export function Navigation() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const isActivePath = (path: string) => {
    return pathname === path;
  };

  const NavLink = ({ href, children, className = "", onClick }: { 
    href: string; 
    children: React.ReactNode; 
    className?: string;
    onClick?: () => void;
  }) => (
    <Link 
      href={href} 
      className={`${className} ${isActivePath(href) ? 'text-blue-600 font-medium' : ''}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & App Name */}
          <NavLink href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">SmartBudget Canada</span>
            <span className="text-lg font-bold text-gray-900 sm:hidden">SmartBudget</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Home */}
            <NavLink 
              href="/" 
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              <Home className="h-4 w-4" />
              <span className="font-medium">Home</span>
            </NavLink>

            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                >
                  <Calculator className="h-4 w-4" />
                  <span>Tools</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <NavLink href="/calculators" className="flex items-center space-x-2 w-full px-2 py-1.5 hover:bg-blue-50">
                    <Calculator className="h-4 w-4" />
                    <span>Calculators</span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink href="/planner" className="flex items-center space-x-2 w-full px-2 py-1.5 hover:bg-blue-50" data-testid="create-budget-link">
                    <PlusCircle className="h-4 w-4" />
                    <span>{session ? 'Create Budget' : 'Try Budget Tool'}</span>
                  </NavLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Insights Dropdown (Signed-in only) */}
            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Insights</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem asChild>
                    <NavLink href="/dashboard" className="flex items-center space-x-2 w-full px-2 py-1.5 hover:bg-blue-50">
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink href="/debts" className="flex items-center space-x-2 w-full px-2 py-1.5 hover:bg-blue-50">
                      <CreditCard className="h-4 w-4" />
                      <span>Debt Manager</span>
                    </NavLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right Side - Auth/Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {session ? (
              /* Profile Dropdown (Signed-in) */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                    data-testid="user-menu-button"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-32 truncate">{session.user?.name || session.user?.email}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled className="px-2 py-1.5">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="truncate">{session.user?.name || session.user?.email}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 w-full px-2 py-1.5 hover:bg-red-50 text-red-600"
                      data-testid="logout-button"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Sign In / Sign Up (Signed-out) */
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin" data-testid="signin-link">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button 
                    size="sm" 
                    className="font-medium bg-blue-600 hover:bg-blue-700 shadow-sm"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-blue-50"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              {/* Home */}
              <NavLink
                href="/"
                className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </NavLink>

              {/* Tools Section */}
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tools
                </div>
                <NavLink
                  href="/calculators"
                  className="flex items-center space-x-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calculator className="h-5 w-5" />
                  <span>Calculators</span>
                </NavLink>
                <NavLink
                  href="/planner"
                  className="flex items-center space-x-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>{session ? 'Create Budget' : 'Try Budget Tool'}</span>
                </NavLink>
              </div>

              {/* Insights Section (Signed-in only) */}
              {session && (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Insights
                  </div>
                  <NavLink
                    href="/dashboard"
                    className="flex items-center space-x-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink
                    href="/debts"
                    className="flex items-center space-x-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Debt Manager</span>
                  </NavLink>
                </div>
              )}
              
              {/* Auth Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {session ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
                      <User className="h-4 w-4" />
                      <span className="truncate">{session.user?.name || session.user?.email}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start font-medium text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button 
                        size="sm" 
                        className="w-full font-medium bg-blue-600 hover:bg-blue-700 shadow-sm"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
