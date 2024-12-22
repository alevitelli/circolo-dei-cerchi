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

    console.log('Fetching entries...');
    const response = await client.getEntries({
      content_type: 'calendarEvent',
      'fields.isFeatured': true,
      order: 'fields.eventDate'
    });

    console.log('Received response:', {
      total: response.total,
      itemCount: response.items.length
    });

    const eventsContainer = document.querySelector('.events-stream');
    if (!eventsContainer) {
      throw new Error('Events container not found');
    }

    const featuredEvents = response.items;
    if (featuredEvents.length > 0) {
      console.log('Rendering events...');
      eventsContainer.innerHTML = ''; // Clear existing content
      
      // Display first 4 events full width
      const fullWidthEvents = featuredEvents.slice(0, 8);
      fullWidthEvents.forEach(event => {
        const eventHtml = createFeaturedEventHTML(event, true);
        console.log('Adding full-width event to container');
        eventsContainer.innerHTML += eventHtml;
      });

      // Create grid for remaining events (5-10)
      if (featuredEvents.length > 8) {
        console.log('Creating grid for additional events');
        const eventsGrid = document.createElement('div');
        eventsGrid.className = 'events-grid';
        
        featuredEvents.slice(8, 10).forEach(event => {
          const eventHtml = createFeaturedEventHTML(event);
          eventsGrid.innerHTML += eventHtml;
        });

        eventsContainer.appendChild(eventsGrid);
      }
      console.log('Events rendered successfully');
    } else {
      console.log('No featured events found');
      eventsContainer.innerHTML = '<p>No featured events available.</p>';
    }
  } catch (error) {
    console.error('Error in initContentful:', error);
    const eventsContainer = document.querySelector('.events-stream');
    if (eventsContainer) {
      eventsContainer.innerHTML = `<p>Error loading events: ${error.message}</p>`;
    }
  }
}

function createFeaturedEventHTML(event, isFullWidth = false) {
    console.log('Creating HTML for event:', event.fields.eventName);
    

    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
      }).toUpperCase();
    }    
    // Get the base image URL
    let imageUrl = '';
    if (event.fields.image?.fields?.file?.url) {
        const baseUrl = `https:${event.fields.image.fields.file.url}`;
        // Create mobile and desktop optimized versions
        const mobileImage = `${baseUrl}?w=390&h=380&fit=fill&fm=webp&q=80`;
        const desktopImage = `${baseUrl}?w=1320&h=450&fit=fill&fm=webp&q=80`;
        
        const html = `
            <div class="event-card ${isFullWidth ? 'featured' : ''}">
                <div class="event-image">
                    <img srcset="${mobileImage} 390w,
                                ${desktopImage} 1320w"
                         sizes="(max-width: 768px) 390px,
                                1320px"
                         src="${desktopImage}"
                         alt="${event.fields.eventName}"
                         width="${isFullWidth ? '1320' : '390'}"
                         height="${isFullWidth ? '450' : '380'}"
                         loading="${isFullWidth ? 'eager' : 'lazy'}"
                         decoding="async">
                </div>
                <div class="event-overlay"></div>
                <div class="event-content">
                    <div class="event-meta">
                        ${event.fields.venue ? `<span class="venue">${event.fields.venue}</span>` : ''}
                        <span class="divider">•</span>
                        <span class="date">${formatDate(event.fields.eventDate)}</span>
                        <span class="divider">•</span>
                        ${event.fields.eventTime ? `<span class="time">${event.fields.eventTime}</span>` : ''}
                    </div>
                    <h2 class="event-title">
                        <a href="/event?id=${event.sys.id}">${event.fields.eventName}</a>
                    </h2>
                    ${event.fields.eventDetail ? `<p class="event-detail">${event.fields.eventDetail}</p>` : ''}
                    <a href="/event?id=${event.sys.id}" class="cta-button">SCOPRI DI PIU'</a>
                </div>
            </div>
        `;
        return html;
    }
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initContentful);