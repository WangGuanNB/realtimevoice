import { PersonGeneration } from "@google/genai";

export interface ImageGenerationConfig {
  numberOfImages?: number;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  personGeneration?: PersonGeneration;
}

export interface GeneratedImage {
  imageBytes: string;
  mimeType: string;
}

export interface ImageGenerationResponse {
  images: GeneratedImage[];
  success: boolean;
  error?: string;
}
