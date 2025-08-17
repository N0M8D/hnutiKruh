import type { APIRoute } from 'astro';

// Clean, normalized interface for our application
export interface Candidate {
    id: string;
    firstName: string;
    lastName: string;
    position: number;
    region: string;
    gender: string;
    age: number;
    residence: string;
    party: string;
    occupation: string;
    titleBefore: string;
    titleAfter: string;
    fullName: string; // Computed property with proper formatting
    photo: string;
    detail: boolean;
}

export interface CandidatesResponse {
    list: Candidate[];
    pageInfo: {
        totalRows: number;
        page: number;
        pageSize: number;
        isFirstPage: boolean;
        isLastPage: boolean;
    };
}

// Map region codes to full region names used in the database
const regionCodeMapping: Record<string, string> = {
    'praha': 'Praha',
    'sck': 'Středočeský',
    'jmk': 'Jihomoravský',
};

export const GET: APIRoute = async ({ url }) => {
    // Extract query parameters
    const regionCode = url.searchParams.get('region');
    const limit = url.searchParams.get('limit') || '25';
    const offset = url.searchParams.get('offset') || '0';

    // Build the base URL for the NocoDB API
    const baseUrl = 'https://nocodb.czechnomad.cz/api/v2/tables/mitbbbchplvqq1r/records';

    // Add query parameters
    let apiUrl = `${baseUrl}?offset=${offset}&limit=${limit}&viewId=vwqdqrq7lv43xe27`;

    // Map region code to full name if provided
    let krajFilter = null;
    if (regionCode && regionCodeMapping[regionCode]) {
        krajFilter = regionCodeMapping[regionCode];
    } else if (regionCode) {
        // If direct kraj name was provided (fallback)
        krajFilter = regionCode;
    }

    // Add where clause if region is specified
    if (krajFilter) {
        // Use NocoDB's documented where syntax with quoted column name for spaces
        const whereCondition = encodeURIComponent(`(Kraj,eq,${krajFilter})`);
        apiUrl += `&where=${whereCondition}`;
    }

    // API request options with token from environment variable
    const options = {
        method: 'GET',
        headers: {
            'xc-token': import.meta.env.PUBLIC_NOCODB_TOKEN || '',
        },
    };

    try {
        console.log(`Fetching candidates from: ${apiUrl}`);

        // Use native fetch with full URL
        const response = await fetch(apiUrl, options);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Transform the raw data to our clean interface
        const transformedData = {
            list: (data.list || []).map((raw: any) => {
                const firstName = raw.Jméno || '';
                const lastName = raw.Příjmení || '';
                const titleBefore = raw["Titul Před"].replaceAll('-', '') || '';
                const titleAfter = raw["Titul za"].replaceAll('-', '') || '';
                const photo = raw.photo || false;
                const detail = raw.detail || false;
                // Create a properly formatted full name
                let fullName = '';
                if (titleBefore) fullName += titleBefore + ' ';
                fullName += firstName + ' ' + lastName;
                if (titleAfter) fullName += ', ' + titleAfter;

                return {
                    id: raw.id,
                    firstName,
                    lastName,
                    position: raw["Pořadí na kandidátce PS2025"],
                    region: raw["Kraj kand. listiny"],
                    gender: raw.Pohlaví,
                    age: raw["Věk (k 3.10.2025)"],
                    residence: raw["Obec trvalého bydliště"],
                    party: raw["Politická příslušnost (k 3.10.2025)"],
                    occupation: raw.Povolání,
                    titleBefore,
                    titleAfter,
                    fullName,
                    photo,
                    detail
                };
            }),
            pageInfo: data.pageInfo
        };

        return new Response(JSON.stringify(transformedData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error fetching candidates data:', error);

        // Return empty list instead of error to make it more resilient
        return new Response(
            JSON.stringify({
                list: [],
                pageInfo: {
                    totalRows: 0,
                    page: 1,
                    pageSize: parseInt(limit),
                    isFirstPage: true,
                    isLastPage: true
                },
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
};
