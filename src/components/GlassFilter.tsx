import React, { useMemo } from 'react';
import {
  computeRefractionCurve,
  bakeDisplacementMap,
  bakeSpecularLayer,
  bakeMagnificationMap,
  imageDataToDataURL,
  squircleProfile,
} from '../lib/glass-logic';

interface GlassFilterProps {
  id: string;
  width: number;
  height: number;
  radius?: number;
  blur?: number;
  glassThickness?: number;
  bezelWidth?: number;
  refractiveIndex?: number;
  scaleRatio?: number;
  specularOpacity?: number;
  specularHardness?: number;
  refractionSaturation?: number;
  magnifyingScale?: number;
  colorScheme?: 'light' | 'dark';
  dpr?: number;
}

export const GlassFilter: React.FC<GlassFilterProps> = ({
  id,
  width,
  height,
  radius = 20,
  blur = 4,
  glassThickness = 10,
  bezelWidth = 40,
  refractiveIndex = 1.5,
  scaleRatio = 1,
  specularOpacity = 0.5,
  specularHardness = 2,
  refractionSaturation = 1.2,
  magnifyingScale,
  colorScheme,
  dpr = window.devicePixelRatio || 1,
}) => {
  // 1. Refraction displacement map
  const refractionCurve = useMemo(
    () => computeRefractionCurve(glassThickness, bezelWidth, squircleProfile, refractiveIndex),
    [glassThickness, bezelWidth, refractiveIndex],
  );

  const maxOffset = useMemo(
    () => Math.max(...refractionCurve.map(v => Math.abs(v))),
    [refractionCurve],
  );

  const displacementData = useMemo(
    () => bakeDisplacementMap(width, height, width, height, radius, bezelWidth, maxOffset, refractionCurve, dpr),
    [width, height, radius, bezelWidth, maxOffset, refractionCurve, dpr],
  );

  const displacementURL = useMemo(() => imageDataToDataURL(displacementData), [displacementData]);

  // 2. Specular highlight map
  const invertedHardness = 4 / Math.max(0.1, specularHardness);
  const specularData = useMemo(
    () => bakeSpecularLayer(width, height, radius, bezelWidth, Math.PI / 3, dpr, invertedHardness),
    [width, height, radius, bezelWidth, dpr, invertedHardness],
  );

  const specularURL = useMemo(() => imageDataToDataURL(specularData), [specularData]);

  // 3. Optional magnification map
  const magnifyData = useMemo(
    () => (magnifyingScale !== undefined ? bakeMagnificationMap(width, height) : undefined),
    [magnifyingScale, width, height],
  );

  const magnifyURL = useMemo(() => (magnifyData ? imageDataToDataURL(magnifyData) : undefined), [magnifyData]);

  const displacementScale = maxOffset * scaleRatio;

  const darkMatrix = '0.8 0 0 0 0  0 0.8 0 0 0  0 0 0.8 0 0  0 0 0 1 0';
  const lightMatrix = '1.2 0 0 0 0  0 1.2 0 0 0  0 0 1.2 0 0  0 0 0 1 0';

  return (
    <svg style={{ display: 'none' }} colorInterpolationFilters="sRGB">
      <defs>
        <filter
          id={id}
          x={-width * 0.2}
          y={-height * 0.2}
          width={width * 1.4}
          height={height * 1.4}
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          {/* Magnifying layer (optional) */}
          {magnifyingScale !== undefined && magnifyURL && (
            <>
              <feImage href={magnifyURL} result="magnify_map" x="0" y="0" width={width} height={height} preserveAspectRatio="none" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="magnify_map"
                scale={magnifyingScale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="magnified_source"
                colorInterpolationFilters="sRGB"
              />
            </>
          )}

          {/* Color scheme adjustment */}
          {colorScheme && (
            <feColorMatrix
              in={magnifyingScale !== undefined ? 'magnified_source' : 'SourceGraphic'}
              type="matrix"
              values={colorScheme === 'dark' ? darkMatrix : lightMatrix}
              result="brightened_source"
            />
          )}

          {/* Core refraction pipeline */}
          <feGaussianBlur
            in={colorScheme ? 'brightened_source' : magnifyingScale !== undefined ? 'magnified_source' : 'SourceGraphic'}
            stdDeviation={blur}
            result="blurred_source"
          />

          <feImage href={displacementURL} result="displacement_map" x="0" y="0" width={width} height={height} preserveAspectRatio="none" />

          <feDisplacementMap
            in="blurred_source"
            in2="displacement_map"
            scale={displacementScale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
            colorInterpolationFilters="sRGB"
          />

          <feColorMatrix
            in="displaced"
            type="saturate"
            values={refractionSaturation.toString()}
            result="displaced_saturated"
          />

          {/* Specular highlight overlay */}
          <feImage href={specularURL} result="specular_layer" x="0" y="0" width={width} height={height} preserveAspectRatio="none" />

          <feComponentTransfer in="specular_layer" result="specular_faded">
            <feFuncA type="linear" slope={specularOpacity} />
          </feComponentTransfer>

          <feBlend in="specular_faded" in2="displaced_saturated" mode="screen" result="final_output" />
          <feComposite in="final_output" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
    </svg>
  );
};
