const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ICC Piracy scraper (existing - unchanged)
async function scrapeIccPiracy() {
  console.log('Starting browser...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Going to ICC map page...');
  await page.goto('https://icc-ccs.org/map/', { 
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  console.log('Waiting for map to load...');
  await delay(5000);
  
  console.log('Scrolling to load table...');
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  await delay(5000);
  
  console.log('Extracting piracy incidents...');
  const incidents = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    let incidentsTable = null;
    
    for (const table of tables) {
      const headers = Array.from(table.querySelectorAll('thead th, th'));
      const headerText = headers.map(h => h.textContent.trim().toLowerCase()).join(' ');
      
      if (headerText.includes('incident number') && 
          headerText.includes('date') && 
          headerText.includes('narrations')) {
        incidentsTable = table;
        break;
      }
    }
    
    if (!incidentsTable) {
      console.log('Could not find incidents table with correct headers');
      return [];
    }
    
    const rows = Array.from(incidentsTable.querySelectorAll('tbody tr'));
    console.log(`Processing ${rows.length} incident rows`);
    
    const results = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      
      if (cells.length !== 3) return null;
      
      const incident = {
        incident_number: cells[0]?.textContent?.trim(),
        date: cells[1]?.textContent?.trim(),
        narrations: cells[2]?.textContent?.trim()
      };
      
      if (!incident.incident_number || !incident.date) return null;
      
      return incident;
    }).filter(Boolean);
    
    return results;
  });
  
  await browser.close();
  console.log(`Found ${incidents.length} piracy incidents`);
  
  return incidents;
}

// NEW: GAC Hot Port News scraper
async function scrapeGacHotPorts() {
  console.log('Starting browser for GAC...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const allNews = [];
  
  // Scrape both pages
  const pages = [
    'https://www.gac.com/hot-port-news',
    'https://www.gac.com/hot-port-news/p2'
  ];
  
  for (const pageUrl of pages) {
    console.log(`Going to ${pageUrl}...`);
    await page.goto(pageUrl, { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    console.log('Waiting for content to load...');
    await delay(3000);
    
    console.log('Extracting hot port news...');
    const newsItems = await page.evaluate(() => {
      const items = [];
      
      // Find all card-main links
      const cards = Array.from(document.querySelectorAll('a.card-main'));
      
      cards.forEach(card => {
        try {
          // Extract link
          const link = card.href;
          
          // Skip if not a hot-port-news link
          if (!link.includes('/hot-port-news/')) return;
          
          // Find date and location (in content__date div)
          const dateElements = card.querySelectorAll('.content__date p');
          let date = '';
          let location = '';
          
          if (dateElements.length >= 2) {
            date = dateElements[0]?.textContent?.trim() || '';
            location = dateElements[1]?.textContent?.trim() || '';
          }
          
          // Find title (h6)
          const titleElement = card.querySelector('h6');
          const title = titleElement?.textContent?.trim() || '';
          
          // Get summary text (all text after h6)
          const contentDiv = card.querySelector('.card-main__content, .card-maincontent');
          let summary = '';
          
          if (contentDiv) {
            // Get all text, remove date/location/title
            const fullText = contentDiv.textContent.trim();
            const textParts = fullText.split(title);
            if (textParts.length > 1) {
              summary = textParts[1].trim().replace(/Read More$/, '').trim();
            }
          }
          
          if (title && date) {
            items.push({
              date,
              location,
              title,
              link,
              summary: summary.substring(0, 300)
            });
          }
        } catch (e) {
          console.error('Error parsing card:', e.message);
        }
      });
      
      return items;
    });
    
    console.log(`Found ${newsItems.length} news items on this page`);
    allNews.push(...newsItems);
  }
  
  await browser.close();
  console.log(`Total GAC hot port news: ${allNews.length}`);
  
  return allNews;
}

module.exports = { scrapeIccPiracy, scrapeGacHotPorts };

// CLI testing
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === 'gac') {
    scrapeGacHotPorts()
      .then(data => console.log(JSON.stringify(data, null, 2)))
      .catch(console.error);
  } else {
    scrapeIccPiracy()
      .then(data => console.log(JSON.stringify(data, null, 2)))
      .catch(console.error);
  }
}
