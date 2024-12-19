async function initContentful() {
    try {
        console.log('Waiting for configuration...');
        while (!window.CONFIG) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const config = window.getConfig();
        console.log('Using configuration:', {
            spaceId: config.CONTENTFUL_SPACE_ID,
            tokenLength: config.CONTENTFUL_ACCESS_TOKEN ? config.CONTENTFUL_ACCESS_TOKEN.length : 0
        });

        if (!config.CONTENTFUL_SPACE_ID || !config.CONTENTFUL_ACCESS_TOKEN) {
            throw new Error('Invalid configuration');
        }

        console.log('Creating Contentful client...');
        const client = contentful.createClient({
            space: config.CONTENTFUL_SPACE_ID,
            accessToken: config.CONTENTFUL_ACCESS_TOKEN
        });

        await loadCorsoDetail(client);
    } catch (error) {
        console.error('Error initializing Contentful:', error);
        document.querySelector('.event-detail-container').innerHTML = 
            `<div class="error-message">Error loading corso: ${error.message}</div>`;
    }
}

async function loadCorsoDetail(client) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const corsoId = urlParams.get('id');

        if (!corsoId) {
            window.location.href = '/corsi';
            return;
        }

        console.log('Fetching corso details for:', corsoId);
        const entry = await client.getEntry(corsoId);
        console.log('Corso data received:', entry.fields.nomeCorso);
        
        displayCorso(entry);
    } catch (error) {
        console.error('Error loading corso:', error);
        document.querySelector('.event-detail-container').innerHTML = 
            `<div class="error-message">Error loading corso: ${error.message}</div>`;
    }
}

function displayCorso(corso) {
    console.log('Displaying corso:', corso.fields.nomeCorso);
    
    // Set page title
    document.title = `${corso.fields.nomeCorso} - Circolo dei Cerchi`;

    // Set hero image if exists
    if (corso.fields.immagine) {
        const imageUrl = corso.fields.immagine.fields.file.url;
        document.querySelector('.event-detail-image').innerHTML = `
            <img src="https:${imageUrl}" alt="${corso.fields.nomeCorso}">
        `;
    }

    // Set corso title
    document.querySelector('.event-detail-heading').textContent = corso.fields.nomeCorso;

    // Set metadata with clickable venue
    document.querySelector('.event-detail-venue').innerHTML = corso.fields.venueLocation ? 
        `<a href="${corso.fields.venueLocation}" target="_blank" rel="noopener noreferrer">${corso.fields.venue}</a>` : 
        corso.fields.venue;
    
    // Format date
    const date = new Date(corso.fields.dataInizio);
    document.querySelector('.event-detail-date').textContent = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Set description if exists
    if (corso.fields.descrizione) {
        const formattedDescription = corso.fields.descrizione
            // Convert markdown links to HTML
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Convert newlines to <br>
            .replace(/\n/g, '<br>');
            
        document.querySelector('.event-detail-description').innerHTML = formattedDescription;
    }

    console.log('Corso display complete');
}

document.addEventListener('DOMContentLoaded', initContentful);