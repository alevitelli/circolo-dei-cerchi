module.exports = (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Only log presence of environment variables in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment variables status:', {
      hasRequiredConfig: 
        !!process.env.CONTENTFUL_SPACE_ID &&
        !!process.env.CONTENTFUL_ACCESS_TOKEN &&
        !!process.env.CONTENTFUL_MANAGEMENT_TOKEN &&
        !!process.env.EMAILJS_PUBLIC_KEY &&
        !!process.env.EMAILJS_SERVICE_ID &&
        !!process.env.EMAILJS_TEMPLATE_ID &&
        !!process.env.EMAILJS_TEMPLATE_ID_FORM_CORSO &&
        !!process.env.SUMUP_MERCHANT_CODE &&
        !!process.env.SUMUP_ACCESS_TOKEN
    });
  }

  const config = {
    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
    CONTENTFUL_ACCESS_TOKEN: process.env.CONTENTFUL_ACCESS_TOKEN,
    CONTENTFUL_MANAGEMENT_TOKEN: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
    EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID,
    EMAILJS_TEMPLATE_ID_FORM_CORSO: process.env.EMAILJS_TEMPLATE_ID_FORM_CORSO,
    SUMUP_MERCHANT_CODE: process.env.SUMUP_MERCHANT_CODE,
    SUMUP_ACCESS_TOKEN: process.env.SUMUP_ACCESS_TOKEN
  };

  // Verify config before sending
  if (!config.CONTENTFUL_SPACE_ID || 
      !config.CONTENTFUL_ACCESS_TOKEN || 
      !config.CONTENTFUL_MANAGEMENT_TOKEN ||
      !config.EMAILJS_PUBLIC_KEY ||
      !config.EMAILJS_SERVICE_ID ||
      !config.EMAILJS_TEMPLATE_ID ||
      !config.EMAILJS_TEMPLATE_ID_FORM_CORSO ||
      !config.SUMUP_MERCHANT_CODE ||
      !config.SUMUP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Missing required configuration' });
  }

  res.json(config);
};