import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

/**
 * Load `.env` from the monorepo root (or cwd) so `npm run db:migrate -w apps/api` works
 * when the shell cwd is the repo root.
 */
export function loadEnvFromRoot(): void {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', '.env'),
    path.join(process.cwd(), '..', '..', '.env'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return;
    }
  }
  dotenv.config();
}

loadEnvFromRoot();
