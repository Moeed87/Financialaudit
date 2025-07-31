
import Link from 'next/link';
import { SignInForm } from '@/components/auth/signin-form';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
          Welcome back to SmartBudget Canada
        </h1>
        <SignInForm />
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up here
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Or{' '}
            <Link href="/planner" className="font-medium text-blue-600 hover:text-blue-500">
              continue as guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
