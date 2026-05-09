export interface GeminiImageConfig {
  // Gemini 2.5 Flash Image specific parameters
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';
  output_format?: 'jpg' | 'png';
  output_quality?: number; // 0-100
  safety_tolerance?: number; // 1-5
  seed?: number;
  
  // Multi-image fusion parameters
  reference_images?: string[]; // base64 encoded images for fusion
  
  // Editing parameters
  edit_mode?: 'generate' | 'edit' | 'inpaint' | 'outpaint';
  mask?: string; // base64 encoded mask for inpainting
}

export interface GeneratedGeminiImage {
  imageBytes: string;
  mimeType: string;
  seed?: number;
}

export interface GeminiImageResponse {
  images: GeneratedGeminiImage[];
  success: boolean;
  error?: string;
}
