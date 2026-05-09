import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";
import { Footer } from "@/types/blocks/footer";
import { Pricing } from "@/types/blocks/pricing";

export interface LandingPage {
  header?: Header;
  hero?: Hero;
  branding?: Section;
  introduce?: Section;
  benefit?: Section;
  usage?: Section;
  feature?: Section;
  showcase?: Section;
  stats?: Section;
  pricing?: Pricing;
  testimonial?: Section;
  faq?: Section;
  cta?: Section;
  footer?: Footer;
}

export interface PricingPage {
  pricing?: Pricing;
  faq?: Section;
}

export interface ShowcasePage {
  showcase?: Section;
}

export interface AboutPage {
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  title: string;
  intro: string;
  story: {
    title: string;
    content: string;
  };
  mission: {
    title: string;
    empowerment: {
      title: string;
      description: string;
    };
    community: {
      title: string;
      description: string;
    };
    privacy: {
      title: string;
      description: string;
    };
    innovation: {
      title: string;
      description: string;
    };
  };
  features: {
    title: string;
    fast: {
      title: string;
      description: string;
    };
    matching: {
      title: string;
      description: string;
    };
    global: {
      title: string;
      description: string;
    };
  };
  contact: {
    title: string;
    description: string;
    notice: string;
  };
  ready: {
    title: string;
    description: string;
    homepage_link: string;
    description_continued: string;
    subtitle: string;
  };
  footer: {
    copyright: string;
    privacy: string;
  };
}

export interface ImageGeneratorPage extends LandingPage {
  metadata?: {
    title: string;
    description: string;
    keywords?: string[];
  };
  tool?: {
    title?: string;
    description?: string;
    promptPlaceholder?: string;
    styleLabel?: string;
    styles?: { value: string; label: string }[];
    buttonText?: string;
    generatingText?: string;
  };
}

// Export the new page types
export type { AboutPage };
