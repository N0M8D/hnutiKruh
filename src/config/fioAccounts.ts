// Konfigurace účtů synchronizovaných z Fio API.
// `key` musí odpovídat hodnotě `fioKey` u účtu v src/config/ucty.js.
// `tokenEnvVar` je jméno proměnné prostředí, kde je uložený Fio API token
// (token se generuje v internetovém bankovnictví, je vázaný na 1 konkrétní účet).
//
// Rotace účtů (nové volby / nový rok): přidejte nový záznam s `active: true`
// a u starého nastavte `active: false`. Historické transakce zůstanou v DB
// a stránka /financovani je dál zobrazí, jen se pro ně přestane volat Fio.
export interface FioSyncAccount {
    key: string;
    tokenEnvVar: string;
    active: boolean;
}

export const fioSyncAccounts: FioSyncAccount[] = [
    { key: 'dary', tokenEnvVar: 'FIO_TOKEN_DARY', active: true },
    { key: 'senat2026', tokenEnvVar: 'FIO_TOKEN_SENAT2026', active: true }
];
