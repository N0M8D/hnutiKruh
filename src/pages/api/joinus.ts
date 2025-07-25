import type { APIRoute } from 'astro';

interface InvolvementFormData {
    Jmeno: string;
    Prijmeni: string;
    Email: string;
    Telefon: string;
    meetingDate: string;
    newsletter: boolean;
    gdprConsent: boolean;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const data: InvolvementFormData = {
            Jmeno: formData.get('Jmeno') as string,
            Prijmeni: formData.get('Prijmeni') as string,
            Email: formData.get('Email') as string,
            Telefon: formData.get('Telefon') as string,
            meetingDate: formData.get('meetingDate') as string,
            newsletter: formData.get('newsletter') === 'true',
            gdprConsent: formData.get('gdprConsent') === 'true'
        };

        // 1. Create Redmine ticket
        await createRedmineTicket(data);

        // 2. If newsletter subscription requested, subscribe user
        if (data.newsletter) {
            await subscribeToNewsletter(data);
        }

        return new Response(JSON.stringify({
            message: 'Formulář byl úspěšně odeslán'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            message: 'Došlo k chybě při zpracování formuláře'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};

async function createRedmineTicket(data: InvolvementFormData) {
    // TODO: Implement Redmine API call
    // Example:
    // const response = await fetch('YOUR_REDMINE_API_URL', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Redmine-API-Key': 'YOUR_API_KEY'
    //   },
    //   body: JSON.stringify({
    //     issue: {
    //       project_id: 'YOUR_PROJECT_ID',
    //       subject: `Nový zájemce o zapojení: ${data.Jmeno} ${data.Prijmeni}`,
    //       description: `
    //         Jméno: ${data.Jmeno}
    //         Příjmení: ${data.Prijmeni}
    //         Email: ${data.Email}
    //         Telefon: ${data.Telefon}
    //         Termín schůzky: ${new Date(data.meetingDate).toLocaleString('cs-CZ')}
    //       `
    //     }
    //   })
    // });
}

async function subscribeToNewsletter(data: InvolvementFormData) {
    // Reuse existing newsletter subscription logic
    /*const response = await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        Jmeno: data.Jmeno,
        Prijmeni: data.Prijmeni,
        Email: data.Email
      })
    });
    return response.json();*/
}