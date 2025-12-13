const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  
  // Scroll down to trigger table loading
  console.log('Scrolling to load table...');
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  await delay(5000);
  
  console.log('Extracting piracy incidents...');
  const incidents = await page.evaluate(() => {
    // Find the incidents table - look for table with 3 columns
    const tables = Array.from(document.querySelectorAll('table'));
    let incidentsTable = null;
    
    for (const table of tables) {
      const headers = Array.from(table.querySelectorAll('thead th, th'));
      const headerText = headers.map(h => h.textContent.trim().toLowerCase()).join(' ');
      
      // Find table with our 3 columns
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
      
      // Must have exactly 3 cells
      if (cells.length !== 3) return null;
      
      const incident = {
        incident_number: cells[0]?.textContent?.trim(),
        date: cells[1]?.textContent?.trim(),
        narrations: cells[2]?.textContent?.trim()
      };
      
      // Filter out empty or invalid rows
      if (!incident.incident_number || !incident.date) return null;
      
      return incident;
    }).filter(Boolean);
    
    return results;
  });
  
  await browser.close();
  console.log(`Found ${incidents.length} piracy incidents`);
  
  return incidents;
}

module.exports = scrapeIccPiracy;

if (require.main === module) {
  scrapeIccPiracy()
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(console.error);
}
