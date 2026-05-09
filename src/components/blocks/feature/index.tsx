"use client";

import Icon from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Section as SectionType } from "@/types/blocks/section";
import {
  Eye,
  HdmiPort,
  Layout,
  Star,
  Cloud,
  Share2,
  Zap,
  Cpu,
  Fingerprint,
  Pencil,
  Settings2,
  Sparkles,
} from "lucide-react";
import { ComponentType } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// 图标映射：将 Ri 图标名称映射到 lucide-react 图标
const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  RiEyeLine: Eye,
  RiHdLine: HdmiPort,
  RiLayoutLine: Layout,
  RiStarSLine: Star,
  RiCloudLine: Cloud,
  RiShareLine: Share2,
  RiZapLine: Zap,
  RiCpuLine: Cpu,
  RiFingerprintLine: Fingerprint,
  RiPencilLine: Pencil,
  RiSettingsLine: Settings2,
  RiSparklingLine: Sparkles,
};

export default function Feature({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  // 标题区域动画 ref
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, {
    once: false,
    margin: "-50px",
    amount: 0.3,
  });

  // 网格区域动画 ref
  const gridRef = useRef(null);
  const gridInView = useInView(gridRef, {
    once: false,
    margin: "-50px",
    amount: 0.2,
  });

  // 从上往下飞入动画变体
  const fadeUpVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  // 功能卡片动画变体 - 从下往上淡入，带延迟
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
        delay: i * 0.1, // 每个卡片依次延迟
      },
    }),
  };

  return (
    <section id={section.name} className="py-12 md:py-20">
      <div className="container space-y-8 md:space-y-16">
        {/* 标题区域 - 带从上往下飞入动画 */}
        <motion.div
          ref={headerRef}
          initial="hidden"
          animate={headerInView ? "visible" : "hidden"}
          variants={fadeUpVariants}
          style={{ willChange: "transform, opacity" }}
          className="relative z-10 mx-auto max-w-4xl space-y-6 text-center md:space-y-12"
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

        {/* 功能网格 - 带圆角、阴影、背景，参照 what 组件 */}
        <motion.div
          ref={gridRef}
          initial="hidden"
          animate={gridInView ? "visible" : "hidden"}
          className="relative mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {section.items?.map((item, i) => {
            // 尝试从映射中获取 lucide-react 图标，否则使用原有的 Icon 组件
            const LucideIcon = item.icon ? iconMap[item.icon] : null;

            return (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                style={{ willChange: "transform, opacity" }}
                className="space-y-3 rounded-2xl border bg-card/30 p-8 text-center shadow-sm backdrop-blur-sm"
              >
                <div className="flex items-center justify-center gap-2">
                  {LucideIcon ? (
                    <LucideIcon className="size-4 text-primary" />
                  ) : item.icon ? (
                    <Icon name={item.icon} className="size-4 text-primary" />
                  ) : null}
                  <h3 className="text-sm font-medium">{item.title}</h3>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
