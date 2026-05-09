import Showcase from "@/components/blocks/showcase";
import { getShowcasePage } from "@/services/page";

// 启用 ISR：展示页面可能更新，2小时重新生成一次
export const revalidate = 7200;

export default async function ShowcasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getShowcasePage(locale);

  return <>{page.showcase && <Showcase section={page.showcase} />}</>;
}
