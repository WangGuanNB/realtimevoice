'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  MessageCircle,
  Copy,
  Download
} from 'lucide-react';
import Icon from '@/components/icon';
import { useTranslations } from 'next-intl';

export interface SocialShareProps {
  imageUrl: string;
  imageData: string; // base64 image data for download
  mimeType: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  onShare?: (platform: string) => void;
}

export default function SocialShare({
  imageUrl,
  imageData,
  mimeType,
  title = "Check out my website built with ShipFire!",
  description = "I just built this amazing SaaS website using ShipFire. Build your website in 3 minutes with zero code!",
  hashtags = ["ShipFire", "SaaS", "WebsiteBuilder", "NoCode"],
  onShare
}: SocialShareProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const t = useTranslations('share');

  // 追踪分享事件
  const trackShare = async (platform: string, imageUrl?: string) => {
    try {
      await fetch('/api/track-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          imageUrl,
        }),
      });
    } catch (error) {
      // 静默处理追踪错误，不影响用户体验
      console.warn('Failed to track share:', error);
    }
  };

  // 上传图片到R2并获取分享URL
  const uploadImageForSharing = async () => {
    if (shareableUrl) return shareableUrl;

    setIsUploading(true);
    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageData,
          mimeType: mimeType,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShareableUrl(result.shareableUrl);
        return result.shareableUrl;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to prepare image for sharing');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // 生成分享文本
  const getShareText = (platform: string, shareUrl: string) => {
    const hashtagsText = hashtags.map(tag => `#${tag}`).join(' ');
    const baseText = t('text');
    
    switch (platform) {
      case 'twitter':
        return `${baseText} ${shareUrl} ${hashtagsText}`;
      case 'facebook':
        return `${baseText} ${shareUrl} 🎨✨`;
      case 'linkedin':
        return `${baseText} ${shareUrl} ${hashtagsText}`;
      case 'pinterest':
        return `${baseText} ${shareUrl} 🎨 ${hashtagsText}`;
      case 'whatsapp':
        return `${baseText} ${shareUrl}`;
      case 'telegram':
        return `${baseText} ${shareUrl}`;
      case 'reddit':
        return `${baseText} ${shareUrl}`;
      default:
        return `${baseText} ${shareUrl} ${hashtagsText}`;
    }
  };

  // 分享到不同平台
  const shareToSocial = async (platform: string) => {
    const url = await uploadImageForSharing();
    if (!url) return;

    const shareText = getShareText(platform, url);
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(url);

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}&media=${encodeURIComponent(imageUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(title)}`;
        break;
      default:
        return;
    }

    // 打开分享窗口
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    
    // 追踪分享事件
    trackShare(platform, url);
    
    // 触发分享回调
    onShare?.(platform);
    toast.success(`Sharing to ${platform}!`);
  };

  // 复制链接
  const copyLink = async () => {
    const url = await uploadImageForSharing();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      trackShare('copy', url);
      toast.success('Link copied to clipboard!');
      onShare?.('copy');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // 下载图片
  const downloadImage = () => {
    try {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `website-${Date.now()}.${mimeType.split('/')[1] || 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      trackShare('download');
      toast.success('Image downloaded!');
      onShare?.('download');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  // 原生分享API（如果支持）
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        const url = await uploadImageForSharing();
        if (!url) return;

        await navigator.share({
          title: title,
          text: description,
          url: url,
        });
        trackShare('native', url);
        onShare?.('native');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="size-5" />
          Share Your Creation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Show off your website built with ShipFire to the world!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 主要分享按钮 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 下载按钮 */}
          <Button
            onClick={downloadImage}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="size-4" />
            Download
          </Button>

          {/* 复制链接按钮 */}
          <Button
            onClick={copyLink}
            variant="outline"
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Copy className="size-4" />
            {isUploading ? 'Preparing...' : 'Copy Link'}
          </Button>
        </div>

        {/* 社交媒体分享按钮 */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Share on social media</p>
          
          {/* 第一行：主要平台 */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => shareToSocial('twitter')}
              disabled={isUploading}
              size="sm"
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white flex items-center gap-1.5"
            >
              <Twitter className="size-3.5" />
              <span className="text-xs">Twitter</span>
            </Button>

            <Button
              onClick={() => shareToSocial('facebook')}
              disabled={isUploading}
              size="sm"
              className="bg-[#4267B2] hover:bg-[#365899] text-white flex items-center gap-1.5"
            >
              <Facebook className="size-3.5" />
              <span className="text-xs">Facebook</span>
            </Button>

            <Button
              onClick={() => shareToSocial('linkedin')}
              disabled={isUploading}
              size="sm"
              className="bg-[#0077B5] hover:bg-[#005885] text-white flex items-center gap-1.5"
            >
              <Linkedin className="size-3.5" />
              <span className="text-xs">LinkedIn</span>
            </Button>

            <Button
              onClick={() => shareToSocial('pinterest')}
              disabled={isUploading}
              size="sm"
              className="bg-[#BD081C] hover:bg-[#9d0717] text-white flex items-center gap-1.5"
            >
              <Icon name="RiPinterestLine" className="size-3.5" />
              <span className="text-xs">Pinterest</span>
            </Button>
          </div>

          {/* 第二行：消息平台 */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => shareToSocial('whatsapp')}
              disabled={isUploading}
              size="sm"
              className="bg-[#25D366] hover:bg-[#20b358] text-white flex items-center gap-1.5"
            >
              <MessageCircle className="size-3.5" />
              <span className="text-xs">WhatsApp</span>
            </Button>

            <Button
              onClick={() => shareToSocial('telegram')}
              disabled={isUploading}
              size="sm"
              className="bg-[#0088CC] hover:bg-[#006ba6] text-white flex items-center gap-1.5"
            >
              <Icon name="RiTelegramLine" className="size-3.5" />
              <span className="text-xs">Telegram</span>
            </Button>

            <Button
              onClick={() => shareToSocial('reddit')}
              disabled={isUploading}
              size="sm"
              className="bg-[#FF4500] hover:bg-[#e03d00] text-white flex items-center gap-1.5"
            >
              <Icon name="RiRedditLine" className="size-3.5" />
              <span className="text-xs">Reddit</span>
            </Button>

            {/* 原生分享（移动端） */}
            {typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                onClick={nativeShare}
                disabled={isUploading}
                size="sm"
                variant="outline"
                className="flex items-center gap-1.5"
              >
                <Share2 className="size-3.5" />
                <span className="text-xs">More</span>
              </Button>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Preparing image for sharing...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
