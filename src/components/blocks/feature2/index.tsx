"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Fade from "embla-carousel-fade";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { Section as SectionType } from "@/types/blocks/section";
import { motion, useInView } from "framer-motion";

const DURATION = 5000;

export default function Feature2({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const [api, setApi] = useState<CarouselApi>();
  const [currentAccordion, setCurrentAccordion] = useState("1");
  
  // 动画 refs - 优化性能，每次滚动都触发
  const headerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const headerInView = useInView(headerRef, { 
    once: false, 
    margin: "-50px",
    amount: 0.3 
  });
  const leftInView = useInView(leftRef, { 
    once: false, 
    margin: "-50px",
    amount: 0.3 
  });
  const rightInView = useInView(rightRef, { 
    once: false, 
    margin: "-50px",
    amount: 0.3 
  });

  useEffect(() => {
    api?.scrollTo(+currentAccordion - 1);
    const interval = setInterval(() => {
      setCurrentAccordion((prev) => {
        const next = parseInt(prev) + 1;
        return next > 3 ? "1" : next.toString();
      });
    }, DURATION);

    return () => clearInterval(interval);
  }, [api, currentAccordion]);

  // 动画变体 - 优化性能
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  const slideLeftVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  const slideRightVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 },
    },
  };

  return (
    <section id={section.name} className="py-12 md:py-20">
      <div className="container">
        <motion.div
          ref={headerRef}
          initial="hidden"
          animate={headerInView ? "visible" : "hidden"}
          variants={fadeUpVariants}
          style={{ willChange: "transform, opacity" }}
          className="mx-auto max-w-4xl space-y-6 text-center md:space-y-12"
        >
          {section.label && (
            <Badge variant="outline" className="mb-4">
              {section.label}
            </Badge>
          )}
          <h2 className="text-balance text-4xl font-medium lg:text-5xl">
            {section.title}
          </h2>
          {section.description && (
            <p className="mx-auto max-w-3xl text-muted-foreground lg:text-lg">
              {section.description}
            </p>
          )}
        </motion.div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:items-start">
          <motion.div
            ref={leftRef}
            initial="hidden"
            animate={leftInView ? "visible" : "hidden"}
            variants={slideLeftVariants}
            style={{ willChange: "transform, opacity" }}
            className="flex flex-col"
          >
            <Accordion
              type="single"
              value={currentAccordion}
              onValueChange={(value) => {
                setCurrentAccordion(value);
                if (value) {
                  api?.scrollTo(+value - 1);
                }
              }}
              className="space-y-4"
            >
              {section.items?.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={(i + 1).toString()}
                  className="rounded-xl bg-background/90 px-4"
                >
                  <AccordionTrigger className="gap-4 py-4 text-left text-base font-semibold lg:text-lg">
                    <div className="flex items-center gap-2">
                      {item.icon && (
                        <Icon
                          name={item.icon}
                          className="size-4 shrink-0 text-primary"
                        />
                      )}
                      <span>{item.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-sm text-muted-foreground lg:text-base">
                    <div className="space-y-4">
                      {item.description && <p>{item.description}</p>}
                      
                      {/* CTA 按钮组 */}
                      {item.buttons && item.buttons.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {item.buttons.map((button, btnIndex) => (
                            <Link
                              key={btnIndex}
                              href={button.url as any}
                              target={button.target || undefined}
                              className="flex items-center"
                            >
                              {btnIndex === 0 ? (
                                <Button
                                  size="sm"
                                  variant={button.variant || "default"}
                                  className="rounded-md px-4 py-2 text-sm font-semibold shadow-sm"
                                >
                                  {button.icon && (
                                    <Icon
                                      name={button.icon}
                                      className="mr-2 size-4"
                                    />
                                  )}
                                  {button.title}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-md border-2 px-4 py-2 text-sm font-semibold"
                                >
                                  {button.icon && (
                                    <Icon
                                      name={button.icon}
                                      className="mr-2 size-4"
                                    />
                                  )}
                                  {button.title}
                                </Button>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
          <motion.div
            ref={rightRef}
            initial="hidden"
            animate={rightInView ? "visible" : "hidden"}
            variants={slideRightVariants}
            style={{ willChange: "transform, opacity" }}
            className="flex items-start rounded-3xl border border-border/60 bg-background/90 p-3 shadow-sm"
          >
            <Carousel
              opts={{
                duration: 50,
              }}
              setApi={setApi}
              plugins={[Fade()]}
            >
              <CarouselContent>
                {section.items?.map((item, i) => (
                  <CarouselItem key={i}>
                    <div className="h-full min-h-[320px] w-full overflow-hidden rounded-2xl lg:min-h-[420px]">
                      <img
                        src={item.image?.src}
                        alt={item.image?.alt || item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
