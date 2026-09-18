const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch({headless:true, channel:'msedge'});
  const p = await b.newPage();
  const logs = [];
  p.on('console', msg => logs.push(msg.type() + ': ' + msg.text()));

  await p.setViewportSize({width:1440, height:900});
  await p.goto('http://localhost:3000/studio', {waitUntil:'networkidle', timeout:20000});
  
  await p.locator('button:has-text("WebGL")').first().click();
  await p.waitForTimeout(500);
  await p.locator('button:has-text("Kyant")').first().click();
  await p.waitForTimeout(5000);

  // Inject a test: create a simple WebGL2 canvas and draw a quad
  const testResult = await p.evaluate(() => {
    // Find the LARGEST canvas (should be the player glass)
    const canvases = document.querySelectorAll('canvas');
    let target = null;
    let maxArea = 0;
    for (const c of canvases) {
      if (c.width * c.height > maxArea) {
        maxArea = c.width * c.height;
        target = c;
      }
    }
    if (!target) return {error: 'no canvas'};
    
    const gl = target.getContext('webgl2');
    if (!gl) return {error: 'no gl'};
    
    // Read ALL pixels
    const pixels = new Uint8Array(target.width * target.height * 4);
    gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    let nonZero = 0;
    let maxAlpha = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 0 || pixels[i+1] > 0 || pixels[i+2] > 0 || pixels[i+3] > 0) nonZero++;
      if (pixels[i+3] > maxAlpha) maxAlpha = pixels[i+3];
    }
    
    return {
      w: target.width, h: target.height,
      totalPixels: target.width * target.height,
      nonZero,
      maxAlpha,
      samplePixels: [
        Array.from(pixels.slice(0, 4)),
        Array.from(pixels.slice(target.width * 4, target.width * 4 + 4)),
        Array.from(pixels.slice(pixels.length - 4)),
      ],
    };
  });
  
  console.log('Test result:', JSON.stringify(testResult, null, 2));
  
  // Print error/warn logs
  const importantLogs = logs.filter(l => l.startsWith('error') || l.startsWith('warn'));
  console.log('\nImportant logs:', importantLogs.length ? importantLogs.join('\n') : 'none');
  
  await b.close();
})();
