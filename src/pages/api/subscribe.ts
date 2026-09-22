// src/pages/api/subscribe.js

// src/pages/api/subscribe.ts
import type { APIRoute } from 'astro';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 5;
const EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const ipRequestWindows = new Map<string, number[]>();
const emailSubmissionTimes = new Map<string, number>();

function getClientIp(request: Request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? 'unknown';
}

function isRateLimited(ipAddress: string, email: string) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const recentRequests = (ipRequestWindows.get(ipAddress) ?? []).filter((timestamp) => timestamp > windowStart);

    if (recentRequests.length >= MAX_REQUESTS_PER_IP || (emailSubmissionTimes.get(email) ?? 0) > now - EMAIL_COOLDOWN_MS) {
        return true;
    }

    recentRequests.push(now);
    ipRequestWindows.set(ipAddress, recentRequests);
    emailSubmissionTimes.set(email, now);
    return false;
}

function errorResponse(error: string, status: number) {
    return new Response(JSON.stringify({ error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

async function verifyTurnstileToken(token: string, request: Request) {
    const secret = import.meta.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        console.error('TURNSTILE_SECRET_KEY není nastavený.');
        return false;
    }

    const verificationData = new FormData();
    verificationData.set('secret', secret);
    verificationData.set('response', token);
    verificationData.set('remoteip', getClientIp(request));

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: verificationData,
    });
    if (!response.ok) return false;

    const result: { success?: boolean; action?: string; hostname?: string } = await response.json();
    return result.success === true
        && result.action === 'newsletter_subscribe'
        && result.hostname === new URL(request.url).hostname;
}

export async function subscribeUser({ Jmeno, Prijmeni, Email }: { Jmeno: string, Prijmeni: string, Email: string }) {
    const ecomailApiUrl = 'https://api2.ecomailapp.cz/lists/2/subscribe';
    const apiKey = import.meta.env.ECOMAIL_API_KEY;

    const body = {
        'subscriber_data': {
            'name': Jmeno,
            'surname': Prijmeni,
            'email': Email,
            'source': 'WEB',
        },
        'trigger_autoresponders': true,
        'update_existing': true,
        'resubscribe': false
    };

    const response = await fetch(ecomailApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'key': apiKey,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw {
            error: 'Nepodařilo se přihlásit k odběru',
            details: errorData,
            status: response.status
        };
    }
    return true;
}

export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const rawEmail = formData.get('Email');
    const Jmeno = formData.get('Jmeno');
    const Prijmeni = formData.get('Prijmeni');
    const consent = formData.get('consent');
    const honeypot = formData.get('website');
    const formStartedAt = Number(formData.get('formStartedAt'));
    const turnstileToken = formData.get('cf-turnstile-response');

    if (typeof honeypot === 'string' && honeypot.trim()) {
        return errorResponse('Formulář se nepodařilo odeslat.', 400);
    }

    if (!Number.isFinite(formStartedAt) || Date.now() - formStartedAt < 2_000 || Date.now() - formStartedAt > 24 * 60 * 60 * 1000) {
        return errorResponse('Formulář se nepodařilo odeslat.', 400);
    }

    if (consent !== 'true') {
        return errorResponse('Pro přihlášení je nutný souhlas se zpracováním osobních údajů.', 400);
    }

    if (typeof turnstileToken !== 'string' || !await verifyTurnstileToken(turnstileToken, request)) {
        return errorResponse('Ověření proti automatizovanému odesílání se nezdařilo. Obnovte stránku a zkuste to znovu.', 403);
    }

    if (!rawEmail || typeof rawEmail !== 'string') {
        return errorResponse('Chybí e-mail nebo je ve špatném formátu.', 400);
    }

    const Email = rawEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email) || Email.length > 254) {
        return errorResponse('Chybí e-mail nebo je ve špatném formátu.', 400);
    }

    if (isRateLimited(getClientIp(request), Email)) {
        return errorResponse('Příliš mnoho pokusů o přihlášení. Zkuste to prosím později.', 429);
    }

    try {
        await subscribeUser({ Jmeno: Jmeno as string, Prijmeni: Prijmeni as string, Email: Email as string });

        const redirectUrl = new URL('/thank-you', request.url);
        return Response.redirect(redirectUrl.toString(), 303);
    } catch (error: any) {
        return new Response(
            JSON.stringify(error),
            { status: error.status || 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
