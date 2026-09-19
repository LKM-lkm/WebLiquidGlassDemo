const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch({headless:true, channel:'msedge'});
  const p = await b.newPage();
  const logs = [];
  p.on('pageerror', e => logs.push('PAGE_ERR: ' + e.message));
  p.on('console', msg => logs.push(msg.type().toUpperCase() + ': ' + msg.text()));

  await p.setViewportSize({width:1440, height:900});
  await p.goto('http://localhost:3000/studio', {waitUntil:'networkidle', timeout:20000});

  // Switch to WebGL/Kyant
  await p.locator('button:has-text("WebGL")').first().click();
  await p.waitForTimeout(500);
  await p.locator('button:has-text("Kyant")').first().click();
  await p.waitForTimeout(4000);

  // Deep WebGL debug
  const result = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return {error: 'no canvas'};
    const gl = c.getContext('webgl2');
    if (!gl) return {error: 'no webgl2'};
    
    // Check if any program is linked
    const ext = gl.getExtension('EXT_color_buffer_float');
    
    // Check shader compile status by looking at the renderer
    // The renderer creates programs internally - let's check the canvas
    const pixels = new Uint8Array(c.width * c.height * 4);
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    // Count non-zero pixels
    let nonZero = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 0 || pixels[i+1] > 0 || pixels[i+2] > 0 || pixels[i+3] > 0) {
        nonZero++;
      }
    }
    
    return {
      w: c.width, h: c.height,
      totalPixels: (c.width * c.height),
      nonZeroPixels: nonZero,
      hasFloatExt: !!ext,
      glVersion: gl.getParameter(gl.VERSION),
    };
  });
  console.log('WebGL result:', JSON.stringify(result, null, 2));
  console.log('\nAll logs:');
  logs.forEach(l => console.log(l));
  await b.close();
})();
