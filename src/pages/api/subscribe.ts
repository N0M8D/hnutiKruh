// src/pages/api/subscribe.js

// src/pages/api/subscribe.ts
import type { APIRoute } from 'astro';

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
    const Email = formData.get('Email');
    const Jmeno = formData.get('Jmeno');
    const Prijmeni = formData.get('Prijmeni');

    if (!Email || typeof Email !== 'string') {
        return new Response(
            JSON.stringify({ error: 'Chybí email nebo je ve špatném formátu' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
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
