const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch({headless:true, channel:'msedge'});
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push('PAGE: ' + e.message));
  p.on('console', msg => {
    if(msg.type()==='error') errors.push('ERR: ' + msg.text());
  });
  await p.setViewportSize({width:1440, height:900});

  await p.goto('http://localhost:3000/studio', {waitUntil:'networkidle', timeout:20000});
  
  // Switch to WebGL
  const webglBtn = p.locator('button:has-text("WebGL")').first();
  await webglBtn.click();
  await p.waitForTimeout(3000);

  // Deep inspect WebGL canvas
  const result = await p.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    const info = [];
    for (const c of canvases) {
      const gl = c.getContext('webgl2');
      info.push({
        w: c.width, h: c.height,
        cssW: c.offsetWidth, cssH: c.offsetHeight,
        hasGL: !!gl,
        glError: gl ? gl.getError() : 'no-context',
        parentTag: c.parentElement?.tagName,
        parentStyle: c.parentElement?.style?.cssText?.substring(0, 100),
        canvasStyle: c.style.cssText,
        visible: c.offsetWidth > 0 && c.offsetHeight > 0,
        zIndex: getComputedStyle(c).zIndex,
      });
    }
    
    // Check if UnifiedGlass is dispatching to WebGL
    const hasWebGLClass = document.querySelector('[class*="WebGL"]') !== null;
    const backdropCount = document.querySelectorAll('[style*="backdrop-filter"]').length;
    
    return { canvases: info, hasWebGLClass, backdropCount };
  });
  
  console.log(JSON.stringify(result, null, 2));
  console.log('\nErrors:', errors.join('\n'));
  await b.close();
})();
