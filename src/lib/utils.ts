import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 获取base URL（使用环境变量配置）
 * 解决hardcode和双斜杠问题
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
  return url.replace(/\/$/, ''); // 去除末尾斜杠，防止生成 //
}

/**
 * 生成多语言canonical URL
 * 统一处理所有页面的canonical URL逻辑
 */
export function getCanonicalUrl(locale: string, path: string = '/'): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path === '/' ? '' : path;

  if (locale === 'en') {
    return `${baseUrl}${cleanPath}/`;
  }

  return `${baseUrl}/${locale}${cleanPath}/`;
}

// ========================================
// 社交媒体配置工具函数 (Social Media Configuration)
// ========================================

/**
 * 获取统一的社交媒体配置
 * 从环境变量读取，避免在翻译文件中硬编码
 */
export function getSocialMediaConfig() {
  return {
    support_email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@shipfire.com',
    twitter_url: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://x.com/shipfire',
    github_url: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/shipfire', 
    discord_url: process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/shipfire'
  };
}

/**
 * 替换Landing页面数据中的社交媒体链接
 * 将翻译文件中的硬编码链接替换为环境变量配置
 */
export function replaceSocialMediaUrls(pageData: any) {
  if (!pageData?.footer?.social?.items) {
    return pageData;
  }

  const socialConfig = getSocialMediaConfig();

  // 替换footer中的社交媒体链接
  pageData.footer.social.items = pageData.footer.social.items.map((item: any) => {
    switch (item.title) {
      case 'X':
        return { ...item, url: socialConfig.twitter_url };
      case 'Github':
        return { ...item, url: socialConfig.github_url };
      case 'Discord':
        return { ...item, url: socialConfig.discord_url };
      case 'Email':
        return { ...item, url: `mailto:${socialConfig.support_email}` };
      default:
        return item;
    }
  });

  return pageData;
}
