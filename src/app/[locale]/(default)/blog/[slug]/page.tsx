import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { findPostBySlug } from "@/models/post";
import { Post } from "@/types/post";
import { getCanonicalUrl } from "@/lib/utils";
import BlogDetail from "@/components/blocks/blog-detail";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await findPostBySlug(slug, locale);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const t = await getTranslations("metadata");

  return {
    title: post.title || t("defaultTitle"),
    description: post.description || t("defaultDescription"),
    openGraph: {
      title: post.title || t("defaultTitle"),
      description: post.description || t("defaultDescription"),
      type: "article",
      url: getCanonicalUrl(locale, `/blog/${slug}`),
      images: post.cover_url ? [post.cover_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title || t("defaultTitle"),
      description: post.description || t("defaultDescription"),
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: getCanonicalUrl(locale, `/blog/${slug}`),
    },
  };
}

export default async function BlogSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await findPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const postData: Post = {
    uuid: post.uuid,
    slug: post.slug || undefined,
    title: post.title || undefined,
    description: post.description || undefined,
    content: post.content || undefined,
    created_at: post.created_at?.toISOString() || undefined,
    updated_at: post.updated_at?.toISOString() || undefined,
    status: post.status || undefined,
    cover_url: post.cover_url || undefined,
    author_name: post.author_name || undefined,
    author_avatar_url: post.author_avatar_url || undefined,
    locale: post.locale || undefined,
  };

  return <BlogDetail post={postData} />;
}

