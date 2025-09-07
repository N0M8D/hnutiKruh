const ICS_URL = 'https://calendar.google.com/calendar/ical/e3b2ccf24db663a33c6a14b19f6b3691354919608f197b799747719d14f943b9%40group.calendar.google.com/public/basic.ics';

interface ParsedEvent {
    start: Date;
    end: Date;
    summary: string;
    location?: string;
    allDay: boolean;
}

interface PublicEvent {
    date: string;         // "21. 08." nebo "21. 08. - 24. 08."
    description: string;  // summary
    googleMaps?: string;  // odkaz pokud location
}

declare global {
    // eslint-disable-next-line no-var
    var __calendarCache: { ts: number; events: PublicEvent[] } | undefined;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minut

function unfoldLines(raw: string): string[] {
    const lines = raw.split(/\r?\n/);
    const out: string[] = [];
    for (const line of lines) {
        if (!line) continue;
        if (line.startsWith(' ') && out.length) {
            out[out.length - 1] += line.slice(1);
        } else {
            out.push(line);
        }
    }
    return out;
}

function parseDate(value: string): Date {
    // All-day (YYYYMMDD)
    if (/^\d{8}$/.test(value)) {
        const y = Number(value.slice(0, 4));
        const m = Number(value.slice(4, 6)) - 1;
        const d = Number(value.slice(6, 8));
        return new Date(Date.UTC(y, m, d));
    }
    // Date-time with Z or local
    // Example: 20240912T130000Z
    const iso = value.endsWith('Z')
        ? value.replace(
            /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
            '$1-$2-$3T$4:$5:$6Z'
        )
        : value.replace(
            /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/,
            '$1-$2-$3T$4:$5:$6'
        );
    return new Date(iso);
}

function toDM(d: Date): string {
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${day}. ${month}.`;
}

// Přidáno: formátování s časem v CZ a TZ Europe/Prague
const TZ = 'Europe/Prague';
function dmLocal(d: Date): string {
    const dayRaw = new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', timeZone: TZ }).format(d);
    const monthRaw = new Intl.DateTimeFormat('cs-CZ', { month: '2-digit', timeZone: TZ }).format(d);
    const day = dayRaw.replace(/\D/g, '').padStart(2, '0');
    const month = monthRaw.replace(/\D/g, '').padStart(2, '0');
    return `${day}.${month}.`; // přidána tečka za měsícem
}
function hhmmLocal(d: Date): string {
    return new Intl.DateTimeFormat('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: TZ
    }).format(d);
}
function formatEventLabel(ev: ParsedEvent): string {
    const start = ev.start;
    const endAdj = ev.allDay ? new Date(ev.end.getTime() - 24 * 60 * 60 * 1000) : ev.end;

    const sameDay =
        start.getUTCFullYear() === endAdj.getUTCFullYear() &&
        start.getUTCMonth() === endAdj.getUTCMonth() &&
        start.getUTCDate() === endAdj.getUTCDate();

    if (sameDay) {
        if (ev.allDay) {
            return `${dmLocal(start)} celý den`;
        }
        return `${dmLocal(start)} ${hhmmLocal(start)} - ${hhmmLocal(endAdj)}`;
    } else {
        if (ev.allDay) {
            return `${dmLocal(start)} - ${dmLocal(endAdj)} celý den`;
        }
        return `${dmLocal(start)} ${hhmmLocal(start)} - ${dmLocal(endAdj)} ${hhmmLocal(endAdj)}`;
    }
}

// Pomocná funkce: vrátí první URL v textu (pokud existuje), jinak undefined
function extractUrlFromText(text: string | undefined): string | undefined {
    if (!text) return undefined;
    const match = text.match(/https?:\/\/\S+/i);
    return match ? match[0] : undefined;
}

function parseIcs(text: string): ParsedEvent[] {
    const lines = unfoldLines(text);
    const events: ParsedEvent[] = [];
    let cur: any = null;

    for (const line of lines) {
        if (line === 'BEGIN:VEVENT') {
            cur = {};
            continue;
        }
        if (line === 'END:VEVENT') {
            if (cur.DTSTART && cur.DTEND && cur.SUMMARY) {
                const allDay = cur.DTSTART.length === 8; // YYYYMMDD
                events.push({
                    start: parseDate(cur.DTSTART),
                    // ICS all-day end je exclusive -> parser to řeší ve formatRange
                    end: parseDate(cur.DTEND),
                    summary: cur.SUMMARY,
                    location: cur.LOCATION,
                    allDay
                });
            }
            cur = null;
            continue;
        }
        if (!cur) continue;
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const rawKey = line.slice(0, idx);
        const value = line.slice(idx + 1).trim();
        const key = rawKey.split(';')[0]; // odstraníme parametry (DTSTART;VALUE=DATE)
        if (key === 'DTSTART' || key === 'DTEND') {
            cur[key] = value;
        } else if (key === 'SUMMARY' || key === 'LOCATION') {
            cur[key] = value;
        }
    }
    return events;
}

export async function fetchCalendarEvents(limit = 10): Promise<PublicEvent[]> {
    // Cache
    if (
        globalThis.__calendarCache &&
        Date.now() - globalThis.__calendarCache.ts < CACHE_TTL_MS
    ) {
        return globalThis.__calendarCache.events;
    }

    let text: string;
    try {
        const res = await fetch(ICS_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('ICS fetch failed ' + res.status);
        text = await res.text();
    } catch (e) {
        console.warn('Calendar fetch error:', e);
        return [];
    }

    const parsed = parseIcs(text);

    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    const upcoming = parsed
        .filter(ev => ev.end >= todayUTC)
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, limit)
        .map<PublicEvent>(ev => {
            const date = formatEventLabel(ev);
            const description = ev.summary;
            // pokud LOCATION obsahuje URL, použij ji; jinak link na Google Maps search z textu
            const direct = extractUrlFromText(ev.location);
            const googleMaps = direct
                ? direct
                : ev.location
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`
                    : undefined;
            return { date, description, googleMaps };
        });

    globalThis.__calendarCache = {
        ts: Date.now(),
        events: upcoming
    };

    return upcoming;
}

// Nové: všechny eventy v následujících N dnech (default 30)
export async function fetchCalendarEventsNextDays(days = 30): Promise<PublicEvent[]> {
    // Reuse existing cached result (fetch without limit to get raw upcoming base)
    const base = await fetchCalendarEvents(500); // větší limit, aby bylo z čeho filtrovat
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowEnd = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    // base už má jen budoucí (podle end), potřebujeme znovu načíst detail? base nemá start/end -> nutné uchovat raw parsed? => fallback:
    // Rychlá úprava: načteme znovu a filtrujeme z parsed (bez duplicity kódu)
    let text: string;
    try {
        const res = await fetch(ICS_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('ICS fetch failed ' + res.status);
        text = await res.text();
    } catch {
        return [];
    }
    const parsed = parseIcs(text);

    const windowEvents = parsed
        .filter(ev => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const windowEnd = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
            return ev.end >= today && ev.start < windowEnd;
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map<PublicEvent>(ev => {
            const date = formatEventLabel(ev);
            const description = ev.summary;
            const direct = extractUrlFromText(ev.location);
            const googleMaps = direct
                ? direct
                : ev.location
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`
                    : undefined;
            return { date, description, googleMaps };
        });
    return windowEvents;
}
