async function initConfig() {
  try {
    console.log('Fetching configuration...');
    const response = await fetch('/api/config');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const config = await response.json();
    console.log('Raw config received:', config);
    
    // Verify the config has all required properties
    if (!config.CONTENTFUL_SPACE_ID || 
        !config.CONTENTFUL_ACCESS_TOKEN || 
        !config.CONTENTFUL_MANAGEMENT_TOKEN ||
        !config.EMAILJS_PUBLIC_KEY ||
        !config.EMAILJS_SERVICE_ID ||
        !config.EMAILJS_TEMPLATE_ID) {
      throw new Error('Configuration is missing required properties');
    }
    
    window.CONFIG = {
      CONTENTFUL_SPACE_ID: config.CONTENTFUL_SPACE_ID,
      CONTENTFUL_ACCESS_TOKEN: config.CONTENTFUL_ACCESS_TOKEN,
      CONTENTFUL_MANAGEMENT_TOKEN: config.CONTENTFUL_MANAGEMENT_TOKEN,
      EMAILJS_PUBLIC_KEY: config.EMAILJS_PUBLIC_KEY,
      EMAILJS_SERVICE_ID: config.EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID: config.EMAILJS_TEMPLATE_ID,
      SUMUP_MERCHANT_CODE: 'MD73PEXF',
      SUMUP_ACCESS_TOKEN: 'sup_sk_iPAkA4jRrJKDQSkJjfiE0DjahirdaOtHA'
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