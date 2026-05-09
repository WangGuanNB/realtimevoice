import OpenAI from 'openai';

export interface OpenAIDalleSettings {
  apiKey: string;
  model?: 'dall-e-2' | 'dall-e-3';
}

export interface DalleImageConfig {
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

export interface GeneratedDalleImage {
  imageBytes: string;
  url?: string;
  mimeType: string;
}

export class OpenAIDalleProvider {
  private client: OpenAI;
  private model: 'dall-e-2' | 'dall-e-3';

  constructor(settings: OpenAIDalleSettings) {
    this.client = new OpenAI({ apiKey: settings.apiKey });
    this.model = settings.model || 'dall-e-3';
  }

  async generateImages(
    prompt: string,
    config?: DalleImageConfig
  ): Promise<GeneratedDalleImage[]> {
    try {
      const response = await this.client.images.generate({
        model: this.model,
        prompt: prompt,
        size: config?.size || '1024x1024',
        quality: config?.quality || 'standard',
        style: config?.style || 'vivid',
        n: config?.n || 1,
        response_format: 'url' // Can also be 'b64_json'
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No images generated from OpenAI DALL-E');
      }

      // Convert URLs to base64 if needed
      const images = await Promise.all(response.data.map(async (image) => {
        if (image.url) {
          // Download and convert to base64
          const imageResponse = await fetch(image.url);
          const arrayBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          
          return {
            imageBytes: base64,
            url: image.url,
            mimeType: 'image/png'
          };
        }
        return {
          imageBytes: '', // 提供空字符串作为默认值
          url: image.url,
          mimeType: 'image/png'
        };
      }));

      return images;
    } catch (error) {
      console.error('OpenAI DALL-E generation error:', error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

}

export function createOpenAIDalle(settings: OpenAIDalleSettings): OpenAIDalleProvider {
  return new OpenAIDalleProvider(settings);
}

export const openaiDalle = createOpenAIDalle;
