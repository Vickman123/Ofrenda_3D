/**
 * Esquema de datos y tipos para Ofrendas 3D
 */

export type ItemCategory = 
  | 'velas' 
  | 'flores' 
  | 'calaveras' 
  | 'comida' 
  | 'marcos' 
  | 'incienso' 
  | 'musica'
  | 'papel_picado';

export interface ItemTemplate {
  id: string;
  name: string;
  shortName: string;
  category: ItemCategory;
  description: string;
  defaultScale: number;
  recommendedLevel: 0 | 1 | 2 | 3;
  icon: string;
}

export interface PlacedItemData {
  instanceId: string;
  templateId: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
  level: number; // 0: base/suelo, 1: nivel 1, 2: nivel 2, 3: nivel 3
  customData?: {
    photoUrl?: string;
    personName?: string;
    dedication?: string;
  };
}

export type OfrendaTheme = 
  | 'casa_mexicana' 
  | 'panteon_nocturno' 
  | 'noche_velas' 
  | 'tarde_dorada' 
  | 'altar_mistico';

export interface ThemeConfig {
  id: OfrendaTheme;
  name: string;
  description: string;
  backgroundColor: number;
  fogColor: number;
  ambientLightColor: number;
  ambientLightIntensity: number;
  keyLightColor: number;
  keyLightIntensity: number;
  accentLightColor: number;
  accentLightIntensity: number;
  previewUrl?: string;
}

export interface OfrendaData {
  version: string;
  id: string;
  title: string;
  dedication: string;
  theme: OfrendaTheme;
  items: PlacedItemData[];
  createdAt: number;
  updatedAt: number;
}
