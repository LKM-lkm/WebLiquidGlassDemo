/**
 * WebGL2 glass renderer: multi-pass pipeline for glass refraction effects.
 *
 * Pipeline:
 * 1. Scene pass: upload background image → sceneTexture
 * 2. Blur pass: Gaussian blur → blurFBO
 * 3. Glass pass: SDF + refraction + effects → glassFBO
 * 4. Blit to canvas
 */

import {
  createWebGL2Context,
  createProgram,
  createFBO,
  resizeFBO,
  deleteFBO,
  bindFBO,
  uploadTexture,
  updateTexture,
  setUniforms,
  drawQuad,
  FULLSCREEN_VERT,
  type FBO,
} from './core';
import {
  BLUR_FRAG,
  GLASS_KYANT_FRAG,
  BLIT_FRAG,
} from './shaders';

export interface GlassRendererParams {
  // Element geometry (CSS pixels)
  rectX: number;
  rectY: number;
  rectW: number;
  rectH: number;
  radius: number;
  dpr: number;

  // Refraction
  refractionHeight: number;
  ior: number;
  chromaticAberration: number;

  // Visual
  blurMix: number;
  blurRadius: number;
  vibrancy: number;
  tintR: number;
  tintG: number;
  tintB: number;
  tintAmount: number;

  // Highlight
  highlightIntensity: number;
  highlightAngle: number;

  // Shadow
  shadowExpand: number;
  shadowOffsetY: number;

  // Tint overlay
  tintColorR: number;
  tintColorG: number;
  tintColorB: number;
  tintOpacity: number;
}

export const DEFAULT_GLASS_RENDERER_PARAMS: GlassRendererParams = {
  rectX: 0,
  rectY: 0,
  rectW: 200,
  rectH: 100,
  radius: 20,
  dpr: 1,
  refractionHeight: 15,
  ior: 1.5,
  chromaticAberration: 3,
  blurMix: 0.6,
  blurRadius: 8,
  vibrancy: 0.5,
  tintR: 0.95,
  tintG: 0.97,
  tintB: 1.0,
  tintAmount: 0.15,
  highlightIntensity: 0.5,
  highlightAngle: 0,
  shadowExpand: 20,
  shadowOffsetY: 4,
  tintColorR: 0,
  tintColorG: 0,
  tintColorB: 0,
  tintOpacity: 0,
};

