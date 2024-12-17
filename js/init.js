async function initConfig() {
    try {
      const response = await fetch('/api/config');
      window.CONFIG = await response.json();
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }
  
  initConfig();