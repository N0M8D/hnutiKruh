// src/pages/api/subscribe.js

// src/pages/api/subscribe.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ params, request }) => {
    // Načtení dat z formuláře

    const formData = await request.formData()

    //Data z formuláře
    const email = formData.get('Email');
    const jmeno = formData.get('Jmeno');
    const prijmeni = formData.get('Prijmeni');

    // Validace vstupu
    if (!email || typeof email !== 'string') {
        return new Response(
            JSON.stringify({ error: 'Chybí email nebo je ve špatném formátu' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // URL API Ecomail 
    const ecomailApiUrl = 'https://api2.ecomailapp.cz/lists/2/subscribe';
    const apiKey = import.meta.env.ECOMAIL_API_KEY;

    try {
        var body = {
            'subscriber_data': {
                'name': jmeno,
                'surname': prijmeni,
                'email': email,
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
            return new Response(
                JSON.stringify({
                    error: 'Nepodařilo se přihlásit k odběru',
                    details: errorData,
                }),
                { status: response.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Po úspěšném subscribe přesměrujeme uživatele na děkovací stránku
        const redirectUrl = new URL('/thank-you', request.url);
        return Response.redirect(redirectUrl.toString(), 303);
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Chyba serveru', details: error }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
