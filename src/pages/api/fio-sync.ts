import type { APIRoute } from 'astro';
import { syncAllAccounts } from '../../lib/fioSync';

// Vercel Cron posílá "Authorization: Bearer $CRON_SECRET" automaticky, pokud je
// v projektu nastavená env proměnná CRON_SECRET. Stejný secret lze použít i pro
// ruční crontab na VPS (curl -H "Authorization: Bearer $CRON_SECRET" ...).
function isAuthorized(request: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false; // bez nastaveného secretu endpoint odmítá vše
    return request.headers.get('authorization') === `Bearer ${secret}`;
}

export const GET: APIRoute = async ({ request, url }) => {
    if (!isAuthorized(request)) {
        return new Response('Unauthorized', { status: 401 });
    }

    // ?force=1 obchází "synchronizováno nedávno" throttle - pro ruční/ladicí spuštění.
    const force = url.searchParams.get('force') === '1';
    const results = await syncAllAccounts(force);
    return new Response(JSON.stringify({ ok: true, results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
