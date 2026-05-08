import { getApiBaseUrl } from '@/lib/api-base';

export async function exchangeFirebaseForAccessToken(firebaseIdToken: string): Promise<string> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/exchange`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${firebaseIdToken}` },
  });
  const body = (await res.json().catch(() => ({}))) as { accessToken?: string; error?: string };
  if (!res.ok) {
    throw new Error(body.error || `Token exchange failed (${res.status})`);
  }
  if (!body.accessToken) {
    throw new Error('No accessToken in exchange response');
  }
  return body.accessToken;
}
