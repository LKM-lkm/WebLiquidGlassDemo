const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch({headless:true, channel:'msedge'});
  const p = await b.newPage();
  const failed = [];
  p.on('response', r => { if(r.status()>=400) failed.push(r.url()+' -> '+r.status()); });
  p.on('pageerror', e => console.log('PAGE_ERR:', e.message));

  await p.setViewportSize({width:1440, height:900});
  await p.goto('http://localhost:3000/studio', {waitUntil:'networkidle', timeout:20000});
  
  // Switch to WebGL/Kyant
  await p.locator('button:has-text("WebGL")').first().click();
  await p.waitForTimeout(500);
  await p.locator('button:has-text("Kyant")').first().click();
  await p.waitForTimeout(5000);

  console.log('Failed URLs:', failed.join('\n'));

  // Check canvas
  const result = await p.evaluate(() => {
    const cs = document.querySelectorAll('canvas');
    const info = [];
    for (const c of cs) {
      const gl = c.getContext('webgl2');
      const pixels = new Uint8Array(4);
      if (gl) gl.readPixels(c.width/2, c.height/2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      info.push({
        w: c.width, h: c.height,
        cssW: c.offsetWidth, cssH: c.offsetHeight,
        pixel: Array.from(pixels),
        hasSrc: !!c.style.backgroundImage,
      });
    }
    // Also check if scene images loaded
    const imgs = document.querySelectorAll('img[src*="unsplash"]');
    return {
      canvases: info,
      imgCount: imgs.length,
      firstImgLoaded: imgs[0] ? imgs[0].complete : false,
    };
  });
  console.log('Result:', JSON.stringify(result, null, 2));
  
  await p.screenshot({path:'debug-after-fix.png'});
  await b.close();
})();
