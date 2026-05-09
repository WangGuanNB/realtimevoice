export interface ColorPalette {
    name: string;
    hex: string;
    isPremium: boolean;
  }
  
  export interface PixelConverterSettings {
    pixelSize: number;
    scale: number;
    zoomLevel: number;
    showGrid: boolean;
  }
  
  export interface ColorUsage {
    color: ColorPalette;
    count: number;
  }
  
  export interface ConversionStats {
    horizontalBlocks: number;
    verticalBlocks: number;
    totalBlocks: number;
    colorsUsed: ColorUsage[];
    freeColors: number;
    premiumColors: number;
  }
  
  export interface PixelConverterProps {
    onImageUpload?: (file: File) => void;
    onConversionComplete?: (stats: ConversionStats) => void;
  }