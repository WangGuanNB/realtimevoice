import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { getPostsByLocaleWithFallback } from "@/models/post";
import { getCanonicalUrl } from "@/lib/utils";
import moment from "moment";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("blog");

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: getCanonicalUrl(locale, "/blog"),
    },
    alternates: {
      canonical: getCanonicalUrl(locale, "/blog"),
    },
  };
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("blog");

  const posts = await getPostsByLocaleWithFallback(locale, 1, 50) ?? [];

  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-12 text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("title")}
          </p>
          <h1 className="mb-3 text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground md:text-base lg:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="flex flex-wrap items-stretch justify-center gap-6">
          {posts.length === 0 ? (
            <p className="w-full py-12 text-center text-muted-foreground">
              {t("no_posts")}
            </p>
          ) : (
            posts.map((post) => (
              <Link
                key={post.uuid}
                href={post.slug ? `/blog/${post.slug}` : "#"}
                className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              >
                <div className="flex h-full flex-col overflow-clip rounded-xl border border-border transition-colors hover:border-primary/50 hover:bg-muted/30">
                  {post.cover_url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={post.cover_url}
                        alt={post.title || ""}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col items-center text-center px-4 py-4 md:px-4 md:py-4 lg:px-4 lg:py-4">
                    <h2 className="mb-2 text-lg font-semibold md:text-xl">
                      {post.title}
                    </h2>
                    <p className="mb-3 flex-1 text-sm text-muted-foreground line-clamp-2 md:mb-4">
                      {post.description}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
                      {post.created_at && (
                        <span>
                          {moment(post.created_at).format("YYYY-MM-DD")}
                        </span>
                      )}
                      <span className="flex items-center font-medium text-primary hover:underline">
                        {t("read_more_text")}
                        <ArrowRight className="ml-1 size-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
