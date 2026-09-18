/**
 * GLSL shader sources for the WebGL glass rendering pipeline.
 */

// ─── Separable Gaussian Blur ─────────────────────────────────────────────────

export const BLUR_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uDir;        // (1/w, 0) or (0, 1/h)
uniform float uRadius;    // blur radius in pixels
uniform vec2 uResolution;

// 9-tap Gaussian weights (sigma = radius/3)
void main() {
  float sigma = max(uRadius / 3.0, 0.001);
  float twoSigma2 = 2.0 * sigma * sigma;

  vec4 sum = vec4(0.0);
  float weightSum = 0.0;
  int taps = int(min(uRadius, 32.0)) * 2 + 1;
  int halfTaps = taps / 2;

  for (int i = -32; i <= 32; i++) {
    if (i > halfTaps || i < -halfTaps) continue;
    float d = float(i);
    float w = exp(-d * d / twoSigma2);
    vec2 offset = uDir * d;
    sum += texture(uTex, vUv + offset) * w;
    weightSum += w;
  }
  fragColor = sum / weightSum;
}`;

// ─── SDF Utilities ───────────────────────────────────────────────────────────

export const SDF_GLSL = `
// Superellipse corner SDF
float superellipseCornerSDF(vec2 p, float r, float n) {
  vec2 a = abs(p);
  return pow(pow(a.x, n) + pow(a.y, n), 1.0 / n) - r;
}

// Rounded rectangle SDF with superelliptical corners
float roundedRectSDF(vec2 p, vec2 center, float halfW, float halfH, float r, float n) {
  vec2 q = abs(p - center) - vec2(halfW - r, halfH - r);
  float outside = length(max(q, 0.0)) - r;
  float inside = min(max(q.x, q.y), 0.0);
  return outside + inside;
}

// Standard rounded rect SDF (for simple cases)
float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Gradient of SDF for surface normal
vec2 gradSDF(vec2 p, vec2 center, float halfW, float halfH, float r) {
  float eps = 0.5;
  float dx = roundedRectSDF(p + vec2(eps, 0.0), center, halfW, halfH, r, 5.0)
           - roundedRectSDF(p - vec2(eps, 0.0), center, halfW, halfH, r, 5.0);
  float dy = roundedRectSDF(p + vec2(0.0, eps), center, halfW, halfH, r, 5.0)
           - roundedRectSDF(p - vec2(0.0, eps), center, halfW, halfH, r, 5.0);
  return normalize(vec2(dx, dy));
}`;

// ─── Background + Shadow Pass ────────────────────────────────────────────────

export const SCENE_BG_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uBgTex;
uniform float uShadowExpand;
uniform float uShadowOffsetY;
uniform float uShadowFactor;

${SDF_GLSL}

void main() {
  vec3 bg = texture(uBgTex, vUv).rgb;

  // Shadow computation removed for this pass - shadow is done in glass shader
  fragColor = vec4(bg, 1.0);
}`;

// ─── Kyant Glass Fragment Shader ─────────────────────────────────────────────
// Based on Martin's port of Kyant Android Liquid Glass
// Key features: circleMap() refraction, chromatic dispersion, vibrancy, tint

export const GLASS_KYANT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSceneTex;     // sharp background
uniform sampler2D uBlurTex;      // blurred background
uniform vec2 uResolution;        // canvas size in px
uniform float uDpr;

// Glass shape params
uniform vec4 uRect;              // (x, y, w, h) in CSS px
uniform float uRadius;           // corner radius in CSS px

// Refraction params
uniform float uRefractionHeight; // displacement strength (px)
uniform float uIOR;              // index of refraction
uniform float uChromaticAberr;   // chromatic dispersion

// Visual params
uniform float uBlurMix;          // 0=sharp, 1=full blur
uniform float uVibrancy;         // brightness/saturation boost
uniform float uTintR;
uniform float uTintG;
uniform float uTintB;
uniform float uTintAmount;

// Highlight params
uniform float uHighlightIntensity;
uniform float uHighlightAngle;
uniform float uShadowExpand;
uniform float uShadowOffsetY;

// Tint overlay
uniform float uTintColorR;
uniform float uTintColorG;
uniform float uTintColorB;
uniform float uTintOpacity;

${SDF_GLSL}

// circleMap: displacement along SDF gradient
vec2 circleMap(vec2 uv, vec2 grad, float height) {
  return uv + grad * height / uResolution;
}

