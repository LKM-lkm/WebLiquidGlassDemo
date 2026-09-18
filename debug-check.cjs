const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch({headless:true, channel:'msedge'});
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push('PAGE_ERROR: ' + e.message));
  p.on('console', msg => {
    if(msg.type()==='error') errors.push('CONSOLE_ERROR: ' + msg.text());
  });
  await p.setViewportSize({width:1440, height:900});

  await p.goto('http://localhost:3000/studio', {waitUntil:'networkidle', timeout:20000});
  await p.screenshot({path:'debug-studio-default.png'});
  console.log('Studio default OK');

  const webglBtn = p.locator('button:has-text("WebGL")').first();
  if (await webglBtn.count() > 0) {
    await webglBtn.click();
    await p.waitForTimeout(3000);
    await p.screenshot({path:'debug-studio-webgl.png'});
    console.log('Studio WebGL OK');

    const canvasCount = await p.locator('canvas').count();
    console.log('Canvas count:', canvasCount);

    const canvasInfo = await p.evaluate(() => {
      const cs = document.querySelectorAll('canvas');
      return Array.from(cs).map(c => ({
        w: c.width, h: c.height,
        display: getComputedStyle(c).display,
        visible: c.offsetWidth > 0 && c.offsetHeight > 0,
        parent: c.parentElement?.className || 'none'
      }));
    });
    console.log('Canvas info:', JSON.stringify(canvasInfo, null, 2));
  }

  console.log('\nErrors:', errors.length ? errors.join('\n') : 'none');
  await b.close();
})();
