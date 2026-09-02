const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/checklists/b062bff7-0beb-4515-9922-e1cf89dcfa');
  await page.waitForTimeout(2000);
  const text = await page.evaluate(() => document.body.innerText);
  console.log('TEXT:', text);
  await browser.close();
})();
