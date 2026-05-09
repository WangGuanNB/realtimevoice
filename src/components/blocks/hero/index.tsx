'use client';

import React, { type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { RetroGrid } from "@/components/ui/retro-grid";

const heroAnimationStyles = `
@keyframes heroTextUp {
  0% { opacity: 0; transform: translateY(28px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes heroTextDown {
  0% { opacity: 0; transform: translateY(-24px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.hero-text-up {
  animation: heroTextUp 0.85s ease forwards;
}
.hero-text-down {
  animation: heroTextDown 0.85s ease forwards;
}
`;

export default function Hero({
  hero,
  children,
}: {
  hero: HeroType;
  children?: ReactNode;
}) {
  if (hero.disabled) return null;

  const content =
    hero.variant === "tool" ? (
      <ToolHero hero={hero}>{children}</ToolHero>
    ) : hero.variant === "compact" ? (
      <CompactHero hero={hero} />
    ) : (
      <DefaultHero hero={hero} />
    );

  return (
    <>
      {content}
      <style jsx global>{heroAnimationStyles}</style>
    </>
  );
}

function DefaultHero({ hero }: { hero: HeroType }) {
  const highlightText = hero.highlight_text;
  const texts = highlightText ? hero.title?.split(highlightText, 2) : null;

  return (
    <HeroBackdrop className="py-24">
      <div className="container max-w-5xl space-y-8 text-center">
        {hero.show_badge && (
          <div className="flex justify-center">
            <img src="/imgs/badges/phdaily.svg" alt="phdaily" className="h-10 object-cover" />
          </div>
        )}

        {hero.announcement && (
          <Link
            href={hero.announcement.url as any}
            className="hero-text-down mx-auto inline-flex items-center gap-3 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur"
          >
            {hero.announcement.label && <Badge>{hero.announcement.label}</Badge>}
            {hero.announcement.title}
          </Link>
        )}

        {texts && texts.length > 1 ? (
          <h1 className="hero-text-down mx-auto max-w-5xl text-balance text-4xl font-bold text-foreground leading-[1.3] lg:text-7xl lg:leading-[1.6]">
            {texts[0]?.split("\n").map((line, index, array) => (
              <React.Fragment key={index}>
                {line}
                {index < array.length - 1 && <br />}
              </React.Fragment>
            ))}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {highlightText}
            </span>
            <span className="block text-3xl text-foreground/80 lg:text-6xl">
              {texts[1]?.split("\n").map((line, index, array) => (
                <React.Fragment key={index}>
                  {line}
                  {index < array.length - 1 && <br />}
                </React.Fragment>
              ))}
            </span>
          </h1>
        ) : (
          <h1 className="hero-text-down mx-auto max-w-4xl text-balance text-4xl font-bold text-foreground leading-[1.3] lg:text-7xl lg:leading-[1.6]">
            {hero.title?.split("\n").map((line, index, array) => (
              <React.Fragment key={index}>
                {line}
                {index < array.length - 1 && <br />}
              </React.Fragment>
            ))}
          </h1>
        )}

        <p
          className="hero-text-up mx-auto max-w-3xl text-2xl text-muted-foreground leading-[1.8] lg:text-3xl lg:leading-[2.0]"
          dangerouslySetInnerHTML={{ __html: hero.description || "" }}
        />

        {hero.buttons && (
          <div className="hero-text-up flex flex-wrap justify-center gap-3">
            {hero.buttons.map((item, i) => (
              <Link
                key={`${item.title}-${i}`}
                href={item.url as any}
                target={item.target || ""}
                className="flex"
              >
                <Button className="min-w-[180px]" size="lg" variant={item.variant || "default"}>
                  {item.icon && <Icon name={item.icon} className="mr-2" />}
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
        )}

        {hero.tip && (
          <p className="hero-text-up text-sm text-muted-foreground">{hero.tip}</p>
        )}

        {hero.show_happy_users && <HappyUsers />}
      </div>
    </HeroBackdrop>
  );
}

function ToolHero({
  hero,
  children,
}: {
  hero: HeroType;
  children?: ReactNode;
}) {
  const plainDescription = hero.description
    ? hero.description.replace(/<[^>]+>/g, "")
    : undefined;

  return (
    <HeroBackdrop className="min-h-0 pt-20 pb-12 md:pt-28 md:pb-16" solidBackground>
      <div className="container mx-auto max-w-3xl space-y-8 text-center">
        <h1 className="hero-text-down text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
          {hero.title}
          {hero.highlight_text && (
            <>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/70 to-primary/50 bg-clip-text text-transparent">
                {hero.highlight_text}
              </span>
            </>
          )}
        </h1>

        {plainDescription && (
          <p className="hero-text-up mx-auto max-w-2xl text-base text-muted-foreground">
            {plainDescription}
          </p>
        )}

        {children}
      </div>
    </HeroBackdrop>
  );
}

function CompactHero({ hero }: { hero: HeroType }) {
  const fallbackButtons = [
    {
      title: "Build Website Free Now",
      url: "/#generator",
    },
    {
      title: "Explore Features",
      url: "/#feature",
      variant: "secondary" as const,
    },
  ];

  const buttons =
    hero.buttons && hero.buttons.length > 0 ? hero.buttons : fallbackButtons;

  const metrics =
    (hero.metrics && hero.metrics.length > 0
      ? hero.metrics
      : hero.tip
        ? [hero.tip]
        : []) || [];

  const plainDescription = hero.description
    ? hero.description.replace(/<[^>]+>/g, "")
    : undefined;

  return (
    <HeroBackdrop className="py-20">
      <div className="container mx-auto max-w-4xl space-y-5 text-center">
        {hero.announcement?.label && (
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1 text-sm text-muted-foreground backdrop-blur">
            <Badge>{hero.announcement.label}</Badge>
            <span>{hero.announcement.title}</span>
          </div>
        )}

        <h1 className="hero-text-down text-balance text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.2]">
          {hero.title}
          {hero.highlight_text && (
            <>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/70 to-primary/50 bg-clip-text text-transparent">
                {hero.highlight_text}
              </span>
            </>
          )}
        </h1>

        {plainDescription && (
          <p className="hero-text-up mx-auto max-w-3xl text-base text-muted-foreground">
            {plainDescription}
          </p>
        )}

        {buttons.length > 0 && (
          <div className="hero-text-up flex flex-wrap justify-center gap-3">
            {buttons.slice(0, 2).map((button, index) => (
              <Link
                key={`${button.title}-${index}`}
                href={button.url as any}
                target={'target' in button && button.target ? button.target : undefined}
                className="flex"
              >
                <Button
                  size="lg"
                  variant={'variant' in button && button.variant ? button.variant : (index === 0 ? "default" : "secondary")}
                  className="min-w-[160px]"
                >
                  {'icon' in button && button.icon && <Icon name={button.icon} className="mr-2" />}
                  {button.title}
                </Button>
              </Link>
            ))}
          </div>
        )}

        {metrics.length > 0 && (
          <p className="hero-text-up text-xs uppercase tracking-[0.35em] text-muted-foreground">
            {metrics.map((item, index) => (
              <React.Fragment key={`${item}-${index}`}>
                {index > 0 && <span className="px-1">•</span>}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </p>
        )}

        {hero.show_happy_users && <HappyUsers />}
      </div>
    </HeroBackdrop>
  );
}

function HeroBackdrop({
  children,
  className,
  solidBackground = false,
}: {
  children: ReactNode;
  className?: string;
  /** When true, use solid background without RetroGrid pattern (e.g. for tool hero) */
  solidBackground?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[860px] w-full items-center justify-center overflow-hidden px-4 text-foreground",
        solidBackground ? "bg-background" : "bg-transparent",
        className,
      )}
    >
      {!solidBackground && (
        <div className="pointer-events-none absolute inset-0">
          <RetroGrid className="opacity-60 dark:opacity-75" angle={60} />
        </div>
      )}

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

