// Politická reklama (transparentnost dle nařízení EU 2024/900) - data žijí
// v NocoDB, ne ve vlastní DB (viz docs/nocodb-politicka-reklama.md).
// Stránka /financovani je čte přímo odtud při každém requestu.

const NOCODB_BASE_URL = 'https://nocodb.czechnomad.cz/api/v2/tables';

export interface PoliticalAd {
    id: number;
    datumPlatby: string | null;
    castka: number | null;
    zadavatel: string;
    vydavatel: string;
    popis: string;
    odkaz: string | null;
    zverejnenoOd: string | null;
    zverejnenoDo: string | null;
}

export async function fetchPoliticalAds(): Promise<PoliticalAd[]> {
    const tableId = import.meta.env.PUBLIC_NOCODB_ADS_TABLE_ID;
    const token = import.meta.env.PUBLIC_NOCODB_TOKEN;
    if (!tableId || !token) return [];

    const params = new URLSearchParams({
        limit: '200',
        where: '(zverejnit,eq,1)', // checkbox v NocoDB API je 1/0, ne true/false
        sort: '-datum_platby'
    });

    try {
        const res = await fetch(`${NOCODB_BASE_URL}/${tableId}/records?${params}`, {
            headers: { 'xc-token': token }
        });
        if (!res.ok) {
            throw new Error(`NocoDB API vrátilo chybu ${res.status}: ${await res.text().catch(() => '')}`);
        }

        const data = await res.json();
        const rows = (data?.list ?? []) as Record<string, unknown>[];

        return rows.map((raw) => ({
            id: Number(raw.id),
            datumPlatby: (raw.datum_platby as string) ?? null,
            castka: raw.castka === null || raw.castka === undefined ? null : Number(raw.castka),
            zadavatel: (raw.zadavatel as string) || '',
            vydavatel: (raw.vydavatel as string) || '',
            popis: (raw.popis as string) || '',
            odkaz: (raw.odkaz as string) || null,
            zverejnenoOd: (raw.zverejneno_od as string) ?? null,
            zverejnenoDo: (raw.zverejneno_do as string) ?? null
        }));
    } catch (err) {
        console.error('Načtení politické reklamy z NocoDB selhalo:', err);
        return [];
    }
}
