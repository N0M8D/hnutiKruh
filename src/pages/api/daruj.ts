import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import { subscribeUser } from './subscribe';
import { createInvolvement } from './joinus';

const prisma = new PrismaClient();

/*
  (Model Donation je nyní definován v prisma/schema.prisma)
*/

async function generateVariableSymbol(): Promise<string> {
    // 10-char (numeric) VS attempt; ensure uniqueness
    for (let i = 0; i < 6; i++) {
        const vs = Math.floor(1e9 + Math.random() * 9e9).toString(); // 10 digits total
        const exists = await prisma.donation.findUnique({ where: { VariabilniSymbol: vs } });
        if (!exists) return vs;
    }
    return Date.now().toString().slice(-10);
}

const toBool = (v: FormDataEntryValue | null) => v === 'true' || v === 'on';

export const POST: APIRoute = async ({ request }) => {
    try {
        const form = await request.formData();
        const get = (k: string) => (form.get(k) || '').toString().trim();

        const rawPSC = get('PSC');
        const normalizedPSC = rawPSC.replace(/\D/g, ''); // only digits

        const data = {
            Jmeno: get('Jmeno'),
            Prijmeni: get('Prijmeni'),
            DatumNarozeni: get('DatumNarozeni'),
            StatniPrislusnost: get('StatniPrislusnost'),
            Ulice: get('Ulice'),
            Obec: get('Obec'),
            PSC: normalizedPSC,
            Stat: get('Stat') || 'Česká republika',
            Email: get('Email'),
            Telefon: get('Telefon'),
            Castka: get('Castka'),
            Poznamka: get('Poznamka') || null,
            ZapojitSe: toBool(form.get('ZapojitSe')),
            Newsletter: toBool(form.get('Newsletter')),
            GDPR: toBool(form.get('GDPR')),
        };

        if (!data.GDPR) return new Response('Chybí souhlas GDPR', { status: 400 });

        // Basic required check
        const required = ['Jmeno', 'Prijmeni', 'DatumNarozeni', 'Ulice', 'Obec', 'PSC', 'Email', 'Telefon', 'Castka'];
        for (const f of required) {
            // @ts-ignore
            if (!data[f]) return new Response(`Chybí pole: ${f}`, { status: 400 });
        }

        // Validace PSC: max 5 číslic
        if (!/^\d{1,5}$/.test(data.PSC)) {
            return new Response('Neplatné PSČ (povoleno 1–5 číslic, bez mezer).', { status: 400 });
        }

        // Validace emailu (základní)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) {
            return new Response('Neplatný e‑mail.', { status: 400 });
        }

        // Validace telefonu: volitelné + na začátku, poté 6–15 číslic
        if (!/^\+?\d{6,15}$/.test(data.Telefon.replace(/\s+/g, ''))) {
            return new Response('Neplatný telefon. Povolen + na začátku a 6–15 číslic.', { status: 400 });
        }

        // Validace částky
        const castkaNum = parseFloat(data.Castka);
        if (isNaN(castkaNum) || castkaNum <= 0) {
            return new Response('Částka musí být kladné číslo větší než 0.', { status: 400 });
        }

        const VariabilniSymbol = await generateVariableSymbol();

        const donation = await prisma.donation.create({
            data: {
                Jmeno: data.Jmeno,
                Prijmeni: data.Prijmeni,
                DatumNarozeni: new Date(data.DatumNarozeni),
                StatniPrislusnost: data.StatniPrislusnost,
                Ulice: data.Ulice,
                Obec: data.Obec,
                PSC: data.PSC,
                Stat: data.Stat,
                Email: data.Email,
                Telefon: data.Telefon,
                Castka: castkaNum,
                VariabilniSymbol,
                Poznamka: data.Poznamka,
                ZapojitSe: data.ZapojitSe,
                Newsletter: data.Newsletter,
            }
        });

        // Pokud chce zapojit -> vytvoří involvement (pokud máte tabulku involvement)
        if (data.ZapojitSe) {
            try {
                await createInvolvement({
                    Jmeno: data.Jmeno,
                    Prijmeni: data.Prijmeni,
                    Email: data.Email,
                    Telefon: data.Telefon,
                    newsletter: data.Newsletter,
                    gdprConsent: true,
                    doNotSubscribe: true
                });
            } catch (e) {
                console.warn('Involvement create failed:', e);
            }
        }

        // Newsletter
        if (data.Newsletter) {
            try {
                await subscribeUser({
                    Jmeno: data.Jmeno,
                    Prijmeni: data.Prijmeni,
                    Email: data.Email
                });
            } catch (e) {
                console.warn('Newsletter subscribe failed:', e);
            }
        }

        // VS ani ID neposíláme v URL – uložíme VS do krátkodobého HttpOnly cookie
        const headers = new Headers();
        headers.set('Location', '/thank-you-donation');
        headers.append(
            'Set-Cookie',
            `lastDonationVS=${donation.VariabilniSymbol}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax${request.url.startsWith('https') ? '; Secure' : ''}`
        );
        return new Response(null, { status: 303, headers });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Chyba při zpracování daru' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};