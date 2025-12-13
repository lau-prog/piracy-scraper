const express = require('express');
const cors = require('cors');
const scrapeIccPiracy = require('./scraper');

const app = express();
app.use(cors());

app.get('/api/piracy', async (req, res) => {
  try {
    const incidents = await scrapeIccPiracy();
    res.json({ success: true, incidents, count: incidents.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3000;

app.get('/debug', async (req, res) => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://icc-ccs.org/map/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForTimeout(5000);
  
  const info = await page.evaluate(() => {
    return {
      title: document.title,
      hasTables: document.querySelectorAll('table').length,
      tableIds: Array.from(document.querySelectorAll('table')).map(t => t.id),
      tableClasses: Array.from(document.querySelectorAll('table')).map(t => t.className)
    };
  });
  
  await browser.close();
  res.json(info);
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/api/piracy`);
});
