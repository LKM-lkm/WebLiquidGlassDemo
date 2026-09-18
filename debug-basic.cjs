const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch({headless:true, channel:'msedge'});
  const p = await b.newPage();
  await p.setViewportSize({width:1440, height:900});
  
  // Create a test page with just a WebGL canvas
  const result = await p.evaluate(async () => {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    document.body.appendChild(canvas);
    
    const gl = canvas.getContext('webgl2');
    if (!gl) return {error: 'no webgl2'};
    
    // Simple test shader
    const vertSrc = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;
    
    const fragSrc = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
void main() {
  fragColor = vec4(vUv.x, vUv.y, 0.5, 1.0);
}`;
    
    // Compile
    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        return {error: 'shader: ' + gl.getShaderInfoLog(s)};
      }
      return s;
    }
    
    const vert = compileShader(gl.VERTEX_SHADER, vertSrc);
    const frag = compileShader(gl.FRAGMENT_SHADER, fragSrc);
    if (vert.error) return vert;
    if (frag.error) return frag;
    
    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return {error: 'link: ' + gl.getProgramInfoLog(prog)};
    }
    
    // Draw
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    
    gl.useProgram(prog);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Read pixels
    const pixels = new Uint8Array(400 * 200 * 4);
    gl.readPixels(0, 0, 400, 200, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    let nonZero = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 0 || pixels[i+1] > 0 || pixels[i+2] > 0) nonZero++;
    }
    
    return {
      success: true,
      totalPixels: 400 * 200,
      nonZero,
      sample: Array.from(pixels.slice(0, 4)),
    };
  });
  
  console.log('Test result:', JSON.stringify(result));
  await b.close();
})();
