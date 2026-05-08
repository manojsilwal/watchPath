'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Clock,
  TrendingDown,
  ExternalLink,
  Shield,
  Bell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getApiBaseUrl } from '@/lib/api-base';
import { logoForProviderName } from '@/lib/figma-mock';
import { userHasSubscription } from '@/lib/subscription-match';

type ApiAvailability = {
  providerName: string;
  accessType: string;
  incrementalCost: number;
  currency: string;
  url: string;
  confidence: number;
  hasFreeTrial: boolean;
  freeTrialDays: number;
};

type TitleData = {
  title: string;
  year: number | null;
  runtimeMinutes?: number;
  posterUrl?: string | null;
  overview?: string;
  genres?: string[];
  cast?: string[];
  directors?: string[];
  type?: string;
};

type ApiResponse = {
  title: TitleData;
  bestOption?: ApiAvailability | null;
  availability: ApiAvailability[];
  verificationSummary?: { suspiciousLinksFiltered?: number };
};

function formatMoney(amount: number, currency: string) {
  if (amount === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function getAccessTypeDisplay(accessType: string) {
  switch (accessType) {
    case 'subscription':
      return 'Subscription';
    case 'rent':
      return 'Rent';
    case 'buy':
      return 'Buy';
    case 'free_with_ads':
      return 'Free with Ads';
    case 'free_official':
      return 'Free';
    case 'free_library':
      return 'Library';
    default:
      return accessType.replace(/_/g, ' ');
  }
}

function getAccessTypeBadgeColor(accessType: string) {
  if (accessType.startsWith('free')) return 'bg-green-100 text-green-700 border-green-200';
  if (accessType === 'subscription') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (accessType === 'rent') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (accessType === 'buy') return 'bg-purple-100 text-purple-700 border-purple-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function VerificationBadge({ accessType, confidence }: { accessType: string; confidence: number }) {
  if (accessType.startsWith('free')) {
    return (
      <Badge className="gap-1 bg-blue-100 text-blue-700 border-blue-200">
        <Shield className="w-3 h-3" />
        Legal option
      </Badge>
    );
  }
  if (confidence >= 0.8) {
    return (
      <Badge className="gap-1 bg-green-100 text-green-700 border-green-200">
        <CheckCircle2 className="w-3 h-3" />
        Verified source
      </Badge>
    );
  }
  return null;
}

export default function TitleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const country = searchParams.get('country') || 'US';

  const [userSubscriptions, setUserSubscriptions] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('userSubscriptions');
    return saved ? (JSON.parse(saved) as string[]) : [];
  });

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('userSubscriptions');
    setUserSubscriptions(saved ? (JSON.parse(saved) as string[]) : []);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${getApiBaseUrl()}/api/titles/${encodeURIComponent(id)}?country=${encodeURIComponent(country)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Title not found');
        return res.json();
      })
      .then((d: ApiResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, country]);

  const handleCreateAlert = () => {
    toast.success(
      "Alert saved locally — we'll expand this when accounts and notifications are connected.",
    );
  };

  const handleWatchNow = (option: ApiAvailability) => {
    window.open(option.url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <main className="flex-1 py-8 px-4 flex justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">{error || 'Title not found'}</h2>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </main>
    );
  }

  const { title, bestOption, availability, verificationSummary } = data;
  const genres = title.genres ?? [];
  const cast = title.cast ?? [];
  const directors = title.directors ?? [];
  const typeLabel =
    title.type === 'movie' ? 'MOVIE' : title.type === 'tv' ? 'TV' : (title.type || 'TITLE').toUpperCase();

  return (
    <main className="flex-1 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-xl bg-gray-100">
              {title.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No poster</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{title.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-gray-600 mb-4">
                {title.year != null && <span className="font-semibold">{title.year}</span>}
                {title.year != null && <span>•</span>}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {title.runtimeMinutes ?? '—'} min
                </span>
                <span>•</span>
                <Badge variant="outline">{typeLabel}</Badge>
              </div>
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {genres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {title.overview ? (
              <p className="text-gray-700 leading-relaxed">{title.overview}</p>
            ) : (
              <p className="text-gray-500 text-sm">No synopsis available for this title yet.</p>
            )}

            {cast.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Cast</h3>
                <p className="text-gray-600">{cast.join(', ')}</p>
              </div>
            )}

            {directors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Director</h3>
                <p className="text-gray-600">{directors.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        {bestOption && (
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg mb-8">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-2xl">Best Option for You</CardTitle>
              </div>
              <CardDescription className="text-base">
                Based on your subscriptions and available options in {country}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-white shadow-md flex items-center justify-center overflow-hidden">
                    {logoForProviderName(bestOption.providerName) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoForProviderName(bestOption.providerName)}
                        alt=""
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-xs font-bold text-indigo-600 text-center px-1">
                        {bestOption.providerName.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{bestOption.providerName}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={getAccessTypeBadgeColor(bestOption.accessType)}>
                        {getAccessTypeDisplay(bestOption.accessType)}
                      </Badge>
                      <VerificationBadge
                        accessType={bestOption.accessType}
                        confidence={bestOption.confidence}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {bestOption.incrementalCost === 0 || userHasSubscription(bestOption.providerName, userSubscriptions) ? (
                    <div>
                      <div className="text-3xl font-bold text-green-600">$0</div>
                      <div className="text-sm text-gray-600">Incremental cost</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold text-gray-800">
                        {formatMoney(bestOption.incrementalCost, bestOption.currency)}
                      </div>
                      <div className="text-sm text-gray-600">{bestOption.currency}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Why this is the best option:</p>
                    <p className="text-gray-600 text-sm mt-1">
                      {bestOption.incrementalCost === 0
                        ? 'Lowest incremental cost in this region based on our current data.'
                        : userHasSubscription(bestOption.providerName, userSubscriptions)
                          ? 'Included with a subscription you marked on your Dashboard.'
                          : 'Cheapest verified option we have for this title in your region.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-green-600 shrink-0" />
                  <span>
                    Verified legal source • {(bestOption.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                {bestOption.hasFreeTrial && bestOption.freeTrialDays > 0 && (
                  <p className="text-sm text-green-700 font-medium mt-2">
                    {bestOption.freeTrialDays}-day free trial available
                  </p>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button
                  className="flex-1 min-w-[200px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  onClick={() => handleWatchNow(bestOption)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch Now on {bestOption.providerName}
                </Button>
                <Button variant="outline" onClick={handleCreateAlert}>
                  <Bell className="w-4 h-4 mr-2" />
                  Set Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {availability.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-indigo-600" />
              All Streaming Options in {country}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availability.map((option, idx) => (
                <Card key={`${option.providerName}-${idx}`} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {logoForProviderName(option.providerName) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logoForProviderName(option.providerName)}
                              alt=""
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-gray-500">
                              {option.providerName.slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1">{option.providerName}</h3>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={getAccessTypeBadgeColor(option.accessType)}>
                              {getAccessTypeDisplay(option.accessType)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              HD
                            </Badge>
                            <VerificationBadge
                              accessType={option.accessType}
                              confidence={option.confidence}
                            />
                          </div>
                          {userHasSubscription(option.providerName, userSubscriptions) && (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-2">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              You have this subscription
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {option.incrementalCost === 0 ||
                        userHasSubscription(option.providerName, userSubscriptions) ? (
                          <div className="text-2xl font-bold text-green-600">$0</div>
                        ) : (
                          <div>
                            <div className="text-2xl font-bold text-gray-800">
                              {formatMoney(option.incrementalCost, option.currency)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => handleWatchNow(option)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on {option.providerName}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-2 border-yellow-200 bg-yellow-50 mb-8">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Not Available Yet</h3>
              <p className="text-gray-700 mb-4">
                No verified legal streaming option found in {country} right now.
              </p>
              <Button onClick={handleCreateAlert}>
                <Bell className="w-4 h-4 mr-2" />
                Get Notified When Available
              </Button>
            </CardContent>
          </Card>
        )}

        {verificationSummary &&
          (verificationSummary.suspiciousLinksFiltered ?? 0) > 0 && (
          <p className="text-sm text-gray-500 mt-4 italic mb-8">
            We found {verificationSummary.suspiciousLinksFiltered} free-looking link(s) online, but they
            appear to be trailers, recaps, or unofficial, so we did not show them.
          </p>
        )}

        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Safe Streaming Guarantee</h3>
                <p className="text-sm text-gray-700">
                  We filter out fake &quot;free movie&quot; links, piracy sites, trailers disguised as full
                  movies, and other misleading content. Options shown here come from known networks and
                  storefronts for this title.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
