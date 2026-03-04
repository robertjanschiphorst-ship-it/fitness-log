export const dynamic = 'force-dynamic';

import { createClient } from '@libsql/client';

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  try {
    if (!url) return Response.json({ ok: false, error: 'TURSO_DATABASE_URL not set' });

    const client = createClient({ url, authToken });
    const result = await client.execute('SELECT 1 as n');
    return Response.json({ ok: true, rows: result.rows, url_prefix: url.substring(0, 15) });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message, url_prefix: url?.substring(0, 15) }, { status: 500 });
  }
}
