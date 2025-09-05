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
    {
        label: 'Volební účet',
        purpose: 'Financování volební kampaně',
        number: '2403303750/2010',
        iban: null,
        type: 'election',
        transparent: true,
        bankUrl: 'https://ib.fio.cz/ib/transparent?a=2403303750',
        note: 'Financování kampaně hnutí.'
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
