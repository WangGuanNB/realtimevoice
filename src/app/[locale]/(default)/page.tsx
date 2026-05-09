import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Hero from "@/components/blocks/hero";
import FeatureWhatTwo from "@/components/blocks/feature-what-two";
import Testimonial from "@/components/blocks/testimonial";
import { getLandingPage } from "@/services/page";
import { getCanonicalUrl } from "@/lib/utils";

// 启用 ISR（增量静态再生）：24小时重新生成一次，降低 CPU 消耗
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const metadata: any = {
    alternates: {
      canonical: getCanonicalUrl(locale),
    },
  };

  // 只在英文版本添加 Foundr 验证 meta 标签
  if (locale === "en") {
    metadata.other = {
      "_foundr": "9a6028ae8f80618dd025c26eff1fcf8d"
    };
  }

  return metadata;
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return (
    <>
      {/* Hero Section：一句主标题 + 一句副标题 + 一段简短价值描述 + CTA按钮文字-----------*/}
      {page.hero && <Hero hero={page.hero}/> }

      {/* What is [Tool Name]：定义该工具是什么，主要解决哪些痛点（含主关键词）----------- */}
      {page.introduce && <FeatureWhatTwo section={page.introduce} />}

      {/*Key Features：核心功能：列出4~6个主要功能 */}
     {page.feature && <Feature section={page.feature} />}

      {/* Why Choose [Tool Name]：列出3~4个理由，说明与其他工具的差异------ */}
      {page.benefit && <Feature2 section={page.benefit} />}

      {/* How to Use [Tool Name]：用3个步骤说明使用流程------------ */}
      {page.usage && <Feature3 section={page.usage} />}

      {/*image.png Testimonials / People Love：展示2~3条用户好评或社会信任信息 */}  
      {page.testimonial && <Testimonial section={page.testimonial} />}
       
      {/* FAQ（Frequently Asked Questions）：6问题+简短回答，每个回答≤80字- */}
      {page.faq && <FAQ section={page.faq} />}
      
      {/*Footer：收尾文案 + 品牌词 + CTA（鼓励立即使用）-- */}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
