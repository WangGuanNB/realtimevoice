import { ArrowRight } from "lucide-react";
import { Blog as BlogType } from "@/types/blocks/blog";

export default function Blog({ blog }: { blog: BlogType }) {
  if (blog.disabled) {
    return null;
  }

  return (
    <section className="w-full py-16">
      <div className="container flex flex-col items-center gap-8 lg:px-16">
        <div className="text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-wider">
            {blog.label}
          </p>
          <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
            {blog.title}
          </h2>
          <p className="mb-8 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg">
            {blog.description}
          </p>
          
          {blog.tools_notice && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📚 {blog.tools_notice.text}{" "}
                <a href="/" className="text-blue-600 hover:text-blue-800 font-medium underline decoration-2 underline-offset-2">
                  {blog.tools_notice.link_text}
                </a>
                {" "}{blog.tools_notice.suffix}
              </p>
            </div>
          )}
        </div>
        <div className="w-full flex flex-wrap items-start">
          {blog.items?.map((item, idx) => (
            <a
              key={idx}
              href={item.url || (item.locale && item.locale !== "en" ? `/${item.locale}/blog/${item.slug}` : `/blog/${item.slug}`)}
              target={item.target || "_self"}
              className="w-full md:w-1/3 p-4"
            >
              <div className="flex flex-col overflow-clip rounded-xl border border-border">
                {item.cover_url && (
                  <div>
                    <img
                      src={item.cover_url}
                      alt={item.title || ""}
                      className="aspect-16/9 h-full w-full object-cover object-center"
                    />
                  </div>
                )}
                <div className="px-4 py-4 md:px-4 md:py-4 lg:px-4 lg:py-4">
                  <h3 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl lg:mb-6">
                    {item.title}
                  </h3>
                  <p className="mb-3 text-muted-foreground md:mb-4 lg:mb-6">
                    {item.description}
                  </p>
                  {blog.read_more_text && (
                    <p className="flex items-center hover:underline">
                      {blog.read_more_text}
                      <ArrowRight className="ml-2 size-4" />
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
