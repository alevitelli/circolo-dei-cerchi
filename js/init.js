async function initConfig() {
  try {
    console.log('Fetching configuration...');
    const response = await fetch('/api/config');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const config = await response.json();
    console.log('Configuration loaded successfully');
    window.CONFIG = config;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    // Retry after 2 seconds
    setTimeout(initConfig, 2000);
  }
}

initConfig();