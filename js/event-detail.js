const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
});

async function loadEventDetail() {
    // Get event ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
        window.location.href = '/calendar.html';
        return;
    }

    try {
        const entry = await client.getEntry(eventId);
        displayEvent(entry);
    } catch (error) {
        console.error('Error loading event:', error);
    }
}

function displayEvent(event) {
    // Set page title
    document.title = `${event.fields.eventName} - Circolo dei Cerchi`;

    // Set hero image if exists
    if (event.fields.image) {
        const imageUrl = event.fields.image.fields.file.url;
        document.querySelector('.event-detail-image').innerHTML = `
            <img src="https:${imageUrl}" alt="${event.fields.eventName}">
        `;
    }

    // Set event title
    document.querySelector('.event-detail-heading').textContent = event.fields.eventName;

    // Set metadata with clickable venue
    document.querySelector('.event-detail-venue').innerHTML = event.fields.venueLocation ? 
        `<a href="${event.fields.venueLocation}" target="_blank" rel="noopener noreferrer">${event.fields.venue}</a>` : 
        event.fields.venue;
    
    // Format date
    const date = new Date(event.fields.eventDate);
    document.querySelector('.event-detail-date').textContent = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    if (event.fields.eventDetail) {
        document.querySelector('.event-detail-lineup').textContent = event.fields.eventDetail;
    }

    if (event.fields.eventTime) {
        document.querySelector('.event-detail-time').textContent = event.fields.eventTime;
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
}

document.addEventListener('DOMContentLoaded', loadEventDetail);