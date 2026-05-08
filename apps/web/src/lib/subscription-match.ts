import { mockProviders } from '@/lib/figma-mock';

/** Match API provider names (e.g. "Disney+ Hotstar") to dashboard subscription IDs. */
export function userHasSubscription(
  providerName: string,
  userSubscriptionIds: string[],
): boolean {
  const lower = providerName.toLowerCase();
  return mockProviders.some((p) => {
    if (!userSubscriptionIds.includes(p.id)) return false;
    const n = p.name.toLowerCase();
    if (lower.includes(n) || n.includes(lower)) return true;
    const first = n.split(/\s+/)[0];
    if (first.length >= 3 && lower.includes(first)) return true;
    const slug = p.normalizedName.replace(/_/g, '');
    if (slug.length >= 3 && lower.replace(/\s+/g, '').includes(slug)) return true;
    return false;
  });
}
