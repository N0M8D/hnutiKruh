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

export const senatPriority2026 = [
    {
        ikona: 'ic:baseline-home',
        nazev: 'Dostupný a důstojný život',
        popis: 'Bydlení, zdravotní a sociální péče ani psychologická pomoc nesmí být luxusem, ale základem důstojného života pro každého.',
        body: [
            'Prevence ztráty bydlení a rozumný rozvoj obecního a družstevního bydlení',
            'Dostupnější zdravotní, sociální a psychologická péče pro rodiny, seniory i mladé lidi',
            'Férovější podmínky pro pečující o děti, seniory a nemocné členy rodiny',
        ],
    },
    {
        ikona: 'ic:baseline-volunteer-activism',
        nazev: 'Silné komunity a vzdělání',
        popis: 'Dobrá společnost vzniká tam, kde lidé mohou ovlivňovat své okolí a školy jsou místem bezpečí, důvěry a příležitostí.',
        body: [
            'Stabilní financování škol a školek',
            'Větší důraz na školní psychology, učitele a moderní výuku',
            'Propojování škol, spolků, kultury, sportu a sousedského života',
        ],
    },
    {
        ikona: 'ic:baseline-directions-bike',
        nazev: 'Bezpečí, klima a odpovědný rozvoj',
        popis: 'Bezpečný veřejný prostor, kvalitní životní prostředí a rozvoj měst musí jít ruku v ruce s dopravou, službami a prevencí.',
        body: [
            'Bezpečný pohyb městem pro chodce, cyklisty i uživatele veřejné dopravy',
            'Více zeleně, ochrana vody a podpora biodiverzity jako součást každodenní kvality života',
            'Rozvoj bydlení společně se školami, službami, dopravou a dobře udržovaným veřejným prostorem',
        ],
    },
    {
        ikona: 'ic:baseline-bar-chart',
        nazev: 'Férová práce a odměňování',
        popis: 'Lidé mají být odměňováni podle práce, zkušeností a výkonu, ne podle pohlaví, věku nebo jiných okolností.',
        body: [
            'Transparentnější a srozumitelnější pravidla odměňování',
            'Hledání účinných nástrojů, které opravdu zmenšují mzdové nerovnosti',
            'Férové podmínky pro zaměstnance i jasná pravidla pro zaměstnavatele',
        ],
    },
    {
        ikona: 'ic:baseline-balance',
        nazev: 'Spravedlivé daně a odpovědný stát',
        popis: 'Stát musí hlídat dopady zákonů, odpovědně nakládat s veřejnými penězi a nastavit daňový systém spravedlivěji vůči práci i majetku.',
        body: [
            'Nižší zdanění práce, zvlášť u nízkopříjmových lidí',
            'Vyšší zdanění superbohatých a progresivnější přístup k majetku a spekulativnímu vlastnictví',
            'Důsledná kontrola dopadů zákonů a veřejných výdajů na běžný život lidí i obcí',
        ],
    },
];
