import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getBaseUrl } from '@/lib/utils';

interface SharePageProps {
  searchParams: Promise<{ image?: string }>;
}

function ShareContent({ imageUrl }: { imageUrl: string | null }) {
  if (!imageUrl) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Card>
            <CardContent className="py-12">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Wand2 className="h-8 w-8" />
              </div>
              <h1 className="mb-4 text-2xl font-bold">No Content to Share</h1>
              <p className="mb-6 text-muted-foreground">
                It looks like there's no content associated with this link.
              </p>
              <Button asChild>
                <Link href="/">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Build Your Website
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 图片展示 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                ShipFire Website
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">Built with ShipFire</Badge>
                <Badge variant="outline">SaaS Platform</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                <img
                  src={imageUrl}
                  alt="Website built with ShipFire"
                  className="h-full w-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* 介绍和CTA */}
          <Card>
            <CardHeader>
              <CardTitle>Build Your Website Too!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-900/20 dark:to-purple-900/20">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    🚀 Build Your SaaS Website in 3 Minutes
                  </h3>
                  <p className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                    Create professional websites with zero code using ShipFire's advanced platform and AI optimization tools.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-medium">100% Free Forever</h4>
                      <p className="text-sm text-muted-foreground">
                        No credit card required, no hidden costs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-medium">50+ Professional Templates</h4>
                      <p className="text-sm text-muted-foreground">
                        SaaS, landing pages, product pages, and more
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-medium">Lightning Fast Deployment</h4>
                      <p className="text-sm text-muted-foreground">
                        Launch your website in just 3 minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href="/#generator">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Build Your Website Now
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Learn More About ShipFire
                  </Link>
                </Button>
              </div>

              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Join <strong>50,000+</strong> developers who have already built{' '}
                  <strong>200,000+</strong> websites with ShipFire!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ searchParams }: SharePageProps) {
  const { image } = await searchParams;
  
  const title = "Amazing Website Built with ShipFire | Free SaaS Website Builder";
  const description = "🚀 Professional website created with ShipFire! Build your SaaS website in 3 minutes with zero code. FREE forever - Try our website builder now!";
  const keywords = "ShipFire, SaaS website builder, website builder, no-code website builder, free website builder, AI website builder, indie developer tools";
  
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${getBaseUrl()}/share${image ? `?image=${encodeURIComponent(image)}` : ''}`,
      siteName: 'ShipFire',
      images: image ? [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: 'Website built with ShipFire',
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@shipfire',
      creator: '@shipfire',
      title,
      description,
      images: image ? [image] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${getBaseUrl()}/share${image ? `?image=${encodeURIComponent(image)}` : ''}`,
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const { image } = await searchParams;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <Suspense fallback={
        <div className="container py-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="animate-pulse space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted"></div>
              <div className="h-8 w-64 rounded bg-muted mx-auto"></div>
              <div className="h-4 w-96 rounded bg-muted mx-auto"></div>
            </div>
          </div>
        </div>
      }>
        <ShareContent imageUrl={image || null} />
      </Suspense>
    </main>
  );
}


