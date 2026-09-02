const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5174/checklists/b062bff7-0beb-4515-9922-e1cf89dcfa');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
