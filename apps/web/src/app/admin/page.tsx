'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getApiBaseUrl } from '@/lib/api-base';
import { getStoredAccessToken, setStoredAccessToken } from '@/lib/session-token';

export type VerificationApiItem = {
  id: string;
  titleId: string;
  candidateUrl: string;
  sourceDomain: string;
  isLikelyRealMovie: boolean;
  isLikelyLegal: boolean;
  classification: string;
  confidence: number;
  safeToShowUser: boolean;
  reasons: string[];
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string | null;
  reviewerEmail?: string | null;
};

async function fetchList(
  status: 'pending' | 'approved' | 'rejected',
  bearer: string,
): Promise<VerificationApiItem[]> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/admin/verifications?status=${status}&limit=100`,
    { headers: { Authorization: `Bearer ${bearer}` } },
  );
  if (res.status === 401) {
    setStoredAccessToken(null);
    throw new Error('SESSION_EXPIRED');
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { items: VerificationApiItem[] };
  return data.items || [];
}

export default function AdminPage() {
  const { user, loading: authLoading, accessToken, refreshAdminSession, signOutUser } = useAuth();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [queues, setQueues] = useState<{
    pending: VerificationApiItem[];
    approved: VerificationApiItem[];
    rejected: VerificationApiItem[];
  }>({ pending: [], approved: [], rejected: [] });
  const [loadingLists, setLoadingLists] = useState(false);

  const loadQueues = useCallback(async (bearer: string) => {
    setLoadError(null);
    setLoadingLists(true);
    try {
      const [pending, approved, rejected] = await Promise.all([
        fetchList('pending', bearer),
        fetchList('approved', bearer),
        fetchList('rejected', bearer),
      ]);
      setQueues({ pending, approved, rejected });
    } catch (e) {
      if (e instanceof Error && e.message === 'SESSION_EXPIRED') {
        setLoadError('Session expired — sign in again and refresh admin access.');
      } else {
        setLoadError(e instanceof Error ? e.message : 'Failed to load');
      }
    } finally {
      setLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSessionError(null);
      setSessionReady(false);
      return;
    }
    let cancelled = false;
    setSessionReady(false);
    setSessionError(null);

    (async () => {
      const token = accessToken || getStoredAccessToken();
      if (token) {
        try {
          await loadQueues(token);
        } catch {
          /* loadQueues sets loadError */
        }
        if (!cancelled) setSessionReady(true);
        return;
      }
      try {
        await refreshAdminSession();
        if (cancelled) return;
        const t = getStoredAccessToken();
        if (t) await loadQueues(t);
      } catch (e) {
        if (!cancelled) {
          setSessionError(e instanceof Error ? e.message : 'Could not obtain admin session');
        }
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, accessToken, refreshAdminSession, loadQueues]);

  const handleApprove = async (id: string) => {
    const token = getStoredAccessToken();
    if (!token) return;
    const res = await fetch(`${getApiBaseUrl()}/api/admin/verifications/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || 'Approve failed');
      return;
    }
    toast.success('Approved');
    await loadQueues(token);
  };

  const handleReject = async (id: string) => {
    const token = getStoredAccessToken();
    if (!token) return;
    const res = await fetch(`${getApiBaseUrl()}/api/admin/verifications/${id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || 'Reject failed');
      return;
    }
    toast.success('Rejected');
    await loadQueues(token);
  };

  const getClassificationBadge = (classification: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      official: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Official' },
      free_with_ads: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Free w/ Ads' },
      trailer: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Trailer' },
      clip: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Clip' },
      recap: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Recap' },
      review: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Review' },
      fake_or_misleading: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Fake/Misleading' },
      piracy_risk: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Piracy Risk' },
      unknown: { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Unknown' },
    };
    const config = configs[classification] || configs.unknown;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getSafetyBadge = (safeToShow: boolean) => {
    return safeToShow ? (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Safe to Show
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Not Safe
      </Badge>
    );
  };

  const renderVerificationCard = (item: VerificationApiItem) => (
    <Card key={item.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {getClassificationBadge(item.classification)}
                {getSafetyBadge(item.safeToShowUser)}
                <Badge variant="outline" className="text-xs">
                  {(item.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">Title: {item.titleId}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs break-all">
                  {item.candidateUrl}
                </span>
                <a
                  href={item.candidateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Real Movie:</span>
              <span
                className={`ml-2 font-semibold ${item.isLikelyRealMovie ? 'text-green-600' : 'text-red-600'}`}
              >
                {item.isLikelyRealMovie ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Legal:</span>
              <span
                className={`ml-2 font-semibold ${item.isLikelyLegal ? 'text-green-600' : 'text-red-600'}`}
              >
                {item.isLikelyLegal ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Source:</span>
              <span className="ml-2 font-semibold">{item.sourceDomain}</span>
            </div>
            <div>
              <span className="text-gray-600">Checked:</span>
              <span className="ml-2 font-semibold">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              Verification Reasons
            </h4>
            <ul className="space-y-1">
              {item.reasons.map((reason, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {item.status === 'pending' && (
            <div className="flex gap-3 pt-2 flex-wrap">
              <Button
                variant="default"
                className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(item.id)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button variant="destructive" className="flex-1 min-w-[120px]" onClick={() => handleReject(item.id)}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          {item.status !== 'pending' && (
            <div className="pt-2 text-sm text-gray-600">
              <Badge
                variant="outline"
                className={
                  item.status === 'approved'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }
              >
                {item.status === 'approved' ? 'Approved' : 'Rejected'}
              </Badge>
              {item.reviewerEmail && (
                <span className="ml-2">by {item.reviewerEmail}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading) {
    return (
      <main className="flex-1 py-8 px-4">
        <p className="text-center text-gray-500">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 py-16 px-4 text-center max-w-lg mx-auto">
        <Shield className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Admin</h1>
        <p className="text-gray-600 mb-6">Sign in with Google to review the verification queue.</p>
        <Link href="/login">
          <Button>Go to sign in</Button>
        </Link>
      </main>
    );
  }

  if (user && !sessionError && !sessionReady) {
    return (
      <main className="flex-1 py-16 px-4 text-center">
        <p className="text-gray-600">Preparing admin session…</p>
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="flex-1 py-16 px-4 text-center max-w-xl mx-auto space-y-4">
        <h1 className="text-xl font-bold">Cannot open admin session</h1>
        <p className="text-gray-600 text-sm">{sessionError}</p>
        <p className="text-xs text-gray-500">
          Add your Google account email to <code>ADMIN_EMAILS</code> on the API, set{' '}
          <code>JWT_SECRET</code>, and ensure Firebase Admin can verify ID tokens.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button variant="outline" onClick={() => signOutUser()}>
            Sign out
          </Button>
          <Button
            onClick={async () => {
              setSessionError(null);
              setSessionReady(false);
              try {
                await refreshAdminSession();
                const t = getStoredAccessToken();
                if (t) await loadQueues(t);
              } catch (e) {
                setSessionError(e instanceof Error ? e.message : 'Retry failed');
              } finally {
                setSessionReady(true);
              }
            }}
          >
            Retry exchange
          </Button>
        </div>
      </main>
    );
  }

  const { pending: pendingItems, approved: approvedItems, rejected: rejectedItems } = queues;

  return (
    <main className="flex-1 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-indigo-600" />
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">
              Signed in as {user.email}. Queue is stored in Postgres.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const t = getStoredAccessToken();
                if (t) loadQueues(t);
              }}
            >
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOutUser()}>
              Sign out
            </Button>
          </div>
        </div>

        {loadError && (
          <p className="text-sm text-red-600 mb-4">{loadError}</p>
        )}
        {loadingLists && <p className="text-sm text-gray-500 mb-4">Loading queue…</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{pendingItems.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Approved</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{approvedItems.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Rejected</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{rejectedItems.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verification Queue</CardTitle>
            <CardDescription>Approve or reject pending candidate links</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="pending" className="gap-2">
                  Pending ({pendingItems.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  Approved ({approvedItems.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  Rejected ({rejectedItems.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingItems.length > 0 ? (
                  pendingItems.map(renderVerificationCard)
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">All clear</h3>
                    <p className="text-gray-500">No pending items — run db seed or POST to internal ingest.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4">
                {approvedItems.length > 0 ? (
                  approvedItems.map(renderVerificationCard)
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No approved items yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4">
                {rejectedItems.length > 0 ? (
                  rejectedItems.map(renderVerificationCard)
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No rejected items yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="mt-8 bg-indigo-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">How this is wired</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Firebase Auth proves who you are; the API checks your email against ADMIN_EMAILS.</li>
                  <li>• A successful exchange returns a short-lived HS256 API JWT (signed with JWT_SECRET).</li>
                  <li>• Admin routes accept that JWT or a fresh Firebase ID token.</li>
                  <li>• New pending rows: POST /api/internal/verifications with X-Ingest-Key.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
