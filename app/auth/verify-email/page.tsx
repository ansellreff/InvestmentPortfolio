'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token found. Please request a new verification email.');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);

        if (response.ok) {
          const result = await response.json();
          setStatus('success');
          setMessage(result.message || 'Email verified successfully!');

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          const error = await response.json();
          setStatus('error');
          setMessage(error.error || 'Failed to verify email. The link may be expired.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred. Please try again later.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === 'loading' && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Verifying your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-green-600">
                  Email Verified!
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {message}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Redirecting you to the dashboard...
                </p>
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-red-600">
                  Verification Failed
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {message}
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => router.push('/auth/signin')}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                  <Link href="/auth/resend-verification">
                    <Button variant="link" className="text-sm">
                      Request a new verification email
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
