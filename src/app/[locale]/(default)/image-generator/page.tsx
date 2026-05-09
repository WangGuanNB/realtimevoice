import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import { getAIChatCreditCost } from "@/services/config";
import { getPricingPage } from "@/services/page";
import Feature from "@/components/blocks/feature";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Hero from "@/components/blocks/hero";
import FeatureWhatTwo from "@/components/blocks/feature-what-two";
import Testimonial from "@/components/blocks/testimonial";
import ImageGeneratorTool from "@/components/blocks/image-generator-tool";
import { getImageGeneratorPage } from "@/services/page";
import { getCanonicalUrl } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const page = await getImageGeneratorPage(locale);
  const meta = page.metadata;

  if (!meta) {
    return {};
  }

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      url: getCanonicalUrl(locale, "/image-generator"),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: getCanonicalUrl(locale, "/image-generator"),
    },
  };
}

export default async function ImageGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [page, pricingPage] = await Promise.all([
    getImageGeneratorPage(locale),
    getPricingPage(locale),
  ]);

  return (
    <>
      {page.hero && (
        <Hero hero={page.hero}>
          {page.tool && (
            <ImageGeneratorTool
              tool={page.tool}
              embed
              creditCost={getAIChatCreditCost()}
              pricing={pricingPage.pricing ?? null}
            />
          )}
        </Hero>
      )}
      {page.introduce && <FeatureWhatTwo section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {page.benefit && <Feature2 section={page.benefit} />}
      {page.usage && <Feature3 section={page.usage} />}
      {page.testimonial && <Testimonial section={page.testimonial} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
