export default async function globalSetup() {
  const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
  const API_URL = process.env.API_URL ?? 'http://localhost:8080';

  const appResponse = await fetch(APP_URL).catch(() => null);
  if (!appResponse || !appResponse.ok) {
    throw new Error(`APP_URL not reachable: ${appResponse?.status}`);
  }

  const healthResponse = await fetch(`${API_URL}/api/health`).catch(() => null);
  if (!healthResponse || !healthResponse.ok) {
    console.warn('WARNING: API health endpoint not reachable. API-level tests may fail.');
  }

  console.log('✅ Global setup complete');
}
