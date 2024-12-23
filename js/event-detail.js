async function initContentful() {
    try {
        // console.log('Waiting for configuration...');
        while (!window.CONFIG) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const config = window.getConfig();
        // console.log('Using configuration:', {
        //     spaceId: config.CONTENTFUL_SPACE_ID,
        //     tokenLength: config.CONTENTFUL_ACCESS_TOKEN ? config.CONTENTFUL_ACCESS_TOKEN.length : 0
        // });

        if (!config.CONTENTFUL_SPACE_ID || !config.CONTENTFUL_ACCESS_TOKEN) {
            throw new Error('Invalid configuration');
        }

        // console.log('Creating Contentful client...');
        const client = contentful.createClient({
            space: config.CONTENTFUL_SPACE_ID,
            accessToken: config.CONTENTFUL_ACCESS_TOKEN
        });

        await loadEventDetail(client);
    } catch (error) {
        console.error('Error initializing Contentful:', error);
        document.querySelector('.event-detail-container').innerHTML = 
            `<div class="error-message">Error loading event: ${error.message}</div>`;
    }
}

async function loadEventDetail(client) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (!eventId) {
            window.location.href = '/calendar.html';
            return;
        }

        // console.log('Fetching event details for:', eventId);
        const entry = await client.getEntry(eventId);
        // console.log('Event data received:', entry.fields.eventName);
        
        displayEvent(entry);
    } catch (error) {
        console.error('Error loading event:', error);
        document.querySelector('.event-detail-container').innerHTML = 
            `<div class="error-message">Error loading event: ${error.message}</div>`;
    }
}

function displayEvent(event) {
    // Set page title
    document.title = `${event.fields.eventName} - Circolo dei Cerchi`;

    // Set hero image if exists
    if (event.fields.image) {
        const baseUrl = `https:${event.fields.image.fields.file.url}`;
        // Create responsive image versions
        const mobileImage = `${baseUrl}?w=390&h=380&fm=webp&q=80`;
        const desktopImage = `${baseUrl}?w=1320&h=450&fm=webp&q=80`;
        const imagePosition = event.fields.imagePositionStart || 'center';

        document.querySelector('.event-detail-image').innerHTML = `
            <img srcset="${mobileImage} 390w,
                        ${desktopImage} 1320w"
                 sizes="(max-width: 768px) 390px,
                        1320px"
                 src="${desktopImage}"
                 alt="${event.fields.eventName}"
                 width="1320"
                 height="450"
                 loading="eager"
                 style="object-position: center ${imagePosition}"
                 decoding="async">
        `;
    }

    // Set event title
    document.querySelector('.event-detail-heading').textContent = event.fields.eventName;

    // Set metadata with icons
    const venueIcon = 'https://images.ctfassets.net/evaxoo3zkmhs/3a2qMfTcYw7FVpenWtIUbA/18f2ea5eab6c876b5eee067dcc33e919/pin_814232.png';
    const dateIcon = 'https://images.ctfassets.net/evaxoo3zkmhs/3dVwo9oUhdy03n0GxenUgc/9d0a258e63c6f4fe1f0f6790583e44f4/calendar_814025.png';
    const timeIcon = 'https://images.ctfassets.net/evaxoo3zkmhs/48Z4ILzdzxgLGQ0HVXS8l2/e0e2debff0dfdee14902221154ed4e4a/wall-clock_814045.png';
    const lineupIcon = 'https://images.ctfassets.net/evaxoo3zkmhs/3a2qMfTcYw7FVpenWtIUbA/18f2ea5eab6c876b5eee067dcc33e919/pin_814232.png';

    // Set venue with icon
    document.querySelector('.event-detail-venue').innerHTML = `
        <img src="${venueIcon}" alt="Venue" width="24" height="24">
        ${event.fields.venueLocation ? 
            `<a href="${event.fields.venueLocation}" target="_blank" rel="noopener noreferrer">${event.fields.venue}</a>` : 
            event.fields.venue}`;
    
    // Format date with icon
    const date = new Date(event.fields.eventDate);
    document.querySelector('.event-detail-date').innerHTML = `
        <img src="${dateIcon}" alt="Date" width="24" height="24">
        ${date.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })}`;

    // Set lineup with icon
    if (event.fields.eventDetail) {
        document.querySelector('.event-detail-lineup').innerHTML = `
            <img src="${lineupIcon}" alt="Lineup" width="24" height="24">
            ${event.fields.eventDetail}`;
    }

    // Set time with icon
    if (event.fields.eventTime) {
        document.querySelector('.event-detail-time').innerHTML = `
            <img src="${timeIcon}" alt="Time" width="24" height="24">
            ${event.fields.eventTime}`;
    }

    // Set description if exists
    if (event.fields.description) {
        const formattedDescription = event.fields.description
            // Convert markdown links to HTML
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Convert newlines to <br>
            .replace(/\n/g, '<br>');
            
        document.querySelector('.event-detail-description').innerHTML = formattedDescription;
    }

    // console.log('Event display complete');
}

document.addEventListener('DOMContentLoaded', initContentful);