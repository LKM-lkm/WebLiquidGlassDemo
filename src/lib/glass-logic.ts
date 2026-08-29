/**
 * Core physics-based refraction and specular rendering engine.
 * All displacement maps are baked as RGBA ImageData where:
 *   R = X offset, G = Y offset, 128 = neutral (zero displacement)
 */

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Convert an ImageData to a data URL for use in SVG feImage href. */
export function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

// ─── Bezel Profile ───────────────────────────────────────────────────────────

/** Super-ellipse profile that produces a squircle-like bezel cross-section. */
export function squircleProfile(t: number): number {
  return Math.pow(1 - Math.pow(1 - t, 4), 1 / 4);
}

// ─── Refraction Curve (Snell's Law) ──────────────────────────────────────────

/**
 * Compute per-sample refraction offsets along the bezel edge.
 *
 * For each of `sampleCount` evenly-spaced points along the bezel profile,
 * this function:
 *   1. Evaluates the profile curve to get the surface normal
 *   2. Applies Snell's Law to find the refracted ray direction
 *   3. Projects the refracted offset back to a scalar displacement
 *
 * @param glassThickness - Physical thickness of the glass medium (px)
 * @param bezelWidth     - Width of the curved bezel region (px)
 * @param bezelProfile   - f(t∈[0,1]) → height — the cross-section shape
 * @param refractiveIndex - Index of refraction (e.g. 1.52 for glass)
 * @param sampleCount    - Number of discrete samples along the edge
 * @returns Array of scalar displacement magnitudes per sample
 */
export function computeRefractionCurve(
  glassThickness: number = 200,
  bezelWidth: number = 50,
  bezelProfile: (t: number) => number = squircleProfile,
  refractiveIndex: number = 1.5,
  sampleCount: number = 128,
): number[] {
  const etaInverse = 1 / refractiveIndex;

  /** Snell's Law: refract an incident normal through the medium. */
  function refract(normalX: number, normalY: number): [number, number] | null {
    const cosTheta = normalY;
    const discriminant = 1 - etaInverse * etaInverse * (1 - cosTheta * cosTheta);
    if (discriminant < 0) return null; // total internal reflection
    const refractedY = Math.sqrt(discriminant);
    return [
      -(etaInverse * cosTheta + refractedY) * normalX,
      etaInverse - (etaInverse * cosTheta + refractedY) * normalY,
    ];
  }

  return Array.from({ length: sampleCount }, (_, i) => {
    const t = i / sampleCount;
    const height = bezelProfile(t);

    // Numerical derivative for surface normal
    const epsilon = t < 1 ? 1e-4 : -1e-4;
    const dHeight = (bezelProfile(t + epsilon) - height) / epsilon;
    const normalLen = Math.sqrt(dHeight * dHeight + 1);
    const normalX = -dHeight / normalLen;
    const normalY = -1 / normalLen;

    const refracted = refract(normalX, normalY);
    if (!refracted) return 0;

    // Project refracted ray onto the displacement axis
    const rayLength = height * bezelWidth + glassThickness;
    return refracted[0] * (rayLength / refracted[1]);
  });
}

// ─── Displacement Map (Refraction) ───────────────────────────────────────────

/**
 * Bake a refraction displacement map into an RGBA ImageData.
 *
 * Only pixels within the bezel region (between inner and outer corner radii)
 * receive non-neutral values. The R channel encodes X displacement and the
 * G channel encodes Y displacement, both centered at 128 (no shift).
 *
 * @param width           - Logical width of the component (px)
 * @param height          - Logical height of the component (px)
 * @param renderWidth     - Render width (typically same as width)
 * @param renderHeight    - Render height (typically same as height)
 * @param cornerRadius    - Border-radius of the glass shape (px)
 * @param bezelWidth      - Width of the curved bezel (px)
 * @param maxOffset       - Maximum displacement magnitude from computeRefractionCurve
 * @param refractionCurve - Output of computeRefractionCurve()
 * @param dpr             - Device pixel ratio
 */
