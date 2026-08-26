# NocoDB: Politická reklama (nařízení EU 2024/900)

Tabulka se zobrazuje na [/financovani](../src/pages/financovani/index.astro), pod
tabulkou transakcí volebního účtu. Účel: splnit transparentnost placené
politické reklamy podle nařízení Evropského parlamentu a Rady (EU) 2024/900.

Data se **netahají do vlastní DB** (na rozdíl od Fio transakcí) - stránka je
bude číst přímo z NocoDB při každém requestu, stejně jako dnes funguje
[nocoDb.ts](../src/pages/api/nocoDb.ts) pro kandidátky. Zjednodušení je
záměrné, časem se to může předělat.

## Název tabulky

Návrh: `Politicka_reklama` (na názvu nezáleží, propojovat se bude přes Table ID).

## Sloupce (aktuální stav v NocoDB)

Skutečné názvy podle vytvořené tabulky - kód bude číst přesně tyhle klíče:

| Sloupec | Typ v NocoDB | Poznámka |
|---|---|---|
| `id` | primární klíč (auto) | vytvořeno NocoDB automaticky |
| `title` | Single line text | výchozí "display" sloupec od NocoDB - nepoužíváme, na webu se ignoruje |
| `created_at` | Date (auto) | kdy vznikl řádek v NocoDB - není datum platby |
| `updated_at` | Date (auto) | kdy byl řádek naposledy upraven |
| `datum_platby` | Date | kdy byla reklama zaplacena - zobrazuje se na webu |
| `castka` | Currency | částka v Kč |
| `zadavatel` | Single line text | kdo reklamu objednal / za koho je |
| `vydavatel` | Single line text | kdo reklamu zveřejnil - médium/platforma |
| `popis` | Long text | popis obsahu/účelu reklamy |
| `zverejnit` | Checkbox | řídí, jestli se řádek zobrazí na webu |
| `odkaz` | URL | odkaz na samotnou reklamu / knihovnu reklam |
| `zverejneno_od` | Date | od kdy reklama běžela |
| `zverejneno_do` | Date | do kdy reklama běžela |

## Zobrazení (view)

Doporučuju v NocoDB rovnou vytvořit grid view seřazený podle data platby
sestupně, případně filtrovaný na `zverejnit = true` (obdoba `viewId` v
`nocoDb.ts`) - ať API vrací rovnou jen to, co má jít na web.

## Stav

Tabulka je hotová, `PUBLIC_NOCODB_ADS_TABLE_ID` je nastavené v `.env`
(placeholder i v `.env.example`) a kód ji čte přímo přes
[nocodbAds.ts](../src/lib/nocodbAds.ts) → zobrazuje se na `/financovani` pod
tabulkou volebního účtu. Token (`PUBLIC_NOCODB_TOKEN`) je sdílený s candidates
fetchem, nový netřeba.

Filtr na webu: `zverejnit = true`, řazeno podle `datum_platby` sestupně.