export class GlassRenderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private blurProgram: WebGLProgram;
  private glassProgram: WebGLProgram;
  private blitProgram: WebGLProgram;
  private sceneFBO: FBO | null = null;
  private blurFBO: FBO | null = null;
  private sceneTexture: WebGLTexture | null = null;
  private canvasW = 0;
  private canvasH = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = createWebGL2Context(canvas);
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    this.blurProgram = createProgram(gl, FULLSCREEN_VERT, BLUR_FRAG);
    this.glassProgram = createProgram(gl, FULLSCREEN_VERT, GLASS_KYANT_FRAG);
    this.blitProgram = createProgram(gl, FULLSCREEN_VERT, BLIT_FRAG);
  }

  resize(w: number, h: number): void {
    if (w === this.canvasW && h === this.canvasH) return;
    this.canvasW = w;
    this.canvasH = h;
    this.canvas.width = w;
    this.canvas.height = h;
    const { gl } = this;
    if (this.sceneFBO) resizeFBO(this.sceneFBO, gl, w, h);
    if (this.blurFBO) resizeFBO(this.blurFBO, gl, w, h);
  }

  ensureFBOs(w: number, h: number): void {
    const { gl } = this;
    if (!this.sceneFBO) {
      this.sceneFBO = createFBO(gl, w, h);
    } else {
      resizeFBO(this.sceneFBO, gl, w, h);
    }
    if (!this.blurFBO) {
      this.blurFBO = createFBO(gl, w, h);
    } else {
      resizeFBO(this.blurFBO, gl, w, h);
    }
  }

  uploadScene(source: TexImageSource, w: number, h: number): void {
    const { gl } = this;
    this.resize(w, h);
    this.ensureFBOs(w, h);
    if (!this.sceneTexture) {
      this.sceneTexture = uploadTexture(gl, source, gl.LINEAR);
    } else {
      updateTexture(gl, this.sceneTexture, source);
    }
    // Copy scene texture to sceneFBO
    bindFBO(gl, this.sceneFBO!);
    gl.useProgram(this.blitProgram);
    setUniforms(gl, this.blitProgram, { uTex: this.sceneTexture });
    drawQuad(gl);
  }

  render(params: GlassRendererParams): void {
    const { gl } = this;
    const w = this.canvasW;
    const h = this.canvasH;
    if (w < 1 || h < 1) return;
    this.ensureFBOs(w, h);

    // Pass 1: Blur scene
    this.renderBlur(params);

    // Pass 2: Glass effect
    this.renderGlass(params);
  }

  private renderBlur(params: GlassRendererParams): void {
    const { gl, sceneFBO, blurFBO } = this;
    if (!sceneFBO || !blurFBO) return;

    const radius = params.blurRadius * params.dpr;
    if (radius < 0.5) {
      // Just copy scene to blur
      bindFBO(gl, blurFBO);
      gl.useProgram(this.blitProgram);
      setUniforms(gl, this.blitProgram, { uTex: sceneFBO.texture });
      drawQuad(gl);
      return;
    }

    // Horizontal blur: sceneFBO → blurFBO
    bindFBO(gl, blurFBO);
    gl.useProgram(this.blurProgram);
    setUniforms(gl, this.blurProgram, {
      uTex: sceneFBO.texture,
      uDir: [1.0 / this.canvasW, 0],
      uRadius: radius,
      uResolution: [blurFBO.width, blurFBO.height],
    });
    drawQuad(gl);

    // Vertical blur: blurFBO → sceneFBO (temp)
    bindFBO(gl, sceneFBO);
    gl.useProgram(this.blurProgram);
    setUniforms(gl, this.blurProgram, {
      uTex: blurFBO.texture,
      uDir: [0, 1.0 / this.canvasH],
      uRadius: radius,
      uResolution: [sceneFBO.width, sceneFBO.height],
    });
    drawQuad(gl);

    // Now sceneFBO has the fully blurred result
    // Copy back to blurFBO
    bindFBO(gl, blurFBO);
    gl.useProgram(this.blitProgram);
    setUniforms(gl, this.blitProgram, { uTex: sceneFBO.texture });
    drawQuad(gl);

    // Re-upload original scene to sceneFBO
    if (this.sceneTexture) {
      bindFBO(gl, sceneFBO);
      gl.useProgram(this.blitProgram);
      setUniforms(gl, this.blitProgram, { uTex: this.sceneTexture });
      drawQuad(gl);
    }
  }

  private renderGlass(params: GlassRendererParams): void {
    const { gl, sceneFBO, blurFBO } = this;
    if (!sceneFBO || !blurFBO) return;

    // Render glass to canvas (default framebuffer)
    bindFBO(gl, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.glassProgram);
    setUniforms(gl, this.glassProgram, {
      uSceneTex: sceneFBO.texture,
      uBlurTex: blurFBO.texture,
      uResolution: [this.canvasW, this.canvasH],
      uDpr: params.dpr,
      uRect: [params.rectX, params.rectY, params.rectW, params.rectH],
      uRadius: params.radius,
      uRefractionHeight: params.refractionHeight * params.dpr,
      uIOR: params.ior,
      uChromaticAberr: params.chromaticAberration * params.dpr,
      uBlurMix: params.blurMix,
      uVibrancy: params.vibrancy,
      uTintR: params.tintR,
      uTintG: params.tintG,
      uTintB: params.tintB,
      uTintAmount: params.tintAmount,
      uHighlightIntensity: params.highlightIntensity,
      uHighlightAngle: params.highlightAngle,
      uShadowExpand: params.shadowExpand,
      uShadowOffsetY: params.shadowOffsetY,
      uTintColorR: params.tintColorR,
      uTintColorG: params.tintColorG,
      uTintColorB: params.tintColorB,
      uTintOpacity: params.tintOpacity,
    }, 2); // start at texture unit 2

    drawQuad(gl);
    gl.disable(gl.BLEND);
  }

  destroy(): void {
    const { gl } = this;
    if (this.sceneFBO) deleteFBO(this.sceneFBO, gl);
    if (this.blurFBO) deleteFBO(this.blurFBO, gl);
    if (this.sceneTexture) gl.deleteTexture(this.sceneTexture);
    gl.deleteProgram(this.blurProgram);
    gl.deleteProgram(this.glassProgram);
    gl.deleteProgram(this.blitProgram);
  }
}
