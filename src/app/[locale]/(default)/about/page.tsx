import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAboutPage } from "@/services/page";
import { getCanonicalUrl } from "@/lib/utils";

// 启用 ISR：关于页面内容基本不变，24小时重新生成一次
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const page = await getAboutPage(locale);

  return {
    title: page.metadata.title,
    description: page.metadata.description,
    keywords: page.metadata.keywords,
    openGraph: {
      title: page.metadata.title,
      description: page.metadata.description,
      type: "website",
      url: getCanonicalUrl(locale, '/about'),
    },
    twitter: {
      card: "summary_large_image",
      title: page.metadata.title,
      description: page.metadata.description,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: getCanonicalUrl(locale, '/about'),
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getAboutPage(locale);
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">
          {page.title}
        </h1>
        
        <div className="text-lg leading-relaxed space-y-6">
          <p>
            <strong>Wplace Pixel</strong> {page.intro}
          </p>

          <h2 className="text-3xl font-semibold mt-10 mb-6 text-primary">{page.story.title}</h2>
          
          <p>
            {page.story.content}
          </p>

          <h2 className="text-3xl font-semibold mt-10 mb-6 text-primary">{page.mission.title}</h2>

          <div className="grid md:grid-cols-2 gap-8 my-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-xl font-semibold mb-4 text-blue-800">{page.mission.empowerment.title}</h3>
              <p className="text-blue-700">
                {page.mission.empowerment.description}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-xl font-semibold mb-4 text-green-800">{page.mission.community.title}</h3>
              <p className="text-green-700">
                {page.mission.community.description}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-xl font-semibold mb-4 text-purple-800">{page.mission.privacy.title}</h3>
              <p className="text-purple-700">
                {page.mission.privacy.description}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
              <h3 className="text-xl font-semibold mb-4 text-orange-800">{page.mission.innovation.title}</h3>
              <p className="text-orange-700">
                {page.mission.innovation.description}
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-semibold mt-10 mb-6 text-primary">{page.features.title}</h2>

          <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-8 rounded-xl border border-gray-200 my-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⚡</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{page.features.fast.title}</h3>
                <p className="text-sm text-gray-600">
                  {page.features.fast.description}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{page.features.matching.title}</h3>
                <p className="text-sm text-gray-600">
                  {page.features.matching.description}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🌍</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{page.features.global.title}</h3>
                <p className="text-sm text-gray-600">
                  {page.features.global.description}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-semibold mt-10 mb-6 text-primary">{page.contact.title}</h2>
          
          <p>
            {page.contact.description}
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 my-8 rounded-r-lg">
            <p className="text-amber-800 font-medium">
              <strong>Important Notice:</strong> {page.contact.notice}
            </p>
          </div>

          <h2 className="text-3xl font-semibold mt-10 mb-6 text-primary">{page.ready.title}</h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 text-center mb-8">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              {page.ready.description} <a href="/" className="text-blue-600 hover:text-blue-800 font-medium underline decoration-2 underline-offset-2">{page.ready.homepage_link}</a> {page.ready.description_continued}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {page.ready.subtitle}
            </p>
          </div>

          <div className="text-center mt-12 p-6 bg-gray-50 rounded-xl border">
            <p className="text-gray-600 mb-2">{page.footer.copyright}</p>
            <p className="text-sm text-gray-500">{page.footer.privacy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
