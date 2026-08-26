import { prisma } from './prisma';
import { fetchSinceLast, fetchPeriod, setLastDate, FioStrongAuthRequiredError, type FioTransactionParsed } from './fio';
import { fioSyncAccounts } from '../config/fioAccounts';
import { matchDonationsToTransactions } from './donationMatching';
import type { Prisma } from '@prisma/client';

// Ochrana proti zbytečně častým voláním Fio (cron + startup trigger by se jinak
// mohly potkat). Fio má navíc tvrdý rate limit 1 request/30s na token.
const MIN_INTERVAL_MS = 55 * 60 * 1000;

// Kolik dní zpět stahujeme při bootstrapu starého účtu bez interaktivní autorizace
// (Fio dovolí posledních ~90 dní bez ní).
const BOOTSTRAP_DAYS = 89;

export interface SyncResult {
    key: string;
    skipped?: boolean;
    reason?: string;
    fetched?: number;
    created?: number;
    error?: string;
}

export async function syncAllAccounts(force = false): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    for (const cfg of fioSyncAccounts) {
        if (!cfg.active) {
            results.push({ key: cfg.key, skipped: true, reason: 'neaktivní účet' });
            continue;
        }
        try {
            results.push(await syncAccount(cfg.key, cfg.tokenEnvVar, force));
        } catch (err) {
            console.error(`Fio sync (${cfg.key}) selhal:`, err);
            results.push({ key: cfg.key, error: err instanceof Error ? err.message : 'unknown error' });
        }
    }

    // Čistě DB operace (žádné volání Fio) - proto klidně po každém běhu, i po chybě u účtu.
    try {
        await matchDonationsToTransactions();
    } catch (err) {
        console.error('Párování darů s transakcemi selhalo:', err);
    }

    return results;
}

async function saveTransactions(accountId: number, transactions: FioTransactionParsed[]): Promise<number> {
    if (transactions.length === 0) return 0;
    const result = await prisma.fioTransaction.createMany({
        data: transactions.map((tx) => ({
            accountId,
            fioTransactionId: tx.fioTransactionId,
            date: tx.date,
            amount: tx.amount,
            currency: tx.currency,
            counterAccount: tx.counterAccount,
            counterBankCode: tx.counterBankCode,
            counterBankName: tx.counterBankName,
            counterName: tx.counterName,
            variableSymbol: tx.variableSymbol,
            constantSymbol: tx.constantSymbol,
            specificSymbol: tx.specificSymbol,
            userIdentification: tx.userIdentification,
            message: tx.message,
            type: tx.type,
            comment: tx.comment,
            raw: tx.raw as Prisma.InputJsonValue
        })),
        skipDuplicates: true // idempotentní vůči @@unique([accountId, fioTransactionId])
    });
    return result.count;
}

// Každé volání téhle funkce udělá NEJVÝŠE jeden skutečný HTTP request na Fio.
// Bootstrap starého účtu (viz FioAccount.bootstrapPending) proto trvá 2-3 samostatné
// běhy synchronizace místo dvou volání v rychlém sledu, která by se navzájem srazila
// s Fio rate limitem (1 request/30s na token, počítá se i neúspěšný pokus).
async function syncAccount(key: string, tokenEnvVar: string, force: boolean): Promise<SyncResult> {
    const token = process.env[tokenEnvVar];
    if (!token) {
        return { key, skipped: true, reason: `chybí env proměnná ${tokenEnvVar}` };
    }

    const account = await prisma.fioAccount.upsert({
        where: { key },
        create: { key },
        update: {}
    });

    if (!force && account.lastSyncedAt && Date.now() - account.lastSyncedAt.getTime() < MIN_INTERVAL_MS) {
        return { key, skipped: true, reason: 'synchronizováno nedávno' };
    }

    // Fáze 2: historii už máme, jen doladit Fio ukazatel "poslední stažené".
    if (account.bootstrapPending === 'SET_LAST_DATE') {
        await setLastDate(token, new Date());
        await prisma.fioAccount.update({
            where: { id: account.id },
            data: { bootstrapPending: null, lastSyncedAt: new Date() }
        });
        return { key, fetched: 0, created: 0, reason: 'bootstrap dokončen (posunut ukazatel)' };
    }

    // Fáze 1: jednorázově natáhnout posledních ~90 dní bez nutnosti autorizace v IB.
    if (account.bootstrapPending === 'PERIOD') {
        const dateTo = new Date();
        const dateFrom = new Date(dateTo.getTime() - BOOTSTRAP_DAYS * 24 * 60 * 60 * 1000);
        const { transactions } = await fetchPeriod(token, dateFrom, dateTo);
        const created = await saveTransactions(account.id, transactions);
        await prisma.fioAccount.update({
            where: { id: account.id },
            data: { bootstrapPending: 'SET_LAST_DATE' }
        });
        return { key, fetched: transactions.length, created, reason: 'bootstrap fáze 1/2 (historie za 90 dní)' };
    }

    // Normální provoz.
    try {
        const { info, transactions } = await fetchSinceLast(token);
        const created = await saveTransactions(account.id, transactions);
        await prisma.fioAccount.update({
            where: { id: account.id },
            data: {
                lastSyncedAt: new Date(),
                lastFioId: info.idTo !== null ? BigInt(info.idTo) : account.lastFioId
            }
        });
        return { key, fetched: transactions.length, created };
    } catch (err) {
        if (!(err instanceof FioStrongAuthRequiredError)) throw err;

        // Účet je starší než 90 dní - odstartuj dvoufázový bootstrap při příštím běhu.
        await prisma.fioAccount.update({
            where: { id: account.id },
            data: { bootstrapPending: 'PERIOD' }
        });
        return { key, skipped: true, reason: 'účet vyžaduje bootstrap (spustí se při příštím běhu)' };
    }
}