void main() {
  vec2 px = gl_FragCoord.xy;
  px.y = uResolution.y - px.y; // flip Y for screen coords

  // Glass rect in pixel coords
  vec2 center = (uRect.xy + uRect.zw * 0.5) * uDpr;
  vec2 halfSize = uRect.zw * 0.5 * uDpr;
  float r = uRadius * uDpr;

  // SDF
  float sdf = sdRoundedRect(px - center, halfSize, r);
  float inside = smoothstep(1.5, -0.5, sdf);

  // Shadow (outside glass)
  float shadowDist = sdf + uShadowExpand * uDpr;
  float shadow = exp(-shadowDist * shadowDist / (2.0 * pow(uShadowExpand * uDpr * 0.4, 2.0)));
  shadow *= 0.5 * step(0.0, sdf);

  if (inside < 0.01 && shadow < 0.001) discard;

  // Surface normal from SDF gradient
  vec2 grad = vec2(0.0);
  if (sdf < r * 0.5) {
    float eps = 1.0;
    float dx = sdRoundedRect(px - center + vec2(eps, 0.0), halfSize, r)
             - sdRoundedRect(px - center - vec2(eps, 0.0), halfSize, r);
    float dy = sdRoundedRect(px - center + vec2(0.0, eps), halfSize, r)
             - sdRoundedRect(px - center - vec2(0.0, eps), halfSize, r);
    grad = normalize(vec2(dx, dy));
  }

  // Edge distance for refraction
  float edgeDist = max(0.0, -sdf);
  float edgeNorm = edgeDist / (r * 0.5);
  edgeNorm = min(edgeNorm, 1.0);

  // Refraction factor (Snell's law approximation, matching Martin/Kyant)
  float refrH = uRefractionHeight * (1.0 - edgeNorm);
  vec2 refractedUv = circleMap(vUv, grad, refrH);

  // Chromatic aberration
  float chroma = uChromaticAberr * (1.0 - edgeNorm * 0.7);
  vec2 chromaOffset = grad * chroma / uResolution;

  // Sample background with refraction and chromatic dispersion
  float sceneR = texture(uSceneTex, refractedUv + chromaOffset).r;
  float sceneG = texture(uSceneTex, refractedUv).g;
  float sceneB = texture(uSceneTex, refractedUv - chromaOffset).b;
  vec3 scene = vec3(sceneR, sceneG, sceneB);

  // Sample blurred background
  float blurR = texture(uBlurTex, refractedUv + chromaOffset).r;
  float blurG = texture(uBlurTex, refractedUv).g;
  float blurB = texture(uBlurTex, refractedUv - chromaOffset).b;
  vec3 blurred = vec3(blurR, blurG, blurB);

  // Mix sharp and blurred based on edge distance
  float blurFactor = uBlurMix * (1.0 - edgeNorm * 0.85);
  vec3 color = mix(scene, blurred, blurFactor);

  // Vibrancy (brightness + saturation boost)
  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(lum), color, 1.0 + uVibrancy * 0.3);
  color *= 1.0 + uVibrancy * 0.15;

  // Tint (Hue blend approximation)
  if (uTintAmount > 0.0) {
    vec3 tintColor = vec3(uTintR, uTintG, uTintB);
    float tintLum = dot(tintColor, vec3(0.2126, 0.7152, 0.0722));
    vec3 tintNorm = tintColor / max(tintLum, 0.001);
    color = mix(color, color * tintNorm, uTintAmount * 0.5);
  }

  // Fresnel brightening at edges
  float fresnel = pow(1.0 - edgeNorm, 4.0) * 0.3;
  color += vec3(fresnel);

  // Specular highlight (anisotropic glare)
  if (uHighlightIntensity > 0.0) {
    float angle = atan(grad.y, grad.x);
    float glareAngle = (angle - 0.7854 + uHighlightAngle) * 2.0;
    float glareIntensity = pow(max(0.0, 0.5 + sin(glareAngle) * 0.5), 1.5);
    float glareGeo = pow(1.0 - edgeNorm, 3.0);
    float glare = glareIntensity * glareGeo * uHighlightIntensity;
    color += vec3(glare * 1.2, glare * 1.15, glare);
  }

  // Tint overlay (user-configurable)
  if (uTintOpacity > 0.0) {
    vec3 overlay = vec3(uTintColorR, uTintColorG, uTintColorB);
    color = mix(color, overlay, uTintOpacity);
  }

  // Final composite with shadow
  vec3 shadowColor = vec3(0.0);
  float alpha = inside;
  color = mix(color, shadowColor, shadow);
  alpha = max(alpha, shadow * 0.5);

  fragColor = vec4(color, alpha);
}`;

// ─── Copy/Blit Shader ────────────────────────────────────────────────────────

export const BLIT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
void main() {
  fragColor = texture(uTex, vUv);
}`;
