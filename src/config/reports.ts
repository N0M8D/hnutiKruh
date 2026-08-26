// Metadata k souborům v public/assets/docs/reports (výroční zprávy apod.).
// `file` musí přesně odpovídat jménu souboru ve složce. Soubor, který ve složce
// je, ale tady zapsaný není, se stejně zobrazí - jen s titulkem odvozeným z jeho
// jména (viz src/pages/financovani/index.astro), takže tenhle seznam je čistě
// pro hezčí popisky, ne povinná evidence.
export interface ReportMeta {
    file: string;
    title: string;
    year?: number;
    description?: string;
}

export const reports: ReportMeta[] = [
    {
        file: 'Vyrocni_financni_zprava_politicke_hnuti_Kruh_za_rok_2025.pdf',
        title: 'Výroční finanční zpráva za rok 2025',
        year: 2025
    },
    {
        file: 'zprava_za_financovani_voleb_2025.pdf',
        title: 'Zpráva o financování voleb 2025',
        year: 2025
    }
];
