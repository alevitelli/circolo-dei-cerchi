module.exports = (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Log the environment variables (safely)
  console.log('Environment variables available:', {
    hasSpaceId: !!process.env.CONTENTFUL_SPACE_ID,
    hasAccessToken: !!process.env.CONTENTFUL_ACCESS_TOKEN
  });

  const config = {
    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
    CONTENTFUL_ACCESS_TOKEN: process.env.CONTENTFUL_ACCESS_TOKEN
  };

  // Verify config before sending
  if (!config.CONTENTFUL_SPACE_ID || !config.CONTENTFUL_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Missing required configuration' });
  }

  res.json(config);
};