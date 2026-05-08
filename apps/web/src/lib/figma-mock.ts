/** Dashboard / admin mock data from Figma export — not wired to backend. */

export interface Provider {
  id: string;
  name: string;
  normalizedName: string;
  countryCodes: string[];
  officialDomains: string[];
  isLegalProvider: boolean;
  providerType: 'subscription' | 'rental' | 'purchase' | 'free' | 'library';
  logoUrl: string;
}

export interface Alert {
  id: string;
  userId: string;
  titleId: string;
  country: string;
  alertType:
    | 'available_under_price'
    | 'free_available'
    | 'available_on_provider'
    | 'price_drop';
  targetProvider: string | null;
  maxPrice: number | null;
  currency: string;
  freeOnly: boolean;
  active: boolean;
  createdAt: string;
}

export interface VerificationResult {
  id: string;
  titleId: string;
  candidateUrl: string;
  sourceDomain: string;
  isLikelyRealMovie: boolean;
  isLikelyLegal: boolean;
  classification:
    | 'official'
    | 'free_with_ads'
    | 'trailer'
    | 'clip'
    | 'recap'
    | 'review'
    | 'fake_or_misleading'
    | 'piracy_risk'
    | 'unknown';
  confidence: number;
  safeToShowUser: boolean;
  reasons: string[];
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const mockProviders: Provider[] = [
  {
    id: 'provider_netflix',
    name: 'Netflix',
    normalizedName: 'netflix',
    countryCodes: ['US', 'GB', 'CA', 'AU', 'IN'],
    officialDomains: ['netflix.com'],
    isLegalProvider: true,
    providerType: 'subscription',
    logoUrl: 'https://images.justwatch.com/icon/190848813/s100/netflix.webp',
  },
  {
    id: 'provider_prime',
    name: 'Amazon Prime Video',
    normalizedName: 'prime_video',
    countryCodes: ['US', 'GB', 'CA', 'AU', 'IN'],
    officialDomains: ['primevideo.com', 'amazon.com'],
    isLegalProvider: true,
    providerType: 'subscription',
    logoUrl: 'https://images.justwatch.com/icon/52449539/s100/amazon-prime-video.webp',
  },
  {
    id: 'provider_max',
    name: 'Max',
    normalizedName: 'max',
    countryCodes: ['US'],
    officialDomains: ['max.com'],
    isLegalProvider: true,
    providerType: 'subscription',
    logoUrl: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
  },
  {
    id: 'provider_disney',
    name: 'Disney+',
    normalizedName: 'disney_plus',
    countryCodes: ['US', 'GB', 'CA', 'AU'],
    officialDomains: ['disneyplus.com'],
    isLegalProvider: true,
    providerType: 'subscription',
    logoUrl: 'https://images.justwatch.com/icon/147638351/s100/disney-plus.webp',
  },
  {
    id: 'provider_tubi',
    name: 'Tubi',
    normalizedName: 'tubi',
    countryCodes: ['US', 'CA', 'AU'],
    officialDomains: ['tubitv.com'],
    isLegalProvider: true,
    providerType: 'free',
    logoUrl: 'https://images.justwatch.com/icon/257629490/s100/tubi-tv.webp',
  },
  {
    id: 'provider_pluto',
    name: 'Pluto TV',
    normalizedName: 'pluto_tv',
    countryCodes: ['US', 'GB', 'CA'],
    officialDomains: ['pluto.tv'],
    isLegalProvider: true,
    providerType: 'free',
    logoUrl: 'https://images.justwatch.com/icon/169478387/s100/pluto-tv.webp',
  },
  {
    id: 'provider_apple',
    name: 'Apple TV',
    normalizedName: 'apple_tv',
    countryCodes: ['US', 'GB', 'CA', 'AU'],
    officialDomains: ['tv.apple.com'],
    isLegalProvider: true,
    providerType: 'subscription',
    logoUrl: 'https://images.justwatch.com/icon/190848813/s100/apple-tv-plus.webp',
  },
];

export const mockVerificationQueue: VerificationResult[] = [
  {
    id: 'verify_1',
    titleId: 'tmdb_movie_693134',
    candidateUrl: 'https://youtube.com/watch?v=fake123',
    sourceDomain: 'youtube.com',
    isLikelyRealMovie: false,
    isLikelyLegal: false,
    classification: 'trailer',
    confidence: 0.92,
    safeToShowUser: false,
    reasons: [
      'Video runtime (3 min) is much shorter than expected movie runtime (166 min)',
      'Video title contains "official trailer" keyword',
      'Uploader is official studio channel (verified)',
    ],
    createdAt: '2026-05-03T10:30:00.000Z',
    status: 'pending',
  },
  {
    id: 'verify_2',
    titleId: 'tmdb_movie_519182',
    candidateUrl: 'https://youtube.com/watch?v=fake456',
    sourceDomain: 'youtube.com',
    isLikelyRealMovie: false,
    isLikelyLegal: false,
    classification: 'fake_or_misleading',
    confidence: 0.88,
    safeToShowUser: false,
    reasons: [
      'Uploader channel is not official or verified',
      'Video title contains "full movie HD" but runtime is only 8 minutes',
      'Thumbnail quality suggests screen recording or cam quality',
      'High likelihood of being a compilation or recap video',
    ],
    createdAt: '2026-05-03T09:15:00.000Z',
    status: 'pending',
  },
  {
    id: 'verify_3',
    titleId: 'tmdb_movie_573435',
    candidateUrl: 'https://suspicious-site.com/bad-boys-free',
    sourceDomain: 'suspicious-site.com',
    isLikelyRealMovie: false,
    isLikelyLegal: false,
    classification: 'piracy_risk',
    confidence: 0.95,
    safeToShowUser: false,
    reasons: [
      'Domain is not in legal provider allowlist',
      'Domain has no known licensing agreements',
      'Site structure matches common piracy site patterns',
      'Multiple ad redirects detected',
    ],
    createdAt: '2026-05-02T16:45:00.000Z',
    status: 'pending',
  },
];

export function logoForProviderName(providerName: string): string | undefined {
  const lower = providerName.toLowerCase();
  for (const p of mockProviders) {
    const n = p.name.toLowerCase();
    if (lower.includes(n)) return p.logoUrl;
    const words = n.split(/\s+/).filter((w) => w.length > 3);
    if (words.some((w) => lower.includes(w))) return p.logoUrl;
  }
  if (lower.includes('hotstar')) {
    return mockProviders.find((x) => x.id === 'provider_disney')?.logoUrl;
  }
  return undefined;
}
