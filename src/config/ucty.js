export const accounts = [
    {
        label: 'Hlavní účet',
        purpose: 'Provoz, členské příspěvky',
        number: '2803303733/2010',
        iban: null,
        type: 'primary',
        transparent: false,
        bankUrl: null,
        note: 'Do poznámky uveď “Příspěvek – jméno a”'
    },
    /* {
         label: 'Volební účet PS 2025',
         purpose: 'Financování volební kampaně',
         number: '2403303750/2010',
         iban: null,
         type: 'election',
         closed: true,
         transparent: true,
         bankUrl: 'https://ib.fio.cz/ib/transparent?a=2403303750',
         note: 'Financování kampaně hnutí.'
     },*/
    {
        label: 'Volební účet Senát 2026',
        purpose: 'Financování volební kampaně',
        number: '2503455583/2010',
        iban: null,
        type: 'election',
        closed: false,
        transparent: true,
        bankUrl: 'https://ib.fio.cz/ib/transparent?a=2503455583',
        note: 'Financování kampaně hnutí ve volbách do Senátu české republiky.'
    },
    {
        label: 'Volební účet Komunál 2026',
        purpose: 'Financování volební kampaně',
        number: '2903455582/2010',
        iban: null,
        type: 'election',
        closed: false,
        transparent: true,
        bankUrl: 'https://ib.fio.cz/ib/transparent?a=2903455582',
        note: 'Financování kampaně hnutí ve volbách do komunálních zastupitelstev.'
    },
    {
        label: 'Dárcovský účet',
        purpose: 'Veřejné dary a podpora',
        number: '2003303743/2010',
        iban: null,
        type: 'donations',
        transparent: true,
        bankUrl: 'https://ib.fio.cz/ib/transparent?a=2003303743',
        note: 'Podpora činnosti hnutí.'
    }
];
