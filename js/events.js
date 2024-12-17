// Initialize Contentful client with your actual credentials
const client = contentful.createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
});

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

// Function to create event HTML that matches your existing design
function createEventHTML(event) {
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
          <span class="divider-calendar">•</span>
          <span class="time">${event.fields.eventTime}</span>
        </div>
        <h2 class="event-name">${event.fields.eventName}</h2>
        <div class="lineup">${event.fields.eventDetail || ''}</div>
      </div>
      <a href="/event.html?id=${event.sys.id}" class="calendar-cta">MORE INFO</a>
    </article>
  `;
}

// Function to get month and year from date string
function getMonthYear(dateString) {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString('en-US', { month: 'long' }).toUpperCase(), // Changed from 'LONG' to 'long'
      year: date.getFullYear()
    };
  }

// Function to check if date is in specific month and year
function isInMonthYear(dateString, month, year) {
    const date = new Date(dateString);
    return date.getFullYear() === parseInt(year) && 
           date.toLocaleString('en-US', { month: 'long' }).toUpperCase() === month;
  }

// Function to populate filter options based on available events
function populateFilterOptions(events) {
  const filterSelect = document.querySelector('.time-filter');
  const months = new Set();
  
  // Clear existing options
  filterSelect.innerHTML = '<option>UPCOMING</option>';
  
  // Get unique month-year combinations from events
  events.forEach(event => {
    const { month, year } = getMonthYear(event.fields.eventDate);
    months.add(`${month} ${year}`);
  });
  
  // Add options for each unique month-year
  [...months].sort().forEach(monthYear => {
    const option = document.createElement('option');
    option.value = monthYear;
    option.textContent = monthYear;
    filterSelect.appendChild(option);
  });
}

// Modified loadEvents function
async function loadEvents() {
  try {
    const response = await client.getEntries({
      content_type: 'calendarEvent',
      order: 'fields.eventDate'
    });

    const eventsContainer = document.querySelector('.calendar-events');
    eventsContainer.innerHTML = ''; // Clear existing events
    
    // Populate filter options
    populateFilterOptions(response.items);
    
    // Display all events initially
    response.items.forEach(event => {
      eventsContainer.innerHTML += createEventHTML(event);
    });

  } catch (error) {
    console.error('Error fetching events:', error);
  }
}

// Modified filterEvents function
async function filterEvents(timeFrame) {
  try {
    const response = await client.getEntries({
      content_type: 'calendarEvent',
      order: 'fields.eventDate'
    });

    const eventsContainer = document.querySelector('.calendar-events');
    eventsContainer.innerHTML = ''; // Clear existing events

    const filteredEvents = response.items.filter(event => {
      if (timeFrame === 'UPCOMING') {
        // Show events from today onwards
        return new Date(event.fields.eventDate) >= new Date();
      } else {
        // Filter by selected month and year
        const [month, year] = timeFrame.split(' ');
        return isInMonthYear(event.fields.eventDate, month, parseInt(year));
      }
    });

    filteredEvents.forEach(event => {
      eventsContainer.innerHTML += createEventHTML(event);
    });

  } catch (error) {
    console.error('Error filtering events:', error);
  }
}

// Load events when page loads
document.addEventListener('DOMContentLoaded', loadEvents);

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