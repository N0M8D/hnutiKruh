/**
 * Sdílený zdroj dat kandidátek Hnutí Kruh do senátu 2026.
 * Kandidátky se načítají z MDX detailů v src/pages/volby/kandidatky.
 */

const candidateModules = import.meta.glob('../pages/volby/kandidatky/*.mdx', { eager: true });

function getLeadParagraph(text = '') {
    return text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
        .find(Boolean) ?? '';
}

function formatObvod(obvod = '') {
    return obvod ? `Volební obvod č. ${obvod}` : '';
}

function getSlugFromUrl(url = '') {
    const segments = url.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? '';
}

export const senatKandidatky2026 = Object.values(candidateModules)
    .map((mod) => {
        const frontmatter = mod.frontmatter ?? {};

        return {
            slug: getSlugFromUrl(mod.url),
            jmeno: frontmatter.name ?? '',
            titul: frontmatter.titul ?? '',
            obvod: formatObvod(frontmatter.obvod),
            oblastExpertizy: frontmatter.oblastExpertizy ?? '',
            foto: frontmatter.featuredImage ?? '',
            href: mod.url ?? '/volby/senat-2026#kandidatky',
            citace: frontmatter.citace ?? '',
            perex: getLeadParagraph(frontmatter.omne ?? ''),
        };
    })
    .filter((candidate) => candidate.jmeno && candidate.href)
    .sort((left, right) => left.jmeno.localeCompare(right.jmeno, 'cs'));

export const podporovaneSenatniKandidatky2026 = [
    {
        slug: 'miroslav-stross',
        jmeno: 'Miroslav Štross',
        obvod: 'Volební obvod č. 33 - Děčín',
        oblastExpertizy: 'Architekt',
        foto: '/assets/candidates/support/miroslav_stross.jpg',
        href: 'https://miroslav.zeleni.cz/?utm_source=programydovoleb.cz',
        perex: 'Projektuje domy, které mají vydržet desítky let. Práce s místními obyvateli, městem a krajinou ho naučila, že kvalitní prostředí začíná u rozhodnutí obce, regionu a státu.',
    },
    {
        slug: 'ivana-hlustikova',
        jmeno: 'Ivana Hluštíková',
        obvod: 'Volební obvod č. 6 - Louny',
        oblastExpertizy: 'Vychovatelka a zastupitelka Loun',
        foto: '/assets/candidates/support/ivana_hlustikova.jpg',
        href: 'https://ivana.zeleni.cz/',
        perex: 'Celý profesní život pracuje ve školství a věří, že politika má být službou veřejnosti. Vzdělávání, rodina, péče o slabší, voda v krajině i zdravé životní prostředí pro ni tvoří jeden celek.',
    },
    {
        slug: 'adela-sucharda-sipova',
        jmeno: 'Adéla Sucharda Šípová',
        obvod: 'Volební obvod č. 30 - Kladno',
        oblastExpertizy: 'Senátorka a advokátka',
        foto: '/assets/candidates/support/adela_sipova.JPG',
        href: 'https://www.adelasipova.cz/',
        perex: 'Jako senátorka prosazuje dostupnost bydlení, lepší ochranu obětí násilí, silnější postavení občanů při rozhodování i spravedlivější pravidla pro lidi v dluhové pasti.',
    },
];

export const senatPriority2026 = [
    {
        ikona: 'ic:baseline-volunteer-activism',
        nazev: 'Rodina a péče',
        popis: 'Legislativní podpora pro pečující osoby, dostupné školky a reforma systému sociálních služeb.',
        body: ['Garantovaná místa v jeslích', 'Podpora zkrácených úvazků', 'Pečovatelský příspěvek pro blízké'],
    },
    {
        ikona: 'ic:baseline-balance',
        nazev: 'Spravedlnost',
        popis: 'Nulová tolerance domácímu násilí a posílení práv obětí v soudním systému.',
        body: ['Reforma definice znásilnění', 'Dostupná právní pomoc', 'Specializované soudy pro domácí násilí'],
    },
    {
        ikona: 'ic:baseline-eco',
        nazev: 'Budoucnost',
        popis: 'Ochrana pitné vody a krajiny jako základní bezpečnostní priority státu.',
        body: ['Ústavní ochrana vody', 'Lokální energetická soběstačnost', 'Zelená infrastruktura v obcích'],
    },
    {
        ikona: 'ic:baseline-local-hospital',
        nazev: 'Zdravotnictví',
        popis: 'Dostupná a důstojná zdravotní péče pro každého bez ohledu na místo bydliště.',
        body: ['Lékaři do regionů', 'Podpora duševního zdraví', 'Preventivní prohlídky zdarma'],
    },
    {
        ikona: 'ic:baseline-school',
        nazev: 'Vzdělávání',
        popis: 'Rovné příležitosti ve vzdělávání a podpora učitelů jako klíčové profese.',
        body: ['Snížení nerovností ve školách', 'Důstojné platové ohodnocení učitelů', 'Inkluzivní vzdělávání'],
    },
];
