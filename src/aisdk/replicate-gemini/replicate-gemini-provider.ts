import { replicate } from "@ai-sdk/replicate";
import { experimental_generateImage as generateImage } from "ai";
import type { GeminiImageConfig, GeneratedGeminiImage } from "./replicate-gemini-types";
import Replicate from 'replicate';
import { newStorage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';
import { Buffer } from 'buffer';

export interface ReplicateGeminiSettings {
  apiToken: string;
  model?: string;
}

export class ReplicateGeminiProvider {
  private apiToken: string;
  private model: string;
  private replicateClient: Replicate;

  constructor(settings: ReplicateGeminiSettings) {
    this.apiToken = settings.apiToken;
    this.model = settings.model || 'google/nano-banana';
    
    // Initialize native Replicate client
    this.replicateClient = new Replicate({
      auth: this.apiToken,
    });
    
    // Set the API token for replicate
    if (typeof process !== 'undefined' && process.env) {
      process.env.REPLICATE_API_TOKEN = this.apiToken;
    }
  }

  async generateImages(
    prompt: string,
    config?: GeminiImageConfig
  ): Promise<GeneratedGeminiImage[]> {
    try {
      // 🎯 回到 AI SDK 方式，更稳定可靠
      const imageModel = replicate.image(this.model);
      
      const input: Record<string, any> = {
        prompt: prompt,
      };

      // Add optional parameters
      if (config?.aspect_ratio) input.aspect_ratio = config.aspect_ratio;
      if (config?.output_format) input.output_format = config.output_format;
      if (config?.output_quality && config.output_quality >= 1 && config.output_quality <= 100) {
        input.output_quality = config.output_quality;
      }
      if (config?.seed) input.seed = config.seed;

      // 🎯 处理参考图片 - 正确的数组格式
      if (config?.reference_images && config.reference_images.length > 0) {
        console.log('Adding reference images for Nano Banana, count:', config.reference_images.length);
        
        // ✅ CRITICAL FIX: image_input 需要数组格式！
        const imageDataUrls = config.reference_images.map(base64Image => 
          `data:image/jpeg;base64,${base64Image}`
        );
        
        // 正确的数组格式
        input.image_input = imageDataUrls;  // 官方要求的数组格式
        
        console.log('✅ Set image_input as array:', imageDataUrls.length, 'images');
        console.log('First image data length:', config.reference_images[0].length);
      }

      console.log('Final input parameters:', Object.keys(input));

      // 使用 AI SDK，让它处理复杂的响应格式
      const { images } = await generateImage({
        model: imageModel,
        prompt: prompt,
        n: 1,
        providerOptions: {
          replicate: input,
        },
      });

      if (!images || images.length === 0) {
        throw new Error('No images generated from Replicate Gemini');
      }

      console.log('✅ AI SDK returned images count:', images.length);

      // 转换为我们的格式
      return await Promise.all(images.map(async (image, index) => {
        const base64 = await this.imageToBase64(image);
        return {
          imageBytes: base64,
          mimeType: this.getMimeType(config?.output_format || 'png'),
          seed: input.seed
        };
      }));

    } catch (error) {
      console.error('❌ Nano Banana generation error:', error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async imageToBase64(image: any): Promise<string> {
    try {
      // Handle different image object formats from AI SDK
      if (image && image.uint8ArrayData && image.uint8ArrayData instanceof Uint8Array) {
        return Buffer.from(image.uint8ArrayData).toString('base64');
      }
      
      if (image && typeof image.base64Data === 'string') {
        return image.base64Data;
      }
      
      if (typeof image === 'string') {
        // If it's a URL, fetch and convert
        if (image.startsWith('http')) {
          return await this.urlToBase64(image);
        }
        // If it's already base64
        return image;
      }
      
      if (image && typeof image.url === 'string') {
        return await this.urlToBase64(image.url);
      }
      
      if (image instanceof Uint8Array) {
        return Buffer.from(image).toString('base64');
      }
      
      console.error('Unexpected image format:', image);
      throw new Error('Unable to convert image to base64');
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  private async urlToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return base64;
    } catch (error) {
      console.error('Error converting URL to base64:', error);
      throw error;
    }
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };
    return mimeTypes[format.toLowerCase()] || 'image/png';
  }
}

export function createReplicateGemini(settings: ReplicateGeminiSettings): ReplicateGeminiProvider {
  return new ReplicateGeminiProvider(settings);
}

export const replicateGemini = createReplicateGemini;