/**
 * WebGL2 core utilities: context creation, shader compilation, FBO management.
 */

// ─── Shader Compilation ─────────────────────────────────────────────────────

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string,
): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  return program;
}

// ─── Fullscreen Quad (per-context) ───────────────────────────────────────────

const QUAD_VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const _quadCache = new WeakMap<WebGL2RenderingContext, { vao: WebGLVertexArrayObject; vbo: WebGLBuffer }>();

export function ensureQuad(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
  const cached = _quadCache.get(gl);
  if (cached) return cached.vao;
  const vao = gl.createVertexArray()!;
  const vbo = gl.createBuffer()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  _quadCache.set(gl, { vao, vbo });
  return vao;
}

export function drawQuad(gl: WebGL2RenderingContext): void {
  const vao = ensureQuad(gl);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindVertexArray(null);
}

// ─── Framebuffer Objects ─────────────────────────────────────────────────────

export interface FBO {
  fbo: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

export function createFBO(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  filter: number = gl.LINEAR,
): FBO {
  const fbo = gl.createFramebuffer()!;
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { fbo, texture, width, height };
}

export function resizeFBO(fbo: FBO, gl: WebGL2RenderingContext, w: number, h: number): void {
  if (fbo.width === w && fbo.height === h) return;
  fbo.width = w;
  fbo.height = h;
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

export function deleteFBO(fbo: FBO, gl: WebGL2RenderingContext): void {
  gl.deleteFramebuffer(fbo.fbo);
  gl.deleteTexture(fbo.texture);
}

export function bindFBO(gl: WebGL2RenderingContext, fbo: FBO | null): void {
  if (fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
    gl.viewport(0, 0, fbo.width, fbo.height);
  } else {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}

// ─── Texture Upload ──────────────────────────────────────────────────────────

export function uploadTexture(
  gl: WebGL2RenderingContext,
  source: TexImageSource,
  filter: number = gl.LINEAR,
): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

export function updateTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  source: TexImageSource,
): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

// ─── Uniform Helpers ─────────────────────────────────────────────────────────

export function setUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  uniforms: Record<string, number | number[] | WebGLTexture | null>,
  textureUnit = 0,
): number {
  let unit = textureUnit;
  gl.useProgram(program);
  for (const [name, value] of Object.entries(uniforms)) {
    const loc = gl.getUniformLocation(program, name);
    if (loc === null) continue;
    if (value === null) continue;
    if (Array.isArray(value)) {
      switch (value.length) {
        case 2: gl.uniform2fv(loc, value); break;
        case 3: gl.uniform3fv(loc, value); break;
        case 4: gl.uniform4fv(loc, value); break;
        default: gl.uniform1fv(loc, value); break;
      }
    } else if (typeof value === 'number') {
      gl.uniform1f(loc, value);
    } else {
      // Texture
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, value as WebGLTexture);
      gl.uniform1i(loc, unit);
      unit++;
    }
  }
  return unit;
}

// ─── Context Creation ────────────────────────────────────────────────────────

export function createWebGL2Context(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    antialias: false,
  }) as WebGL2RenderingContext | null;
  if (!gl) return null;
  // Enable float textures
  gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('OES_texture_float_linear');
  return gl;
}

// ─── Vertex Shader Source ────────────────────────────────────────────────────

export const FULLSCREEN_VERT = QUAD_VERT;
