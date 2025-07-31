
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail, Lock, User, ArrowUp, CheckCircle } from 'lucide-react';

export function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGuestData, setHasGuestData] = useState(false);
  const [guestDataCount, setGuestDataCount] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const router = useRouter();

  // Check for guest data on component mount
  useEffect(() => {
    const checkGuestData = async () => {
      try {
        const response = await fetch('/api/auth/migrate');
        if (response.ok) {
          const data = await response.json();
          setHasGuestData(data.hasGuestData);
          setGuestDataCount(data.guestBudgets?.length || 0);
        }
      } catch (error) {
        console.error('Error checking guest data:', error);
      }
    };

    checkGuestData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create user account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        // Step 2: Sign in the user after successful signup
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Account created but sign in failed. Please try signing in manually.');
          setIsLoading(false);
          return;
        }

        // Step 3: Migrate guest data if it exists
        if (hasGuestData) {
          setIsMigrating(true);
          try {
            const migrationResponse = await fetch('/api/auth/migrate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (migrationResponse.ok) {
              const migrationData = await migrationResponse.json();
              console.log('Migration successful:', migrationData);
              // Optionally show success message
            } else {
              console.error('Migration failed, but account created successfully');
              // Don't fail the entire process if migration fails
            }
          } catch (migrationError) {
            console.error('Migration error:', migrationError);
            // Don't fail the entire process if migration fails
          } finally {
            setIsMigrating(false);
          }
        }

        // Step 4: Redirect to dashboard
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'An error occurred during signup');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Create your account to save and manage your budgets
        </CardDescription>
        {hasGuestData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-center gap-2 text-blue-800">
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm font-medium">Great news!</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              We found {guestDataCount} budget{guestDataCount !== 1 ? 's' : ''} you created. 
              They'll be automatically saved to your account when you sign up.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading || isMigrating}>
            {isMigrating ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving your budget data...
              </>
            ) : isLoading ? (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
                {hasGuestData && <span className="ml-2 text-xs opacity-75">& Save Budget</span>}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
