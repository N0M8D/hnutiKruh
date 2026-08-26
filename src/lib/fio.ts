// Klient pro Fio Banka API (https://www.fio.cz/bank-services/internetbanking-api).
// Token je vázaný na jeden konkrétní účet a je součástí URL, ne hlavičky.
// Rate limit Fio: 1 request / 30s na token (překročení = HTTP 409).

const FIO_BASE_URL = 'https://fioapi.fio.cz/v1/rest';

export interface FioAccountInfo {
    accountId: string;
    bankId: string;
    currency: string;
    iban: string | null;
    bic: string | null;
    openingBalance: number | null;
    closingBalance: number | null;
    dateStart: string | null;
    dateEnd: string | null;
    idFrom: number | null;
    idTo: number | null;
    idLastDownload: number | null;
}

export interface FioTransactionParsed {
    fioTransactionId: bigint;
    date: Date;
    amount: number;
    currency: string;
    counterAccount: string | null;
    counterBankCode: string | null;
    counterBankName: string | null;
    counterName: string | null;
    variableSymbol: string | null;
    constantSymbol: string | null;
    specificSymbol: string | null;
    userIdentification: string | null;
    message: string | null;
    type: string | null;
    comment: string | null;
    raw: Record<string, unknown>;
}

interface FioColumn {
    value: string | number | null;
    name: string;
    id: number;
}

type FioRawTransaction = Record<string, FioColumn | undefined>;

interface FioApiResponse {
    accountStatement: {
        info: Record<string, unknown>;
        transactionList: {
            transaction: FioRawTransaction[] | null;
        };
    };
}

// Fio pojmenovává sloupce v odpovědi lidsky čitelně (např. "Datum", "Objem", "VS"...),
// ale jejich číselný index (columnN) není nikde stabilně zdokumentovaný.
// Proto se párujeme podle `name`, ne podle indexu - odolnější vůči změnám na straně Fio.
const FIELD_NAMES = {
    date: 'Datum',
    amount: 'Objem',
    currency: 'Měna',
    counterAccount: 'Protiúčet',
    counterBankCode: 'Kód banky',
    counterBankName: 'Název banky',
    counterName: 'Název protiúčtu',
    variableSymbol: 'VS',
    constantSymbol: 'KS',
    specificSymbol: 'SS',
    userIdentification: 'Uživatelská identifikace',
    message: 'Zpráva pro příjemce',
    type: 'Typ',
    comment: 'Komentář',
    transactionId: 'ID pohybu'
} as const;

// Fio vrací datum jako "2026-08-07+0200" (ISO datum + offset bez "T" mezi nimi),
// což nativní Date parser odmítá jako Invalid Date. Bereme jen datovou část.
function parseFioDate(raw: string | number): Date {
    const s = String(raw);
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(s);
    return new Date(match ? `${match[1]}T00:00:00` : s);
}

function findColumn(tx: FioRawTransaction, name: string): FioColumn | undefined {
    for (const key in tx) {
        const col = tx[key];
        if (col && col.name === name) return col;
    }
    return undefined;
}

function textOf(tx: FioRawTransaction, name: string): string | null {
    const v = findColumn(tx, name)?.value;
    return v === null || v === undefined || v === '' ? null : String(v);
}

