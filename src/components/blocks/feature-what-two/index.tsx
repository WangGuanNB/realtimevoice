"use client";

import Icon from "@/components/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Section as SectionType } from "@/types/blocks/section";
import { Link } from "@/i18n/navigation";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function FeatureWhatTwo({
  section,
}: {
  section: SectionType;
}) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-12 md:py-20">
      <div className="container max-w-7xl">
        {/* 主内容区域 */}
        <div className="rounded-3xl bg-card/30 p-8 shadow-sm backdrop-blur-sm lg:p-12">
          {/* 顶部标题区域 */}
          <header className="mx-auto mb-16 max-w-3xl text-center lg:mb-20">
            {section.label && (
              <span className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {section.label}
              </span>
            )}
            {section.title && (
              <h2 className="mb-4 text-balance text-4xl font-medium lg:text-5xl">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="mx-auto max-w-3xl text-muted-foreground lg:text-lg">
                {section.description}
              </p>
            )}
          </header>

          {/* 功能区块列表 */}
          <div className="space-y-24 lg:space-y-32">
          {section.items?.map((item, index) => {
            const hasImage = Boolean(item.image?.src);
            const isReversed = index % 2 === 1;
            const hasButtons = item.buttons && item.buttons.length > 0;
            
            // 动画配置：奇数从左侧飞入，偶数从右侧飞入
            const imageDirection = isReversed ? "right" : "left";
            const contentDirection = isReversed ? "left" : "right";
            
            // 为图片和内容分别创建 ref
            const imageRef = useRef(null);
            const contentRef = useRef(null);
            // 改为每次进入视口都触发动画，并优化性能
            const imageInView = useInView(imageRef, { 
              once: false, 
              margin: "-50px",
              amount: 0.3 // 当30%的元素可见时触发
            });
            const contentInView = useInView(contentRef, { 
              once: false, 
              margin: "-50px",
              amount: 0.3
            });

            // 动画变体 - 优化性能，使用GPU加速的属性
            const imageVariants = {
              hidden: {
                opacity: 0,
                x: imageDirection === "left" ? -50 : 50, // 减少移动距离，降低性能消耗
              },
              visible: {
                opacity: 1,
                x: 0,
                transition: {
                  duration: 0.5, // 缩短动画时间
                  ease: [0.25, 0.1, 0.25, 1], // 使用更平滑的缓动函数
                },
              },
            };

            const contentVariants = {
              hidden: {
                opacity: 0,
                x: contentDirection === "left" ? -50 : 50, // 减少移动距离
              },
              visible: {
                opacity: 1,
                x: 0,
                transition: {
                  duration: 0.5, // 缩短动画时间
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: 0.1, // 减少延迟
                },
              },
            };

            return (
              <article
                key={index}
                className={cn(
                  "grid grid-cols-1 items-stretch gap-12 lg:gap-16",
                  hasImage ? "lg:grid-cols-2" : "lg:grid-cols-[1fr]"
                )}
              >
                {/* 图片区域 - 带飞入动画 */}
                {hasImage && (
                  <motion.div
                    ref={imageRef}
                    initial="hidden"
                    animate={imageInView ? "visible" : "hidden"}
                    variants={imageVariants}
                    style={{ willChange: "transform, opacity" }} // 性能优化提示
                    className={cn(
                      "order-1 flex items-start overflow-hidden rounded-2xl",
                      isReversed && "lg:order-2"
                    )}
                  >
                    <div className="relative aspect-[4/3] w-full h-full bg-muted">
                      <img
                        src={item.image?.src}
                        alt={item.image?.alt || item.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </motion.div>
                )}

                {/* 内容区域 - 带飞入动画 */}
                <motion.div
                  ref={contentRef}
                  initial="hidden"
                  animate={contentInView ? "visible" : "hidden"}
                  variants={contentVariants}
                  style={{ willChange: "transform, opacity" }} // 性能优化提示
                  className={cn(
                    "order-2 flex flex-col items-start justify-center gap-6 text-left",
                    isReversed && hasImage && "lg:order-1"
                  )}
                >
                  <div className="flex flex-col gap-4">
                    {/* 徽章/标签 - 类似参考样式 */}
                    {(item.icon || item.label) && (
                      <div className="flex items-center gap-2">
                        {item.icon && (
                          <Icon
                            name={item.icon}
                            className="size-4 text-primary"
                          />
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.label || "Feature"}
                        </span>
                      </div>
                    )}

                    {/* 标题 */}
                    <h3 className="text-2xl font-bold leading-tight tracking-tight lg:text-3xl">
                      {item.title}
                    </h3>

                    {/* 描述文字 - 优化行高和间距 */}
                    {item.description && (
                      <p className="text-sm leading-6 text-muted-foreground lg:text-base lg:leading-7">
                        {item.description}
                      </p>
                    )}

                    {/* 列表（如果有） */}
                    {item.list && item.list.length > 0 && (
                      <ul className="grid gap-2 text-sm text-muted-foreground lg:grid-cols-2 lg:text-base">
                        {item.list.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-2 inline-block size-1.5 rounded-full bg-primary"></span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* CTA 按钮组 - 固定在底部 */}
                  {hasButtons && (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      {item.buttons?.map((button, btnIndex) => (
                        <Link
                          key={btnIndex}
                          href={button.url as any}
                          target={button.target || undefined}
                          className="flex items-center"
                        >
                          {btnIndex === 0 ? (
                            // 主按钮：实心样式
                            <Button
                              size="lg"
                              variant={button.variant || "default"}
                              className="rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm"
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
                            // 次按钮：边框样式
                            <Button
                              size="lg"
                              variant="outline"
                              className="rounded-md border-2 px-4 py-2.5 text-sm font-semibold"
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
                </motion.div>
              </article>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}

