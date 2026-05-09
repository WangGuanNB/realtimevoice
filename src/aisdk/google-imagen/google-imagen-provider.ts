import { GoogleGenAI, PersonGeneration } from "@google/genai";
import type { ImageGenerationConfig, GeneratedImage } from "./google-imagen-types";

export interface GoogleImagenSettings {
  apiKey: string;
  model?: string;
}

export class GoogleImagenProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(settings: GoogleImagenSettings) {
    this.client = new GoogleGenAI({ apiKey: settings.apiKey });
    this.model = settings.model || 'imagen-4.0-generate-001';
  }

  async generateImages(
    prompt: string,
    config?: ImageGenerationConfig
  ): Promise<GeneratedImage[]> {
    try {
      const response = await this.client.models.generateImages({
        model: this.model,
        prompt,
        config: {
          numberOfImages: config?.numberOfImages || 1,
          aspectRatio: config?.aspectRatio || '1:1',
          personGeneration: config?.personGeneration || PersonGeneration.ALLOW_ADULT,
        },
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error('No images generated from Google Imagen');
      }

      return response.generatedImages
        .filter(img => img.image && img.image.imageBytes)
        .map(img => {
          if (!img.image || !img.image.imageBytes) {
            throw new Error('Invalid image data received from Google Imagen');
          }
          return {
            imageBytes: img.image.imageBytes,
            mimeType: 'image/png'
          };
        });
    } catch (error) {
      console.error('Google Imagen generation error:', error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

}

export function createGoogleImagen(settings: GoogleImagenSettings): GoogleImagenProvider {
  return new GoogleImagenProvider(settings);
}

export const googleImagen = createGoogleImagen;
