import { cache } from 'react';
import { LandingPage, PricingPage, ShowcasePage, AboutPage, ImageGeneratorPage } from "@/types/pages/landing";
import { replaceSocialMediaUrls } from "@/lib/utils";

export const getLandingPage = cache(async (locale: string): Promise<LandingPage> => {
  const pageData = (await getPage("landing", locale)) as LandingPage;
  // 注入环境变量配置的社交媒体链接
  return replaceSocialMediaUrls(pageData);
});

export const getPricingPage = cache(async (locale: string): Promise<PricingPage> => {
  return (await getPage("pricing", locale)) as PricingPage;
});

export const getShowcasePage = cache(async (locale: string): Promise<ShowcasePage> => {
  return (await getPage("showcase", locale)) as ShowcasePage;
});

export const getAboutPage = cache(async (locale: string): Promise<AboutPage> => {
  return (await getPage("about", locale)) as AboutPage;
});

export const getImageGeneratorPage = cache(async (locale: string): Promise<ImageGeneratorPage> => {
  return (await getPage("image-generator", locale)) as ImageGeneratorPage;
});

export async function getPage(
  name: string,
  locale: string
): Promise<LandingPage | PricingPage | ShowcasePage | AboutPage | ImageGeneratorPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }

    const result = await import(
      `@/i18n/pages/${name}/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
    return result;
  } catch (error) {
    console.warn(`Failed to load ${name}/${locale}.json, falling back to en.json`);

    return await import(`@/i18n/pages/${name}/en.json`).then(
      (module) => module.default
    );
  }
}