export function bakeDisplacementMap(
  width: number,
  height: number,
  renderWidth: number,
  renderHeight: number,
  cornerRadius: number,
  bezelWidth: number,
  maxOffset: number,
  refractionCurve: number[] = [],
  dpr?: number,
): ImageData {
  const pixelRatio = dpr ?? (typeof window < 'u' ? window.devicePixelRatio ?? 1 : 1);
  const pixelWidth = width * pixelRatio;
  const pixelHeight = height * pixelRatio;
  const imageData = new ImageData(pixelWidth, pixelHeight);

  // Neutral fill: R=128 G=128 B=0 A=255 (little-endian Uint32)
  new Uint32Array(imageData.data.buffer).fill(0xFF008080);

  const scaledRadius = cornerRadius * pixelRatio;
  const scaledBezel = bezelWidth * pixelRatio;
  const outerRadiusSq = (scaledRadius + 1) ** 2;
  const innerRadiusSq = (scaledRadius - scaledBezel) ** 2;
  const radiusSq = scaledRadius ** 2;
  const scaledRenderW = renderWidth * pixelRatio;
  const scaledRenderH = renderHeight * pixelRatio;
  const contentWidth = scaledRenderW - scaledRadius * 2;
  const contentHeight = scaledRenderH - scaledRadius * 2;
  const offsetX = (pixelWidth - scaledRenderW) / 2;
  const offsetY = (pixelHeight - scaledRenderH) / 2;

  for (let row = 0; row < scaledRenderH; row++) {
    for (let col = 0; col < scaledRenderW; col++) {
      const idx = ((offsetY + row) * pixelWidth + offsetX + col) * 4;

      // Signed distance from the nearest corner center
      const isLeft = col < scaledRadius;
      const isRight = col >= scaledRenderW - scaledRadius;
      const isTop = row < scaledRadius;
      const isBottom = row >= scaledRenderH - scaledRadius;

      const dx = isLeft ? col - scaledRadius : isRight ? col - scaledRadius - contentWidth : 0;
      const dy = isTop ? row - scaledRadius : isBottom ? row - scaledRadius - contentHeight : 0;
      const distSq = dx * dx + dy * dy;

      if (distSq <= outerRadiusSq && distSq >= innerRadiusSq) {
        const dist = Math.sqrt(distSq);
        const bezelDepth = scaledRadius - dist;

        // Smooth falloff: 1 inside the corner arc, linearly to 0 at edges
        const edgeFactor = distSq < radiusSq
          ? 1
          : 1 - (dist - Math.sqrt(radiusSq)) / (Math.sqrt(outerRadiusSq) - Math.sqrt(radiusSq));

        // Look up refraction offset by normalized bezel depth
        const curveIndex = ((bezelDepth / scaledBezel) * refractionCurve.length) | 0;
        const offset = refractionCurve[curveIndex] ?? 0;

        // Normalized direction from corner center
        const normalX = dx / dist;
        const normalY = dy / dist;

        // Write displacement: 128 = neutral, ±127 range
        imageData.data[idx]     = 128 + (-normalX * offset / maxOffset) * 127 * edgeFactor;
        imageData.data[idx + 1] = 128 + (-normalY * offset / maxOffset) * 127 * edgeFactor;
        imageData.data[idx + 2] = 0;
        imageData.data[idx + 3] = 255;
      }
    }
  }

  return imageData;
}

// ─── Magnification Displacement Map ──────────────────────────────────────────

/**
 * Generate a radial displacement map that magnifies toward the center.
 * Used for the optional "magnifying glass" effect overlay.
 */
export function bakeMagnificationMap(width: number, height: number): ImageData {
  const pixelRatio = typeof window < 'u' ? window.devicePixelRatio ?? 1 : 1;
  const pixelWidth = width * pixelRatio;
  const pixelHeight = height * pixelRatio;
  const imageData = new ImageData(pixelWidth, pixelHeight);
  const maxRadius = Math.max(pixelWidth / 2, pixelHeight / 2);

  for (let row = 0; row < pixelHeight; row++) {
    for (let col = 0; col < pixelWidth; col++) {
      const idx = (row * pixelWidth + col) * 4;
      const dx = (col - pixelWidth / 2) / maxRadius;
      const dy = (row - pixelHeight / 2) / maxRadius;

      imageData.data[idx]     = 128 - dx * 127;
      imageData.data[idx + 1] = 128 - dy * 127;
      imageData.data[idx + 2] = 0;
      imageData.data[idx + 3] = 255;
    }
  }

  return imageData;
}

