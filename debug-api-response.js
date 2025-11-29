async function debugApi() {
    try {
        console.log('Fetching from API...');
        const response = await fetch('http://localhost:3000/api/admin/enrollments');

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const json = await response.json();
        console.log('API Response Status: OK');

        if (json.data) {
            console.log(`Received ${json.data.length} enrollments`);

            if (json.debug) {
                console.log('DEBUG INFO:');
                console.log(JSON.stringify(json.debug, null, 2));
            }

            const withParticipant = json.data.filter(e => e.participant).length;
            const withoutParticipant = json.data.filter(e => !e.participant).length;

            console.log(`With participant: ${withParticipant}`);
            console.log(`Without participant: ${withoutParticipant}`);

            if (withParticipant > 0) {
                const sample = json.data.find(e => e.participant);
                console.log('Sample with participant:', sample.participant.name || sample.participant.full_name);
            }
        } else {
            console.log('No data in response');
            console.log(json);
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

debugApi();
