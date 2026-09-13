export const SCENES = [
  { id: 1, url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2000', name: '优美山谷' },
  { id: 2, url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2000', name: '迷雾山脉' },
  { id: 3, url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000', name: '深邃森林' },
  { id: 4, url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2000', name: '高山湖泊' },
] as const;

export const DEFAULT_GLASS_PARAMS = {
  thickness: 60,
  edgeWidth: 25,
  ior: 1.52,
  blur: 4,
  specularOpacity: 0.4,
  specularHardness: 2,
  backdropSaturation: 1.2,
  displacementScale: 1,
  radius: 32,
} as const;
