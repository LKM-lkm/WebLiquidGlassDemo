const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch({headless:true, channel:'msedge'});
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push('PAGE: ' + e.message));
  p.on('console', msg => { if(msg.type()==='error') errors.push('ERR: ' + msg.text()); });
  await p.setViewportSize({width:1440, height:900});

  await p.goto('http://localhost:3000/studio', {waitUntil:'networkidle', timeout:20000});
  // Switch to WebGL/Kyant
  const webglBtn = p.locator('button:has-text("WebGL")').first();
  await webglBtn.click();
  await p.waitForTimeout(1000);
  const kyantBtn = p.locator('button:has-text("Kyant")').first();
  await kyantBtn.click();
  await p.waitForTimeout(3000);
  await p.screenshot({path:'debug-kyant.png'});
  
  // Check if canvas has pixel data
  const result = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return {found: false};
    const gl = c.getContext('webgl2');
    if (!gl) return {found: true, hasGL: false};
    const pixels = new Uint8Array(4);
    // Read a pixel from the center
    gl.readPixels(c.width/2, c.height/2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return {
      found: true, hasGL: true,
      w: c.width, h: c.height,
      centerPixel: Array.from(pixels),
      glError: gl.getError(),
    };
  });
  console.log('Canvas result:', JSON.stringify(result));
  console.log('Errors:', errors.join('\n') || 'none');
  await b.close();
})();
