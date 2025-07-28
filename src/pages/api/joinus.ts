import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { subscribeUser } from './subscribe';

interface InvolvementFormData {
    Jmeno: string;
    Prijmeni: string;
    Email: string;
    Telefon: string;
    newsletter: boolean;
    gdprConsent: boolean;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const data: InvolvementFormData = {
            Jmeno: formData.get('Jmeno') as string,
            Prijmeni: formData.get('Prijmeni') as string,
            Email: formData.get('Email') as string,
            Telefon: formData.get('Telefon') as string,
            newsletter: formData.get('newsletter') === 'true',
            gdprConsent: formData.get('gdprConsent') === 'true',
        };

        await prisma.involvement.create({
            data: {
                Jmeno: data.Jmeno,
                Prijmeni: data.Prijmeni,
                Email: data.Email,
                Telefon: data.Telefon,
                newsletter: data.newsletter,
                gdprConsent: data.gdprConsent,
            },
        });

        if (data.newsletter) {
            // Zavolejte přímo funkci místo fetch
            await subscribeUser({
                Jmeno: data.Jmeno,
                Prijmeni: data.Prijmeni,
                Email: data.Email
            });
        }

        // Redirect na děkovací stránku
        const redirectUrl = new URL('/zakrouzkovan', request.url);
        return Response.redirect(redirectUrl.toString(), 303);

    } catch (error) {
        return new Response(JSON.stringify({
            message: 'Došlo k chybě při zpracování formuláře'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};