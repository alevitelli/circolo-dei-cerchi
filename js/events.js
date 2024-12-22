let client;

async function initContentful() {
    try {
        // console.log('Waiting for configuration...');
        while (!window.CONFIG) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const config = window.getConfig();
        // // console.log('Using configuration:', {
        //     spaceId: config.CONTENTFUL_SPACE_ID,
        //     tokenLength: config.CONTENTFUL_ACCESS_TOKEN ? config.CONTENTFUL_ACCESS_TOKEN.length : 0
        // });

        if (!config.CONTENTFUL_SPACE_ID || !config.CONTENTFUL_ACCESS_TOKEN) {
            throw new Error('Invalid configuration');
        }

        // console.log('Creating Contentful client...');
        client = contentful.createClient({
            space: config.CONTENTFUL_SPACE_ID,
            accessToken: config.CONTENTFUL_ACCESS_TOKEN
        });

        // Initialize the calendar
        await loadEvents();
    } catch (error) {
        console.error('Error initializing Contentful:', error);
        document.querySelector('.calendar-events').innerHTML = 
            `<div class="error-message">Error loading events: ${error.message}</div>`;
    }
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    }).toUpperCase();
}

// Function to create event HTML
function createEventHTML(event) {
    // console.log('Creating HTML for event:', event.fields.eventName);
    
    const venueDisplay = event.fields.venueLocation ? 
        `<a href="${event.fields.venueLocation}" target="_blank" rel="noopener noreferrer">${event.fields.venue}</a>` : 
        event.fields.venue;

    return `
        <article class="calendar-event">
            <div class="event-details">
                <div class="venue-date">
                    <span class="venue">${venueDisplay}</span>
                    <span class="divider-calendar">•</span>
                    <span class="date">${formatDate(event.fields.eventDate)}</span>
                    ${event.fields.eventTime ? `
                        <span class="divider-calendar">•</span>
                        <span class="time">${event.fields.eventTime}</span>
                    ` : ''}
                </div>
                <h2 class="event-name">${event.fields.eventName}</h2>
                <div class="lineup">${event.fields.eventDetail || ''}</div>
            </div>
            <a href="/event?id=${event.sys.id}" class="calendar-cta">SCOPRI DI PIU'</a>
        </article>
    `;
}

// Function to get month and year from date string
function getMonthYear(dateString) {
    const date = new Date(dateString);
    return {
        month: date.toLocaleString('it-IT', { month: 'long' }).toUpperCase(),
        year: date.getFullYear()
    };
}

// Function to check if date is in specific month and year
function isInMonthYear(dateString, month, year) {
    const date = new Date(dateString);
    return date.getFullYear() === parseInt(year) && 
           date.toLocaleString('it-IT', { month: 'long' }).toUpperCase() === month;
}

// Function to populate filter options
function populateFilterOptions(events) {
    const filterSelect = document.querySelector('.time-filter');
    const months = new Set();
    
    filterSelect.innerHTML = '<option value="UPCOMING">UPCOMING</option>';
    
    events.forEach(event => {
        const { month, year } = getMonthYear(event.fields.eventDate);
        months.add(`${month} ${year}`);
    });
    
    [...months].sort().forEach(monthYear => {
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = monthYear;
        filterSelect.appendChild(option);
    });
}

// Load events function
async function loadEvents() {
    try {
        // console.log('Fetching all events...');
        const response = await client.getEntries({
            content_type: 'calendarEvent',
            order: 'fields.eventDate'
        });

        // console.log(`Received ${response.items.length} events`);
        
        const eventsContainer = document.querySelector('.calendar-events');
        eventsContainer.innerHTML = '';
        
        populateFilterOptions(response.items);
        
        response.items.forEach(event => {
            eventsContainer.innerHTML += createEventHTML(event);
        });

    } catch (error) {
        console.error('Error fetching events:', error);
        document.querySelector('.calendar-events').innerHTML = 
            `<div class="error-message">Error loading events: ${error.message}</div>`;
    }
}

// Filter events function
async function filterEvents(timeFrame) {
    try {
        // console.log('Filtering events for:', timeFrame);
        const response = await client.getEntries({
            content_type: 'calendarEvent',
            order: 'fields.eventDate'
        });

        const eventsContainer = document.querySelector('.calendar-events');
        eventsContainer.innerHTML = '';

        const filteredEvents = response.items.filter(event => {
            if (timeFrame === 'UPCOMING') {
                return new Date(event.fields.eventDate) >= new Date();
            } else {
                const [month, year] = timeFrame.split(' ');
                return isInMonthYear(event.fields.eventDate, month, parseInt(year));
            }
        });

        // console.log(`Showing ${filteredEvents.length} events`);
        filteredEvents.forEach(event => {
            eventsContainer.innerHTML += createEventHTML(event);
        });

    } catch (error) {
        console.error('Error filtering events:', error);
        document.querySelector('.calendar-events').innerHTML = 
            `<div class="error-message">Error filtering events: ${error.message}</div>`;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initContentful);

// Add event listener for filter
document.querySelector('.time-filter').addEventListener('change', (e) => {
    filterEvents(e.target.value);
});

// In your existing createEventCard function, update the button:
function createEventCard(event) {
    // ... existing code ...
    
    return `
        <div class="event-card">
            ${imageHtml}
            <div class="event-info">
                <h3>${event.fields.eventName}</h3>
                <p>${event.fields.venue}</p>
                <p>${formattedDate}</p>
                <a href="/event.html?id=${event.sys.id}" class="button">More Info</a>
            </div>
        </div>
    `;
}