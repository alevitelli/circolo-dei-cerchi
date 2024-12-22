async function initConfig() {
  try {
    const response = await fetch('/api/config');
    
    if (!response.ok) {
      throw new Error(`Configuration fetch failed`);
    }
    
    const config = await response.json();
    
    // Verify the config has all required properties
    if (!config.CONTENTFUL_SPACE_ID || 
        !config.CONTENTFUL_ACCESS_TOKEN || 
        !config.CONTENTFUL_MANAGEMENT_TOKEN ||
        !config.EMAILJS_PUBLIC_KEY ||
        !config.EMAILJS_SERVICE_ID ||
        !config.EMAILJS_TEMPLATE_ID ||
        !config.EMAILJS_TEMPLATE_ID_FORM_CORSO ||
        !config.SUMUP_MERCHANT_CODE ||
        !config.SUMUP_ACCESS_TOKEN) {
      throw new Error('Invalid configuration');
    }
    
    window.CONFIG = config;
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Configuration loaded successfully');
    }
  } catch (error) {
    console.error('Configuration error occurred');
    setTimeout(initConfig, 2000);
  }
}

window.getConfig = () => window.CONFIG;

initConfig();