import { defineMiddleware } from 'astro:middleware';
import { syncAllAccounts } from './lib/fioSync';

// Astro/Vercel serverless nemá "server start" hook - proces se probouzí a uspává
// s každým cold startem. Tohle je nejbližší náhrada: při první požadavku na čerstvou
// instanci zkusí na pozadí dotáhnout nové Fio transakce. syncAllAccounts() si sám
// interně hlídá, aby nevolal Fio, pokud se sync provedl nedávno (viz MIN_INTERVAL_MS
// v src/lib/fioSync.ts) - takže tohle nijak nekoliduje s hodinovým cronem.
let triggeredForThisInstance = false;

export const onRequest = defineMiddleware(async (_context, next) => {
    if (!triggeredForThisInstance) {
        triggeredForThisInstance = true;
        syncAllAccounts().catch((err) => console.error('Fio startup sync selhal:', err));
    }
    return next();
});
