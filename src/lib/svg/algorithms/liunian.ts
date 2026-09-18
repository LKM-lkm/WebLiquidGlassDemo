/**
 * LiuNian SVG algorithm — Snell's Law physics-based refraction.
 * Reference: https://liunian.js.org/posts/liquid-glass/
 *
 * Technique: Per-pixel Snell's Law refraction curve with squircle bezel
 * profile. Displacement map baked pixel-by-pixel from physics simulation.
 * Full specular highlight pipeline with Lambert shading.
 *
 * This module re-exports the existing liquid-glass.ts implementation.
 */

export { liquidGlass as liunianGlass, type LiquidGlassOptions as LiunianOptions, type LiquidGlassInstance as LiunianInstance } from '../../liquid-glass';
