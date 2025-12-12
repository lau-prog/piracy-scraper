const express = require('express');
const { scrapeIccPiracy, scrapeGacHotPorts } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// ICC Piracy endpoint
app.get('/api/piracy', async (req, res) => {
  try {
    const data = await scrapeIccPiracy();
    res.json({
      success: true,
      incidents: data,
      count: data.length
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GAC Hot Port News endpoint
app.get('/api/gac-hot-ports', async (req, res) => {
  try {
    const data = await scrapeGacHotPorts();
    res.json({
      success: true,
      news: data,
      count: data.length
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    endpoints: [
      '/api/piracy',
      '/api/gac-hot-ports'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  - http://localhost:${PORT}/api/piracy`);
  console.log(`  - http://localhost:${PORT}/api/gac-hot-ports`);
});
