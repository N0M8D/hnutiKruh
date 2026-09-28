const NOCODB_BASE_URL = 'https://nocodb.czechnomad.cz/api/v2/tables';
const SENATE_DONATIONS_TABLE_ID = 'mstqnge0z5bjiqe';
const SENATE_DONATIONS_VIEW_ID = 'vwle3dkspsx5cyse';

export interface SenateElectionDonation {
    id: number;
    firstName: string;
    surname: string;
    donationDate: string | null;
    amount: number | null;
    birthDate: string | null;
    permanentResidence: string;
}

function toNumber(value: unknown): number | null {
    const numberValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
}

export async function fetchSenateElectionDonations(): Promise<SenateElectionDonation[]> {
    const token = import.meta.env.PUBLIC_NOCODB_TOKEN;
    if (!token) return [];

    const params = new URLSearchParams({
        limit: '200',
        viewId: SENATE_DONATIONS_VIEW_ID,
        sort: '-DatumDaru'
    });

    try {
        const response = await fetch(
            `${NOCODB_BASE_URL}/${SENATE_DONATIONS_TABLE_ID}/records?${params}`,
            { headers: { 'xc-token': token } }
        );
        if (!response.ok) {
            throw new Error(`NocoDB API vrátilo chybu ${response.status}: ${await response.text().catch(() => '')}`);
        }

        const data = await response.json();
        const rows = (data?.list ?? []) as Record<string, unknown>[];

        return rows.map((raw) => ({
            id: Number(raw.id),
            firstName: (raw.Jmeno as string) || '',
            surname: (raw.Prijmeni as string) || '',
            donationDate: (raw.DatumDaru as string) ?? null,
            amount: raw.CastkaDaru === null || raw.CastkaDaru === undefined ? null : toNumber(raw.CastkaDaru),
            birthDate: (raw.DatumNarozeni as string) ?? null,
            permanentResidence: (raw.TrvalyPobyt as string) || ''
        }));
    } catch (error) {
        console.error('Načtení darů pro volby do Senátu 2026 selhalo:', error);
        return [];
    }
}