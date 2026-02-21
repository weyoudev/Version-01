import { createApp } from './create-app';
import { parseDatabaseUrlForLogging } from '../infra/db-url.util';
import { prisma } from '../infra/prisma/prisma-client';

async function bootstrap() {
  const app = await createApp();

  const port = process.env.PORT ? Number(process.env.PORT) : 3003;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`API listening on http://0.0.0.0:${port}/api (reachable from LAN at your PC IP)`);

  const dbUrl = process.env.DATABASE_URL;
  const { dbHost, databaseName, masked } = parseDatabaseUrlForLogging(dbUrl);
  // eslint-disable-next-line no-console
  console.log(`DB connection: host=${dbHost} database=${databaseName} (${masked})`);

  const maxAttempts = 5;
  const delayMs = 3000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const row = await prisma.$queryRaw<[{ current_database: string; current_schema: string }]>`
        SELECT current_database() AS "current_database", current_schema() AS "current_schema"
      `;
      if (row?.[0]) {
        // eslint-disable-next-line no-console
        console.log(`DB verified: schema=${row[0].current_schema}`);
        break;
      }
    } catch (err) {
      if (attempt < maxAttempts) {
        // eslint-disable-next-line no-console
        console.warn(`DB verification attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs / 1000}s...`, (err as Error).message);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          'DB verification failed after retries:',
          (err as Error).message,
          '\n  API is still running. If using Supabase: restore a paused project in the dashboard, or use the pooler URL (port 6543) in DATABASE_URL if 5432 is blocked.',
        );
      }
    }
  }
}

bootstrap();
