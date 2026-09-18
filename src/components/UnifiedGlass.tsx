/**
 * Unified Glass Component — dispatches to SVG or WebGL renderer based on algorithm.
 * SVG: liunian, deepika → GlassComponent (backdrop-filter)
 * WebGL: kyant, liquidglassstudio, ybouane → WebGLGlass (canvas overlay)
 */

import React, { type ReactNode } from 'react';
import { GlassComponent, type GlassParams } from './SharedUI';
import { WebGLGlass, type WebGLGlassAlgorithm } from './WebGLGlass';
import { DeepikaGlassComponent } from './DeepikaGlassComponent';

export type AlgorithmType = 'svg' | 'webgl';
export type SVGAlgorithm = 'liunian' | 'deepika';
export type GlassAlgorithm = SVGAlgorithm | WebGLGlassAlgorithm;

export const ALGORITHMS: Record<AlgorithmType, { id: string; name: string }[]> = {
  svg: [
    { id: 'liunian', name: 'LiuNian (刘念)' },
    { id: 'deepika', name: 'Deepika' },
  ],
  webgl: [
    { id: 'kyant', name: 'Kyant' },
    { id: 'liquidglassstudio', name: 'Studio' },
    { id: 'ybouane', name: 'Ybouane' },
  ],
};

export function getAlgorithmType(algo: GlassAlgorithm): AlgorithmType {
  if (algo === 'liunian' || algo === 'deepika') return 'svg';
  return 'webgl'; // kyant, liquidglassstudio, ybouane
}

interface UnifiedGlassProps {
  id: string;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  params: GlassParams;
  sceneUrl?: string;
  children?: ReactNode;
  overflowVisible?: boolean;
  algorithm?: GlassAlgorithm;
}

export function UnifiedGlass({
  id,
  width,
  height,
  maxWidth,
  params,
  sceneUrl,
  children,
  overflowVisible = false,
  algorithm = 'liunian',
}: UnifiedGlassProps) {
  const algoType = getAlgorithmType(algorithm);

  if (algoType === 'webgl') {
    return (
      <WebGLGlass
        id={id}
        width={width}
        height={height}
        maxWidth={maxWidth}
        params={params}
        sceneUrl={sceneUrl}
        overflowVisible={overflowVisible}
        algorithm={algorithm as WebGLGlassAlgorithm}
      >
        {children}
      </WebGLGlass>
    );
  }

  // Deepika algorithm
  if (algorithm === 'deepika') {
    return (
      <DeepikaGlassComponent
        id={id}
        width={width}
        height={height}
        maxWidth={maxWidth}
        params={params}
        sceneUrl={sceneUrl}
        overflowVisible={overflowVisible}
      >
        {children}
      </DeepikaGlassComponent>
    );
  }

  // LiuNian algorithm (default SVG)
  const svgParams = {
    ...params,
    bezelWidth: params.bezelWidth ?? params.edgeWidth ?? 25,
    glassThickness: params.glassThickness ?? params.thickness ?? 60,
    refractiveIndex: params.refractiveIndex ?? params.ior ?? 1.52,
    scaleRatio: params.displacementScale ?? 1,
    refractionSaturation: params.backdropSaturation ?? 1.2,
  };

  return (
    <GlassComponent
      id={id}
      width={width}
      height={height}
      maxWidth={maxWidth}
      params={svgParams}
      sceneUrl={sceneUrl}
      overflowVisible={overflowVisible}
    >
      {children}
    </GlassComponent>
  );
}
