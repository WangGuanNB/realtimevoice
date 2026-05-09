"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

// 声明全局类型，确保 TypeScript 识别 gtag 和 dataLayer
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

export default function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string | null>(null);

  useEffect(() => {
    // 优先从构建时内联的环境变量读取
    let analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

    // 如果构建时环境变量不存在，尝试从 meta 标签读取（备用方案）
    if (!analyticsId && typeof window !== "undefined") {
      const metaTag = document.querySelector('meta[name="ga-id"]');
      if (metaTag) {
        analyticsId = metaTag.getAttribute("content") || undefined;
      }
    }

    if (analyticsId) {
      setGaId(analyticsId);
    }
  }, []);

  // 只在生产环境且 GA ID 存在时渲染
  if (process.env.NODE_ENV !== "production" || !gaId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics gtag.js 脚本 */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      {/* 初始化 dataLayer 和 gtag */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
