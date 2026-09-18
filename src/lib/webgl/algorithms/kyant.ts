/**
 * Kyant algorithm: circleMap() refraction + chromatic dispersion + vibrancy.
 * Reference: Martin's WebGL port of Kyant Android Liquid Glass.
 *
 * Key characteristics:
 * - Refraction via circleMap() displacement along SDF gradient
 * - Per-channel chromatic dispersion (configurable intensity)
 * - Vibrancy (brightness + saturation boost)
 * - BlendMode.Hue tint
 * - Anisotropic specular glare based on normal angle
 * - SDF-based shadow with Gaussian falloff
 */

export interface KyantParams {
  refractionHeight: number;
  ior: number;
  chromaticAberration: number;
  blurMix: number;
  vibrancy: number;
  highlightIntensity: number;
  highlightAngle: number;
}

export const KYANT_DEFAULTS: KyantParams = {
  refractionHeight: 15,
  ior: 1.5,
  chromaticAberration: 3,
  blurMix: 0.6,
  vibrancy: 0.5,
  highlightIntensity: 0.5,
  highlightAngle: 0,
};

export function mapKyantParams(p: Partial<KyantParams>): KyantParams {
  return { ...KYANT_DEFAULTS, ...p };
}
