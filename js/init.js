async function initConfig() {
  try {
    console.log('Fetching configuration...');
    const response = await fetch('/api/config');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const config = await response.json();
    console.log('Raw config received:', config);
    
    // Verify the config has the required properties
    if (!config.CONTENTFUL_SPACE_ID || !config.CONTENTFUL_ACCESS_TOKEN) {
      throw new Error('Configuration is missing required properties');
    }
    
    window.CONFIG = {
      CONTENTFUL_SPACE_ID: config.CONTENTFUL_SPACE_ID,
      CONTENTFUL_ACCESS_TOKEN: config.CONTENTFUL_ACCESS_TOKEN
    };
    
    console.log('Configuration loaded and verified:', window.CONFIG);
  } catch (error) {
    console.error('Failed to load configuration:', error);
    // Retry after 2 seconds
    setTimeout(initConfig, 2000);
  }
}

// Add this to verify when the configuration is actually available
window.getConfig = () => {
  return window.CONFIG;
};

initConfig();