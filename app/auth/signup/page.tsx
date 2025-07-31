
import Link from 'next/link';
import { SignUpForm } from '@/components/auth/signup-form';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
          Join SmartBudget Canada
        </h1>
        <SignUpForm />
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
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
