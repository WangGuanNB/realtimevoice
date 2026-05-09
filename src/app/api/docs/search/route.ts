import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

// 避免在 Next 构建阶段对该 Route 进行静态评估，强制运行时动态处理
export const dynamic = "force-dynamic";

// 默认使用英文分词。对于不被 Orama 支持的语言（如 zh），强制回退到 english，避免构建时报
// LANGUAGE_NOT_SUPPORTED 错误。
// 为了避免 Orama 对 zh 语言报错，这里在搜索阶段将 i18n.languages 限制为 ["en"]，
// 不影响页面的多语言展示，仅影响搜索分词构建。
const patchedSource: any = {
  ...(source as any),
  i18n: {
    ...((source as any).i18n ?? {}),
    defaultLanguage: "en",
    languages: ["en"],
  },
};

const handler = createFromSource(patchedSource, {
  // https://docs.orama.com/open-source/supported-languages
  language: "english",
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  // 无条件强制 english，避免构建阶段传入 zh 触发不支持错误
  url.searchParams.set("language", "english");
  return handler.GET(new Request(url));
}
