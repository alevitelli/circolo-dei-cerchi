let client;

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
        client = contentful.createClient({
            space: config.CONTENTFUL_SPACE_ID,
            accessToken: config.CONTENTFUL_ACCESS_TOKEN
        });

        await loadCorsi();
    } catch (error) {
        console.error('Error initializing Contentful:', error);
        document.querySelector('.calendar-events').innerHTML = 
            `<div class="error-message">Error loading corsi: ${error.message}</div>`;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    }).toUpperCase();
}

function createCorsoHTML(corso) {
    console.log('Creating HTML for corso:', corso.fields.nomeCorso);
    
    const venueDisplay = corso.fields.venueLocation ? 
        `<a href="${corso.fields.venueLocation}" target="_blank" rel="noopener noreferrer">${corso.fields.venue}</a>` : 
        corso.fields.venue;

    return `
        <article class="calendar-event">
            <div class="event-details">
                <div class="venue-date">
                    <span class="venue">${venueDisplay}</span>
                    <span class="divider-calendar">•</span>
                    <span class="date">${formatDate(corso.fields.dataInizio)}</span>
                </div>
                <h2 class="event-name">${corso.fields.nomeCorso}</h2>
            </div>
            <a href="/corso-event?id=${corso.sys.id}" class="calendar-cta">SCOPRI DI PIU'</a>
        </article>
    `;
}

function getMonthYear(dateString) {
    const date = new Date(dateString);
    return {
        month: date.toLocaleString('it-IT', { month: 'long' }).toUpperCase(),
        year: date.getFullYear()
    };
}

function isInMonthYear(dateString, month, year) {
    const date = new Date(dateString);
    return date.getFullYear() === parseInt(year) && 
           date.toLocaleString('it-IT', { month: 'long' }).toUpperCase() === month;
}

function populateFilterOptions(corsi) {
    const filterSelect = document.querySelector('.time-filter');
    const months = new Set();
    
    filterSelect.innerHTML = '<option value="UPCOMING">UPCOMING</option>';
    
    corsi.forEach(corso => {
        const { month, year } = getMonthYear(corso.fields.dataInizio);
        months.add(`${month} ${year}`);
    });
    
    [...months].sort().forEach(monthYear => {
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = monthYear;
        filterSelect.appendChild(option);
    });
}

async function loadCorsi() {
    try {
        console.log('Fetching all corsi...');
        const response = await client.getEntries({
            content_type: 'corsoFormazione',
            order: 'fields.dataInizio'
        });

        console.log(`Received ${response.items.length} corsi`);
        
        const corsiContainer = document.querySelector('.calendar-events');
        corsiContainer.innerHTML = '';
        
        populateFilterOptions(response.items);
        
        response.items.forEach(corso => {
            corsiContainer.innerHTML += createCorsoHTML(corso);
        });

    } catch (error) {
        console.error('Error fetching corsi:', error);
        document.querySelector('.calendar-events').innerHTML = 
            `<div class="error-message">Error loading corsi: ${error.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', initContentful);

document.querySelector('.time-filter').addEventListener('change', async (e) => {
    try {
        const timeFrame = e.target.value;
        console.log('Filtering corsi for:', timeFrame);
        
        const response = await client.getEntries({
            content_type: 'corsoFormazione',
            order: 'fields.dataInizio'
        });

        const corsiContainer = document.querySelector('.calendar-events');
        corsiContainer.innerHTML = '';

        const filteredCorsi = response.items.filter(corso => {
            if (timeFrame === 'UPCOMING') {
                return new Date(corso.fields.dataInizio) >= new Date();
            } else {
                const [month, year] = timeFrame.split(' ');
                return isInMonthYear(corso.fields.dataInizio, month, parseInt(year));
            }
        });

        console.log(`Showing ${filteredCorsi.length} corsi`);
        filteredCorsi.forEach(corso => {
            corsiContainer.innerHTML += createCorsoHTML(corso);
        });

    } catch (error) {
        console.error('Error filtering corsi:', error);
        document.querySelector('.calendar-events').innerHTML = 
            `<div class="error-message">Error filtering corsi: ${error.message}</div>`;
    }
});