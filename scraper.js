// GAC Hot Port News scraper (page 1 only for now)
async function scrapeGacHotPorts() {
  console.log('Starting browser for GAC...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Reduce memory usage
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 }); // Smaller viewport
  
  const allNews = [];
  
  // TEMPORARY: Only scrape page 1 for faster response
  const pageUrl = 'https://www.gac.com/hot-port-news';
  
  console.log(`Going to ${pageUrl}...`);
  
  try {
    await page.goto(pageUrl, { 
      waitUntil: 'networkidle2',
      timeout: 45000 // 45 second timeout
    });
    
    console.log('Waiting for content to load...');
    await delay(2000); // Reduced wait time
    
    console.log('Extracting hot port news...');
    const newsItems = await page.evaluate(() => {
      const items = [];
      
      const cards = Array.from(document.querySelectorAll('a.card-main'));
      
      cards.forEach(card => {
        try {
          const link = card.href;
          if (!link.includes('/hot-port-news/')) return;
          
          const dateElements = card.querySelectorAll('.content__date p');
          let date = '';
          let location = '';
          
          if (dateElements.length >= 2) {
            date = dateElements[0]?.textContent?.trim() || '';
            location = dateElements[1]?.textContent?.trim() || '';
          }
          
          const titleElement = card.querySelector('h6');
          const title = titleElement?.textContent?.trim() || '';
          
          const contentDiv = card.querySelector('.card-main__content, .card-maincontent');
          let summary = '';
          
          if (contentDiv) {
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
    
    console.log(`Found ${newsItems.length} news items`);
    allNews.push(...newsItems);
    
  } catch (error) {
    console.error('Error scraping GAC:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log(`Total GAC hot port news: ${allNews.length}`);
  return allNews;
}
