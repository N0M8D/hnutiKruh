# Hnutí Kruh

Web hnutí [Hnutí Kruh](https://www.hnutikruh.cz/). Aplikace používá Astro se
server-side renderingem, nasazuje se na Vercel a pro ukládání formulářů používá
Prisma s MySQL/MariaDB.

## Technologie

- Astro 5, MDX a Lit web components
- Vercel adapter a Vercel Cron
- Prisma 6 a MySQL/MariaDB
- Ecomail pro newsletter
- Cloudflare Turnstile pro ochranu newsletteru
- Fio API pro synchronizaci transparentních účtů
- NocoDB pro přehled politické reklamy

## Požadavky

- Node.js 20 LTS nebo novější
- npm
- Přístup k MySQL/MariaDB pro formuláře a Fio synchronizaci

## Lokální spuštění

1. Nainstalujte závislosti:

   ```bash
   npm install
   ```

2. Zkopírujte `.env.example` do `.env` a vyplňte potřebné proměnné.

3. Vygenerujte Prisma klienta a spusťte vývojový server:

   ```bash
   npx prisma generate
   npm run dev
   ```

   Web je standardně dostupný na `http://localhost:4321`.

V produkci nastavte stejné proměnné ve Vercelu alespoň pro prostředí
`Production`; pro testování před nasazením také pro `Preview`.

## Nasazení

Produkční prostředí běží na Vercelu. Každé nasazení musí mít vyplněné všechny
produkční proměnné prostředí. Konfigurace [vercel.json](vercel.json) spouští
denní synchronizaci Fio na `/api/fio-sync` ve 03:00 UTC.

Před nasazením spusťte:

```bash
npm run build
```

Po změně `prisma/schema.prisma` vytvořte a aplikujte migraci:

```bash
npx prisma migrate dev --name popis_zmeny
npx prisma generate
```

Na produkční databázi se migrace aplikují řízeně v nasazovacím procesu pomocí
`npx prisma migrate deploy`.

## Newsletter a ochrana proti botům

Veřejné newsletterové formuláře posílají požadavky na `/api/subscribe`.
Endpoint před předáním kontaktu do Ecomailu ověřuje:

- povinný souhlas se zpracováním osobních údajů,
- platný e-mail,
- honeypot a minimální dobu vyplnění formuláře,
- Cloudflare Turnstile token včetně akce `newsletter_subscribe` a hostname,
- limit 5 požadavků za 15 minut na IP a opakování stejného e-mailu nejdříve po
  24 hodinách.

Limit je záměrně jen v paměti aktuální serverless instance; bez sdíleného
úložiště tedy není globální mezi instancemi ani po cold startu. Turnstile je
hlavní ochranná vrstva.

### Cloudflare Turnstile

V Cloudflare vytvořte widget typu `Managed` a mezi povolené hostname přidejte:

- `hnutikruh.cz`
- `www.hnutikruh.cz`
- `localhost`
- `127.0.0.1`

Nastavte jeho Site Key a Secret Key jako proměnné výše. Po úpravě lokálního
`.env` restartujte `npm run dev`.

Při ověření formuláře zkontrolujte, že se po úspěšném Turnstile a odeslání
zobrazí `/thank-you` a v Ecomailu vznikne očekávaný kontakt. V Ecomailu je
doporučeno zapnout double opt-in, aby se odběratelem stal pouze vlastník
potvrzené e-mailové adresy.

## Databáze a formuláře

Prisma schéma je v `prisma/schema.prisma`. Používané modely:

- `Involvement` pro formulář „Zapoj se“
- `Donation` pro dary
- `FioAccount` a `FioTransaction` pro historii bankovních synchronizací

HTTP endpointy formulářů jsou v `src/pages/api/`. Pravidelná synchronizace Fio
je v `src/lib/fioSync.ts`; seznam aktivních účtů se nastavuje v
`src/config/fioAccounts.ts`.

## Obsah a struktura

- Stránky a API: `src/pages/`
- Komponenty: `src/components/`
- Layouty: `src/layouts/`
- Globální CSS a téma: `src/styles/`
- Navigace: `src/config/nav.js`
- Veřejné obrázky a dokumenty: `public/assets/`
- Blogové příspěvky: `src/pages/blog/posts/`

Blog používá soubory MDX, nikoli Astro Content Collections. Nový příspěvek
musí mít frontmatter s `layout`, `title`, `description`, `publishDate` ve
formátu `DD.MM.YYYY`, `featuredImage`, `excerpt` a `tags`. Obrázek musí fyzicky
existovat v `public/assets/blog/` a v cestě se zapisuje bez prefixu `public`.

Podrobnosti o tabulce politické reklamy v NocoDB jsou v
[docs/nocodb-politicka-reklama.md](docs/nocodb-politicka-reklama.md).

## Editoři

- [Josef Bouše](https://github.com/N0M8D)
- [Jaroslav Holeček](https://github.com/JaroslavHolecek)
