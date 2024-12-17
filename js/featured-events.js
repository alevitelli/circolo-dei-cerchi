async function initContentful() {
  try {
    // Wait for config to be loaded
    console.log('Waiting for configuration...');
    while (!window.CONFIG) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('Configuration found:', window.CONFIG);

    const client = contentful.createClient({
      space: window.CONFIG.CONTENTFUL_SPACE_ID,
      accessToken: window.CONFIG.CONTENTFUL_ACCESS_TOKEN
    });

    // Function to format date
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).toUpperCase();
    }
    
    // Function to create featured event HTML
    function createFeaturedEventHTML(event, isMain = false) {
      const imageUrl = event.fields.image?.fields?.file?.url 
        ? `https:${event.fields.image.fields.file.url}` 
        : '';
    
      return `
        <article class="event-card">
          <div class="event-overlay"></div>
          <div class="event-image">
            <img src="${imageUrl}" alt="${event.fields.eventName}">
          </div>
          <div class="event-content">
            <div class="event-meta">
              <span class="event-date">${formatDate(event.fields.eventDate)}</span>
              <span class="divider">•</span>
              <span class="event-type">${event.fields.eventDetail || ''}</span>
            </div>
            <h2 class="event-title">${event.fields.eventName}</h2>
            <a href="/event.html?id=${event.sys.id}" class="cta-button">MORE INFO</a>
          </div>
        </article>
      `;
    }
    
    // Function to load featured events
    async function loadFeaturedEvents() {
      try {
        const response = await client.getEntries({
          content_type: 'calendarEvent',
          'fields.isFeatured': true,
          order: 'fields.eventDate'
        });
    
        const eventsContainer = document.querySelector('.events-stream');
        const featuredEvents = response.items;
    
        if (featuredEvents.length > 0) {
          // Display first 4 events full width
          const fullWidthEvents = featuredEvents.slice(0, 4);
          fullWidthEvents.forEach(event => {
            eventsContainer.innerHTML += createFeaturedEventHTML(event, true);
          });
    
          // Create grid for remaining events (5-10)
          if (featuredEvents.length > 4) {
            const eventsGrid = document.createElement('div');
            eventsGrid.className = 'events-grid';
            
            // Add events 5-10 to grid
            featuredEvents.slice(4, 10).forEach(event => {
              eventsGrid.innerHTML += createFeaturedEventHTML(event);
            });
    
            eventsContainer.appendChild(eventsGrid);
          }
        }
    
      } catch (error) {
        console.error('Error fetching featured events:', error);
      }
    }
    
    // Load featured events when page loads
    document.addEventListener('DOMContentLoaded', loadFeaturedEvents);
  } catch (error) {
    console.error('Error initializing contentful:', error);
  }
}

document.addEventListener('DOMContentLoaded', initContentful);