// ─── Specular Highlight Layer ────────────────────────────────────────────────

/**
 * Bake a specular (highlight) layer as a grayscale ImageData.
 *
 * The highlight simulates environment reflection on the glass bezel using:
 *   1. A Lambert-like dot product between the surface normal and a fixed
 *      light direction for the base specular intensity.
 *   2. A half-circle falloff curve controlled by `hardness` to sharpen
 *      or soften the highlight edge.
 *
 * Only pixels within the bezel ring receive non-zero values.
 *
 * @param width        - Logical width (px)
 * @param height       - Logical height (px)
 * @param cornerRadius - Border-radius (px)
 * @param bezelWidth   - Bezel width (px)
 * @param lightAngle   - Light direction angle in radians (default π/3 ≈ 60°)
 * @param dpr          - Device pixel ratio
 * @param hardness     - Exponent controlling highlight sharpness (higher = tighter)
 */
export function bakeSpecularLayer(
  width: number,
  height: number,
  cornerRadius: number,
  bezelWidth: number,
  lightAngle: number = Math.PI / 3,
  dpr?: number,
  hardness: number = 2,
): ImageData {
  const pixelRatio = dpr ?? (typeof window < 'u' ? window.devicePixelRatio ?? 1 : 1);
  const pixelWidth = width * pixelRatio;
  const pixelHeight = height * pixelRatio;
  const imageData = new ImageData(pixelWidth, pixelHeight);

  const scaledRadius = cornerRadius * pixelRatio;
  const scaledBezel = bezelWidth * pixelRatio;
  const lightDir = [Math.cos(lightAngle), Math.sin(lightAngle)];

  new Uint32Array(imageData.data.buffer).fill(0);

  const radiusSq = scaledRadius ** 2;
  const outerRadiusSq = (scaledRadius + pixelRatio) ** 2;
  const innerRadiusSq = (scaledRadius - scaledBezel) ** 2;
  const contentWidth = pixelWidth - scaledRadius * 2;
  const contentHeight = pixelHeight - scaledRadius * 2;

  for (let row = 0; row < pixelHeight; row++) {
    for (let col = 0; col < pixelWidth; col++) {
      const idx = (row * pixelWidth + col) * 4;

      const isLeft = col < scaledRadius;
      const isRight = col >= pixelWidth - scaledRadius;
      const isTop = row < scaledRadius;
      const isBottom = row >= pixelHeight - scaledRadius;

      const dx = isLeft ? col - scaledRadius : isRight ? col - scaledRadius - contentWidth : 0;
      const dy = isTop ? row - scaledRadius : isBottom ? row - scaledRadius - contentHeight : 0;
      const distSq = dx * dx + dy * dy;

      if (distSq <= outerRadiusSq && distSq >= innerRadiusSq) {
        const dist = Math.sqrt(distSq);
        const bezelDepth = scaledRadius - dist;

        // Edge falloff: 1 at corner interior, linearly to 0 at outer edge
        const edgeFactor = distSq < radiusSq
          ? 1
          : 1 - (dist - Math.sqrt(radiusSq)) / (Math.sqrt(outerRadiusSq) - Math.sqrt(radiusSq));

        // Surface normal (pointing outward from corner center)
        const normalX = dx / dist;
        const normalY = -dy / dist;

        // 1. Lambert specular: |N · L|
        const lambert = Math.abs(normalX * lightDir[0] + normalY * lightDir[1]);

        // 2. Half-circle edge sharpening
        const edgeGlow = Math.sqrt(1 - (1 - bezelDepth / (1 * pixelRatio)) ** 2);

        // 3. Combined intensity with hardness exponent
        const intensity = lambert * Math.pow(edgeGlow, hardness);

        // Write grayscale with alpha falloff
        const brightness = 255 * intensity;
        imageData.data[idx]     = brightness;
        imageData.data[idx + 1] = brightness;
        imageData.data[idx + 2] = brightness;
        imageData.data[idx + 3] = brightness * intensity * edgeFactor;
      }
    }
  }

  return imageData;
}
