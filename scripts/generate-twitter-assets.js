const puppeteer = require('puppeteer');
const path = require('path');

async function generateTwitterAssets() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    // Generate icon-only PNG
    console.log('Generating icon-only PNG...');
    await page.goto(`file://${path.join(__dirname, '../twitter-assets/icon-only.html')}`);
    await page.setViewport({ width: 400, height: 400 });
    await page.screenshot({
      path: path.join(__dirname, '../twitter-assets/provn-icon-only.png'),
      clip: { x: 0, y: 0, width: 400, height: 400 },
      omitBackground: false
    });
    
    // Generate icon + text + beta PNG
    console.log('Generating icon + text + beta PNG...');
    await page.goto(`file://${path.join(__dirname, '../twitter-assets/icon-text-beta.html')}`);
    await page.setViewport({ width: 800, height: 400 });
    await page.screenshot({
      path: path.join(__dirname, '../twitter-assets/provn-logo-beta.png'),
      clip: { x: 0, y: 0, width: 800, height: 400 },
      omitBackground: false
    });
    
    console.log('✅ Twitter assets generated successfully!');
    console.log('- provn-icon-only.png (400x400)');
    console.log('- provn-logo-beta.png (800x400)');
    
  } catch (error) {
    console.error('Error generating assets:', error);
  } finally {
    await browser.close();
  }
}

generateTwitterAssets();