function parseTransaction(tx: FioRawTransaction): FioTransactionParsed {
    const idRaw = findColumn(tx, FIELD_NAMES.transactionId)?.value;
    const dateRaw = findColumn(tx, FIELD_NAMES.date)?.value;
    const amountRaw = findColumn(tx, FIELD_NAMES.amount)?.value;

    if (idRaw === null || idRaw === undefined) {
        throw new Error('Fio transakce bez ID pohybu - nelze bezpečně uložit.');
    }

    return {
        fioTransactionId: BigInt(idRaw),
        date: dateRaw ? parseFioDate(dateRaw) : new Date(),
        amount: amountRaw === null || amountRaw === undefined ? 0 : Number(amountRaw),
        currency: textOf(tx, FIELD_NAMES.currency) || 'CZK',
        counterAccount: textOf(tx, FIELD_NAMES.counterAccount),
        counterBankCode: textOf(tx, FIELD_NAMES.counterBankCode),
        counterBankName: textOf(tx, FIELD_NAMES.counterBankName),
        counterName: textOf(tx, FIELD_NAMES.counterName),
        variableSymbol: textOf(tx, FIELD_NAMES.variableSymbol),
        constantSymbol: textOf(tx, FIELD_NAMES.constantSymbol),
        specificSymbol: textOf(tx, FIELD_NAMES.specificSymbol),
        userIdentification: textOf(tx, FIELD_NAMES.userIdentification),
        message: textOf(tx, FIELD_NAMES.message),
        type: textOf(tx, FIELD_NAMES.type),
        comment: textOf(tx, FIELD_NAMES.comment),
        raw: tx as Record<string, unknown>
    };
}

function parseInfo(info: Record<string, unknown>): FioAccountInfo {
    const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    return {
        accountId: String(info.accountId ?? ''),
        bankId: String(info.bankId ?? ''),
        currency: String(info.currency ?? 'CZK'),
        iban: (info.iban as string) ?? null,
        bic: (info.bic as string) ?? null,
        openingBalance: num(info.openingBalance),
        closingBalance: num(info.closingBalance),
        dateStart: (info.dateStart as string) ?? null,
        dateEnd: (info.dateEnd as string) ?? null,
        idFrom: num(info.idFrom),
        idTo: num(info.idTo),
        idLastDownload: num(info.idLastDownload)
    };
}

// Fio na "last/" endpointu vyžaduje jednorázovou "silnou autorizaci" v internetbankingu,
// pokud by měl vrátit data starší než 90 dní (typicky při úplně prvním stažení u účtu,
// který je starší než 90 dní). Data v posledních 90 dnech lze přes "periods/" získat bez ní.
export class FioStrongAuthRequiredError extends Error {}

async function callFio(url: string): Promise<{ info: FioAccountInfo; transactions: FioTransactionParsed[] }> {
    const res = await fetch(url);

    if (res.status === 409) {
        throw new Error('Fio API: překročen rate limit (1 request / 30s na token).');
    }
    if (res.status === 422) {
        throw new FioStrongAuthRequiredError(await res.text().catch(() => 'Vyžadována silná autorizace.'));
    }
    if (!res.ok) {
        throw new Error(`Fio API vrátilo chybu ${res.status}: ${await res.text().catch(() => '')}`);
    }

    const data = (await res.json()) as FioApiResponse;
    const info = parseInfo(data.accountStatement.info);
    const rawTransactions = data.accountStatement.transactionList.transaction ?? [];
    const transactions = rawTransactions.map(parseTransaction);

    return { info, transactions };
}

function fmtDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

// Nové transakce od posledního stažení (Fio si stav pamatuje na své straně, per token).
export function fetchSinceLast(token: string) {
    return callFio(`${FIO_BASE_URL}/last/${token}/transactions.json`);
}

// Historický výpis za období - pro počáteční naplnění DB.
export function fetchPeriod(token: string, dateFrom: Date, dateTo: Date) {
    return callFio(`${FIO_BASE_URL}/periods/${token}/${fmtDate(dateFrom)}/${fmtDate(dateTo)}/transactions.json`);
}

// Ručně posune Fio ukazatel "poslední stažené transakce" na dané datum, aby další
// volání fetchSinceLast() vracelo jen transakce od tohoto data dál.
export async function setLastDate(token: string, date: Date): Promise<void> {
    const res = await fetch(`${FIO_BASE_URL}/set-last-date/${token}/${fmtDate(date)}/`);
    if (!res.ok) {
        throw new Error(`Fio API (set-last-date) vrátilo chybu ${res.status}: ${await res.text().catch(() => '')}`);
    }
}
