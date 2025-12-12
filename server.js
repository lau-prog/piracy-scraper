const express = require('express');
const { scrapeIccPiracy, scrapeGacHotPorts } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check - respond immediately
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    endpoints: [
      '/api/piracy',
      '/api/gac-hot-ports'
    ],
    timestamp: new Date().toISOString()
  });
});

// ICC Piracy endpoint
app.get('/api/piracy', async (req, res) => {
  const startTime = Date.now();
  console.log('[ICC] Scrape started');
  
  try {
    const data = await scrapeIccPiracy();
    const duration = Date.now() - startTime;
    console.log(`[ICC] Scrape completed in ${duration}ms`);
    
    res.json({
      success: true,
      incidents: data,
      count: data.length,
      scrapeDuration: duration
    });
  } catch (error) {
    console.error('[ICC] Scraping error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GAC Hot Port News endpoint
app.get('/api/gac-hot-ports', async (req, res) => {
  const startTime = Date.now();
  console.log('[GAC] Scrape started');
  
  try {
    const data = await scrapeGacHotPorts();
    const duration = Date.now() - startTime;
    console.log(`[GAC] Scrape completed in ${duration}ms`);
    
    res.json({
      success: true,
      news: data,
      count: data.length,
      scrapeDuration: duration
    });
  } catch (error) {
    console.error('[GAC] Scraping error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Endpoints ready:`);
  console.log(`  - /api/piracy`);
  console.log(`  - /api/gac-hot-ports`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
