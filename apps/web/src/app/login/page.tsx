'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const onGoogle = async () => {
    setErr(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.push('/');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md border-2 border-indigo-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Use the same Google account you added to <code className="text-xs">ADMIN_EMAILS</code> to
            access the admin queue and mint an API session token.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : user ? (
            <p className="text-sm text-gray-600">
              Signed in as <strong>{user.email}</strong>.{' '}
              <Link href="/" className="text-indigo-600 underline">
                Continue to home
              </Link>
            </p>
          ) : (
            <>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <Button
                type="button"
                className="w-full bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
                disabled={busy}
                onClick={onGoogle}
              >
                {busy ? 'Signing in…' : 'Continue with Google'}
              </Button>
            </>
          )}
          <p className="text-xs text-gray-500">
            Firebase Auth uses your Firebase web API key (<code>NEXT_PUBLIC_FIREBASE_API_KEY</code>), not
            shell <code>GOOGLE_API_KEY</code> (that key is for other Google Cloud APIs).
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
