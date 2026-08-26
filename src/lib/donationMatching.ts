import { prisma } from './prisma';

const DIACRITICS: Record<string, string> = {
    á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o',
    ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z'
};

function stripDiacritics(s: string): string {
    return s.replace(/[áčďéěíňóřšťúůýž]/g, (ch) => DIACRITICS[ch] ?? ch);
}

// Porovnává jméno bez ohledu na diakritiku, velikost písmen a pořadí slov -
// bankovní výpis dává jméno majitele účtu (často VELKÝMI PÍSMENY, v jiném pořadí),
// zatímco Donation má jméno tak, jak ho dárce vyplnil ve formuláři.
function normalizedWords(s: string): Set<string> {
    return new Set(
        stripDiacritics(s.toLowerCase())
            .replace(/[^a-z\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
    );
}

// Jméno a příjmení dárce musí být obsažené ve jméně majitele protiúčtu z banky
// (dovoluje bance uvádět navíc tituly apod., ale nedovolí shodu jen náhodou).
function namesMatch(donationFullName: string, counterName: string): boolean {
    const donationWords = normalizedWords(donationFullName);
    const counterWords = normalizedWords(counterName);
    if (donationWords.size === 0) return false;
    for (const word of donationWords) {
        if (!counterWords.has(word)) return false;
    }
    return true;
}

export interface DonationMatchResult {
    matched: number;
}

// Projde nezaplacené dary a zkusí k nim dohledat odpovídající transakci na
// dárcovském Fio účtu podle variabilního symbolu + jména a příjmení dárce.
// Volá se po každém syncu (viz src/lib/fioSync.ts) - je to čistě DB operace,
// takže žádné dodatečné volání Fio nestojí.
export async function matchDonationsToTransactions(): Promise<DonationMatchResult> {
    const pendingDonations = await prisma.donation.findMany({
        where: { paymentStatus: 'PENDING' }
    });

    let matched = 0;

    for (const donation of pendingDonations) {
        const tx = await prisma.fioTransaction.findFirst({
            where: {
                variableSymbol: donation.VariabilniSymbol,
                amount: { gt: 0 },
                account: { key: 'dary' }
            },
            orderBy: { date: 'asc' }
        });

        if (!tx || !tx.counterName) continue;

        const fullName = `${donation.Jmeno} ${donation.Prijmeni}`;
        if (!namesMatch(fullName, tx.counterName)) continue;

        const donatedAmount = Number(donation.Castka);
        const receivedAmount = Number(tx.amount);
        const paymentStatus = receivedAmount < donatedAmount ? 'UNDERPAID' : receivedAmount > donatedAmount ? 'OVERPAID' : 'PAID';

        await prisma.donation.update({
            where: { id: donation.id },
            data: {
                paymentStatus,
                paidAt: tx.date,
                bankRef: String(tx.fioTransactionId)
            }
        });
        matched++;
    }

    return { matched };
}
