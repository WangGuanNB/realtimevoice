'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  MessageCircle,
  Copy
} from 'lucide-react';
import Icon from '@/components/icon';
import { useTranslations } from 'next-intl';

export interface CompactSocialShareProps {
  imageUrl: string;
  imageData: string; // base64 image data for download
  mimeType: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  onShare?: (platform: string) => void;
}

export default function CompactSocialShare({
  imageUrl,
  imageData,
  mimeType,
  title = "Check out my website built with ShipFire!",
  description = "I just built this amazing SaaS website using ShipFire. Build your website in 3 minutes with zero code!",
  hashtags = ["ShipFire", "SaaS", "WebsiteBuilder", "NoCode"],
  onShare
}: CompactSocialShareProps) {
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
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodeURIComponent('Amazing Website Built with ShipFire')}&summary=${encodedText}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}&media=${encodeURIComponent(imageUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent('Built this website with ShipFire!')}`;
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
      toast.success(t('success'));
      onShare?.('copy');
    } catch (error) {
      toast.error(t('failed'));
    }
  };

  return (
    <div className="space-y-3">
      {/* 分享标题 */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Share2 className="size-4" />
        {t('title')}
      </div>

      {/* 主要分享按钮 - 圆润椭圆形设计 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => shareToSocial('twitter')}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <Twitter className="size-4" />
          {t('platforms.twitter')}
        </button>

        <button
          onClick={() => shareToSocial('facebook')}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#4267B2] hover:bg-[#365899] text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <Facebook className="size-4" />
          {t('platforms.facebook')}
        </button>

        <button
          onClick={() => shareToSocial('linkedin')}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0077B5] hover:bg-[#005885] text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <Linkedin className="size-4" />
          {t('platforms.linkedin')}
        </button>

        <button
          onClick={() => shareToSocial('pinterest')}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#BD081C] hover:bg-[#9d0717] text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <Icon name="RiPinterestLine" className="size-4" />
          {t('platforms.pinterest')}
        </button>
      </div>

      {/* 第二行分享选项 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => shareToSocial('whatsapp')}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20b358] text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <MessageCircle className="size-4" />
          {t('platforms.whatsapp')}
        </button>

        <button
          onClick={() => shareToSocial('telegram')}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0088CC] hover:bg-[#006ba6] text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <Icon name="RiTelegramLine" className="size-4" />
          {t('platforms.telegram')}
        </button>

        <button
          onClick={() => shareToSocial('reddit')}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FF4500] hover:bg-[#e03d00] text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <Icon name="RiRedditLine" className="size-4" />
          {t('platforms.reddit')}
        </button>

        <button
          onClick={copyLink}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <Copy className="size-4" />
          {t('platforms.copy')}
        </button>
      </div>

      {isUploading && (
        <div className="text-center py-1">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <div className="size-3 animate-spin rounded-full border border-primary border-t-transparent" />
            {t('preparing')}
          </div>
        </div>
      )}
    </div>
  );
}


