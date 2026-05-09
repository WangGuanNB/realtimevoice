import { NextRequest, NextResponse } from 'next/server';
import { newStorage } from '@/lib/storage';
import { getBaseUrl } from '@/lib/utils';
import { getUuid } from '@/lib/hash';
import { auth } from '@/auth';

export interface ImageUploadRequest {
  imageData: string; // base64 encoded image
  mimeType: string;
  fileName?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  shareableUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 可选的用户认证检查
    const session = await auth();
    
    const body: ImageUploadRequest = await request.json();
    const { imageData, mimeType, fileName } = body;

    // 验证必要字段
    if (!imageData || !mimeType) {
      return NextResponse.json({
        success: false,
        error: 'Image data and mime type are required'
      } as ImageUploadResponse, { status: 400 });
    }

    // 解码base64图片数据
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 生成唯一的文件名
    const fileExtension = mimeType.split('/')[1] || 'png';
    const uniqueFileName = fileName || `miniature-${getUuid()}.${fileExtension}`;
    const storageKey = `generated/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${uniqueFileName}`;

    // 初始化存储客户端
    const storage = newStorage();

    // 上传图片到R2
    const uploadResult = await storage.uploadFile({
      body: imageBuffer,
      key: storageKey,
      contentType: mimeType,
      disposition: 'inline' // 允许直接在浏览器中查看
    });

    // 生成公共访问URL
    const publicUrl = uploadResult.url;
    
    // 生成用于分享的URL（包含网站信息）
    const baseUrl = getBaseUrl();
    const shareableUrl = `${baseUrl}/share?image=${encodeURIComponent(publicUrl)}`;

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      shareableUrl: shareableUrl
    } as ImageUploadResponse);

  } catch (error) {
    console.error('Image upload error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to upload image'
    } as ImageUploadResponse, { status: 500 });
  }
}

// GET方法用于健康检查
export async function GET() {
  return NextResponse.json({
    service: 'Image Upload API',
    status: 'active',
    storage: 'Cloudflare R2',
    version: '1.0.0'
  });
}
