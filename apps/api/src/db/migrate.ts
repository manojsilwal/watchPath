import '../load-env';
import fs from 'node:fs';
import path from 'node:path';

import { closePool, getPool } from './pool';

export async function runMigrations(): Promise<void> {
  const pool = getPool();
  const dir = path.join(__dirname, '../../migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
    // eslint-disable-next-line no-console
    console.log(`[db] applied migration ${file}`);
  }
}

async function cliMain() {
  await runMigrations();
  await closePool();
}

if (require.main === module) {
  cliMain().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
