import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section as SectionType } from "@/types/blocks/section";
import { Link } from "@/i18n/navigation";

interface FAQProps {
  section: SectionType;
  /** default: 左右布局 | stacked: 上下堆叠全宽手风琴 */
  layout?: "default" | "stacked";
}

export default function FAQ({ section, layout = "default" }: FAQProps) {
  if (section.disabled) {
    return null;
  }

  const headerBlock = (
    <div className="space-y-6">
      {section.label && (
        <Badge variant="outline" className="mb-4">
          {section.label}
        </Badge>
      )}
      <h2 className="text-balance text-4xl font-medium lg:text-5xl">
        {section.title}
      </h2>
      {section.description && (
        <p className="text-muted-foreground lg:text-lg">
          {section.description}
        </p>
      )}
      {section.buttons && section.buttons.length > 0 && layout === "default" && (
        <div className="pt-4">
          <Button asChild size="lg">
            <Link href={section.buttons[0].url || "#"}>
              {section.buttons[0].title}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );

  const accordionBlock = (
    <Accordion type="single" collapsible className="w-full">
      {section.items?.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="border border-border rounded-lg mb-3 last:mb-0 bg-card px-4 data-[state=open]:border-primary/50"
        >
          <AccordionTrigger className="text-left hover:no-underline py-4 hover:bg-transparent">
            <span className="text-base font-semibold pr-8">
              {item.title}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-4">
            <p className="text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  if (layout === "stacked") {
    return (
      <section id={section.name} className="py-12 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            {headerBlock}
          </div>
          <div className="mx-auto max-w-3xl">
            {accordionBlock}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={section.name} className="py-12 md:py-20">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div>{headerBlock}</div>
          <div className="lg:pl-8">
            <Accordion type="single" collapsible className="w-full">
              {section.items?.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-0 border-b border-border last:border-b-0 py-4 first:pt-0"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-0">
                    <span className="text-base font-semibold pr-8">
                      {item.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-0">
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
