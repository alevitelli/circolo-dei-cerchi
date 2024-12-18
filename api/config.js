module.exports = (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Log the environment variables (safely)
  console.log('Environment variables available:', {
    hasSpaceId: !!process.env.CONTENTFUL_SPACE_ID,
    hasAccessToken: !!process.env.CONTENTFUL_ACCESS_TOKEN,
    hasManagementToken: !!process.env.CONTENTFUL_MANAGEMENT_TOKEN,
    hasEmailJsPublicKey: !!process.env.EMAILJS_PUBLIC_KEY,
    hasServiceId: !!process.env.EMAILJS_SERVICE_ID,
    hasTemplateId: !!process.env.EMAILJS_TEMPLATE_ID
  });

  const config = {
    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
    CONTENTFUL_ACCESS_TOKEN: process.env.CONTENTFUL_ACCESS_TOKEN,
    CONTENTFUL_MANAGEMENT_TOKEN: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
    EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID
  };

  // Verify config before sending
  if (!config.CONTENTFUL_SPACE_ID || 
      !config.CONTENTFUL_ACCESS_TOKEN || 
      !config.CONTENTFUL_MANAGEMENT_TOKEN ||
      !config.EMAILJS_PUBLIC_KEY ||
      !config.EMAILJS_SERVICE_ID ||
      !config.EMAILJS_TEMPLATE_ID) {
    return res.status(500).json({ error: 'Missing required configuration' });
  }

  res.json(config);
};