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
      // Rest of your rendering code...
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

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initContentful);